-- FirstOffer database schema.
-- Represents fresher job/internship opportunities imported from Telegram
-- messages. Kept intentionally simple: only `companies` and `opportunities`.
--
-- The previous ("Antigravity") schema is dropped first so this file can be
-- re-run safely against a database that still has the old shape applied.

create extension if not exists pgcrypto;

-- ── Drop the previous schema ─────────────────────────────────────────────
-- Includes tables that existed on the live database but were never
-- captured in this file (hr_contacts, open_roles, user_applications,
-- saved_companies) — leftovers from the old HR-direct/dashboard/saved-
-- companies features. `cascade` so any other undiscovered dependents on
-- these specific legacy tables are cleared too; nothing here is meant to
-- survive the rebuild.

drop table if exists public.hr_contacts cascade;
drop table if exists public.open_roles cascade;
drop table if exists public.user_applications cascade;
drop table if exists public.saved_companies cascade;
drop function if exists public.create_opportunity(jsonb, jsonb, jsonb);
drop table if exists public.saved_opportunities cascade;
drop table if exists public.opportunity_links cascade;
drop table if exists public.opportunity_contacts cascade;
drop table if exists public.opportunities cascade;
drop table if exists public.companies cascade;

-- ── companies ─────────────────────────────────────────────────────────────

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  slug text not null unique check (length(btrim(slug)) > 0),
  logo_url text,
  website text,
  description text,
  created_at timestamptz not null default now()
);

-- ── opportunities ─────────────────────────────────────────────────────────
-- One row = one Telegram opportunity, entered manually by the admin for now
-- (Step 4) — AI extraction and Telegram automation come later. Every field
-- that isn't guaranteed to appear in a Telegram post is nullable — nothing
-- here should be invented if the source doesn't say it.

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,

  -- Basic opportunity information
  role text not null check (length(btrim(role)) > 0),
  opportunity_type text check (opportunity_type is null or opportunity_type in ('internship', 'full_time')),

  -- Eligibility information
  batch text[] not null default '{}',
  degree text[] not null default '{}',
  branches text[] not null default '{}',

  -- Compensation — kept as free text on purpose. Telegram posts phrase this
  -- as "₹30,000/month", "6 LPA", "₹8–12 LPA", "Unpaid", "Performance based",
  -- "Not disclosed", etc. Do not force these into numeric columns.
  stipend text,
  salary text,

  -- Location
  location text,
  work_mode text check (work_mode is null or work_mode in ('remote', 'hybrid', 'onsite')),

  -- Job content
  skills text[] not null default '{}',
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  eligibility text,
  additional_details text,

  -- Application information
  application_url text,
  google_form_url text,
  hr_email text,
  hr_contact text,
  how_to_apply text,

  -- Deadline
  deadline date,

  -- Source — the original Telegram message is never discarded.
  source text not null default 'telegram',
  source_text text not null check (length(btrim(source_text)) > 0),

  -- Status
  status text not null default 'draft' check (status in ('draft', 'published', 'expired')),

  -- Timestamps
  imported_at timestamptz not null default now(),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep `updated_at` accurate on every row change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row
  execute function public.set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────
-- Only what the read paths actually need: the public listing filters by
-- status and sorts by published_at, opportunities join to companies, expiry
-- and array-membership lookups (batch, skills) are common filters.

create index opportunities_status_published_at_idx
  on public.opportunities (status, published_at desc);
create index opportunities_company_id_idx
  on public.opportunities (company_id);
create index opportunities_deadline_idx
  on public.opportunities (deadline);
create index opportunities_batch_gin_idx
  on public.opportunities using gin (batch);
create index opportunities_skills_gin_idx
  on public.opportunities using gin (skills);

-- ── Row Level Security ───────────────────────────────────────────────────
-- No public insert/update/delete policies exist for either table — all
-- writes go through the service-role client from trusted admin code
-- (lib/supabase/admin.ts), not RLS-granted access.

alter table public.companies enable row level security;
alter table public.opportunities enable row level security;

create policy "Anyone can read companies"
  on public.companies for select
  using (true);

create policy "Anyone can read published, non-expired opportunities"
  on public.opportunities for select
  using (
    status = 'published'
    and (expires_at is null or expires_at > now())
  );

-- ── user_applications ────────────────────────────────────────────────────
-- Google-authenticated job seekers can mark an opportunity as "applied" and
-- see that list on /applications (see lib/data/user-applications.ts,
-- app/api/applications/*, components/ApplyTracker.tsx). This is the first
-- table tied to a real user identity (auth.users) rather than admin-only
-- data — RLS is the actual enforcement here, not application code: a user
-- can only ever select/insert/delete rows where user_id = auth.uid().
--
-- NOTE: this block is additive (`if not exists` throughout) — safe to run
-- on its own against the live database. Do NOT re-run the drop/create
-- statements above this point against production; they're written for a
-- fresh database and would destroy existing companies/opportunities data.

create table if not exists public.user_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  applied_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create index if not exists user_applications_user_id_idx
  on public.user_applications (user_id);
create index if not exists user_applications_opportunity_id_idx
  on public.user_applications (opportunity_id);

alter table public.user_applications enable row level security;

create policy "Users can view their own applications"
  on public.user_applications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own applications"
  on public.user_applications for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own applications"
  on public.user_applications for delete
  using (auth.uid() = user_id);

-- ── user_applications outcome tracking ("did you hear back?") ────────────
-- Lets a user self-report what happened after applying — interview, offer,
-- rejected, or no response — a few days after marking something applied.
-- See lib/data/user-applications.ts, app/api/applications/[opportunityId]/
-- route.ts (PATCH), components/OutcomeTracker.tsx, app/applications/page.tsx.
--
-- NOTE: this block is additive and safe to re-run on its own — do NOT
-- re-run the drop/create statements at the top of this file.

alter table public.user_applications
  add column if not exists outcome text
    check (outcome in ('interview', 'offer', 'rejected', 'no_response')),
  add column if not exists outcome_updated_at timestamptz;

-- No `create policy if not exists` in Postgres, so guard it by hand —
-- makes this block safe to run more than once.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_applications'
      and policyname = 'Users can update their own applications'
  ) then
    create policy "Users can update their own applications"
      on public.user_applications for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ── opportunity_unlocks (Phase 6 — payments) ─────────────────────────────
-- A signed-in job seeker can pay a small UPI fee (via Razorpay) to reveal
-- the HR Email / HR Contact display on one specific opportunity's detail
-- page (app/opportunities/[id]/page.tsx). This does NOT touch the "Apply
-- Now" button — getApplyAction() there is unchanged and still falls back
-- to a mailto: link exactly as before when HR email is an opportunity's
-- only apply route, so an opportunity's core apply flow is never paywalled.
--
-- One row per (user, opportunity): create-order upserts it on every
-- attempt (status starts 'created'), and either the client-side verify
-- call (app/api/payments/verify/route.ts) or the webhook backstop
-- (app/api/payments/webhook/route.ts) flips it to 'paid'.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

create table if not exists public.opportunity_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  razorpay_order_id text not null,
  razorpay_payment_id text,
  amount_paise integer not null,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (user_id, opportunity_id)
);

create index if not exists opportunity_unlocks_user_id_idx
  on public.opportunity_unlocks (user_id);
create index if not exists opportunity_unlocks_razorpay_order_id_idx
  on public.opportunity_unlocks (razorpay_order_id);

alter table public.opportunity_unlocks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'opportunity_unlocks'
      and policyname = 'Users can view their own unlocks'
  ) then
    create policy "Users can view their own unlocks"
      on public.opportunity_unlocks for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- No public insert/update policy — all writes go through the service-role
-- client from the payment API routes (create-order, verify, webhook),
-- matching lib/supabase/admin.ts's existing pattern.

-- ── Rate limiting (fixed-window counters) ───────────────────────────────
-- Vercel serverless functions don't share memory between invocations, so
-- an in-process rate limiter would be a no-op in production. This table
-- backs a simple fixed-window counter instead: one row per (key, window),
-- incremented atomically via check_rate_limit() below. Used first on
-- /api/payments/create-order to slow down abusive order-creation spam
-- (each call hits the Razorpay API). Rows are cheap and short-lived —
-- prune old ones periodically (see prune_rate_limit_hits() below), no
-- cron is wired up for this yet so it currently grows unbounded until run
-- manually or scheduled via pg_cron/a Vercel cron route.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

create table if not exists public.rate_limit_hits (
  key text not null,
  window_start timestamptz not null,
  hit_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (key, window_start)
);

create index if not exists rate_limit_hits_window_start_idx
  on public.rate_limit_hits (window_start);

alter table public.rate_limit_hits enable row level security;
-- No policies: this table is never read or written by the RLS-scoped
-- client — only through the service-role client via check_rate_limit(),
-- which is security definer, and directly by prune_rate_limit_hits().

-- Atomically records one hit for `p_key` in the current fixed window of
-- length `p_window_seconds`, and reports whether the caller is still
-- within `p_max_hits` for that window. security definer so it can be
-- called through the service-role client without a table policy.
create or replace function public.check_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_hits integer
)
returns table (allowed boolean, hit_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_hit_count integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_hits (key, window_start, hit_count, updated_at)
  values (p_key, v_window_start, 1, now())
  on conflict (key, window_start)
    do update set hit_count = public.rate_limit_hits.hit_count + 1,
                  updated_at = now()
  returning public.rate_limit_hits.hit_count into v_hit_count;

  return query select v_hit_count <= p_max_hits, v_hit_count;
end;
$$;

-- Housekeeping — deletes windows older than 1 hour. Not scheduled
-- automatically; run manually, via pg_cron, or a periodic Vercel cron
-- route if row growth becomes a concern.
create or replace function public.prune_rate_limit_hits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limit_hits where window_start < now() - interval '1 hour';
$$;

-- ── user_access (Platform-wide access — one-time payment) ──────────────────
-- A signed-in job seeker pays once for full platform access — reveals HR
-- email/contact and apply links on EVERY opportunity, current and future.
-- One row per user. The create-order route upserts it (status starts
-- 'created'), and either the client-side verify call or the webhook backstop
-- flips it to 'paid'.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

create table if not exists public.user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  razorpay_order_id text not null,
  razorpay_payment_id text,
  amount_paise integer not null,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists user_access_user_id_idx
  on public.user_access (user_id);
create index if not exists user_access_razorpay_order_id_idx
  on public.user_access (razorpay_order_id);

alter table public.user_access enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_access'
      and policyname = 'Users can view their own access'
  ) then
    create policy "Users can view their own access"
      on public.user_access for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- No public insert/update policy — all writes go through the service-role
-- client from the payment API routes (create-order, verify, webhook),
-- matching lib/supabase/admin.ts's existing pattern.

-- ── Testimonials (social proof — homepage "Success stories" carousel) ───
-- Every row here is a real student's real outcome, entered by the admin
-- from /admin/testimonials one at a time as they come in — nothing here
-- is generated or seeded. The public homepage only ever reads rows where
-- is_published = true; the admin can add a testimonial as a private draft
-- (is_published = false) before deciding to show it.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  company_name text not null,
  role text,
  outcome text not null default 'interview' check (outcome in ('interview', 'selected')),
  quote text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists testimonials_published_created_idx
  on public.testimonials (is_published, created_at desc);

alter table public.testimonials enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'testimonials'
      and policyname = 'Anyone can view published testimonials'
  ) then
    create policy "Anyone can view published testimonials"
      on public.testimonials for select
      using (is_published = true);
  end if;
end $$;

-- No public insert/update/delete policy — all writes go through the
-- service-role client from the admin testimonials routes.

-- ── Testimonials — richer profile fields ─────────────────────────────────
-- Adds what the homepage "Success Stories" card grid shows beyond the
-- original marquee: which college the student was at, their graduation
-- batch, a star rating, and an optional profile photo. All nullable/
-- optional — existing rows keep working unchanged, and the admin form
-- (app/admin/testimonials/page.tsx) defaults rating to 5 for new ones.
-- Still zero seed data: every row is entered by hand at /admin/testimonials
-- exactly as before, nothing here inserts anything.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

alter table public.testimonials
  add column if not exists college text,
  add column if not exists graduation_batch text,
  add column if not exists rating smallint check (rating is null or rating between 1 and 5),
  add column if not exists avatar_url text;

-- ── push_subscriptions (Web Push — "new opportunities added" alerts) ───────
-- Browser Push API subscriptions. Deliberately NOT tied to a signed-in
-- user — the site never requires an account to browse, so anyone can
-- enable notifications regardless of login state. One row per browser/
-- device subscription (the endpoint URL is unique per browser+origin).
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- No public select/insert/update/delete policy — every read/write goes
-- through app/api/push/subscribe and app/api/push/unsubscribe using the
-- service-role client, same pattern as opportunity_unlocks/user_access.

-- ── subscriptions (recurring ₹49/month access) ───────────────────────────
-- Replaces the one-time ₹49 unlock for NEW purchases going forward. Anyone
-- who already has a 'paid' row in opportunity_unlocks keeps that lifetime
-- access untouched (see lib/data/opportunity-unlocks.ts's hasFullAccess,
-- which now checks this table OR that one) — this table is additive, not a
-- migration of existing customers.
--
-- One row per Razorpay subscription. Razorpay's subscriptions API has no
-- literal "until cancelled" option — every subscription needs a
-- total_count of billing cycles — so app/api/subscriptions/create/route.ts
-- creates each one with a large total_count (effectively "until the user
-- cancels" for practical purposes) rather than the site imposing its own
-- end date.
--
-- `status` mirrors Razorpay's own subscription lifecycle. Access is
-- granted by lib/data/subscriptions.ts's isSubscriptionAccessActive() when
-- `status = 'active'`, OR when `status = 'cancelled'` and
-- `current_period_end` is still in the future — a grace period so a
-- mandate cancelled early (the customer revokes UPI Autopay from their own
-- banking app, or a mandate fails right after the first charge) doesn't
-- lock out someone who already paid for the current cycle. `halted`
-- (renewal charge failed after retries) gets no such grace, since by
-- definition that cycle was never paid for. Razorpay's own
-- `subscription.halted` / `subscription.cancelled` / `subscription.completed`
-- events are what flip `status` away from 'active' (see
-- app/api/payments/webhook/route.ts, which also stamps `cancelled_at` at
-- that point so /dashboard's messaging stays accurate).
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  razorpay_subscription_id text not null unique,
  razorpay_plan_id text not null,
  status text not null default 'created' check (
    status in ('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired')
  ),
  amount_paise integer not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);
create index if not exists subscriptions_razorpay_subscription_id_idx
  on public.subscriptions (razorpay_subscription_id);

alter table public.subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscriptions'
      and policyname = 'Users can view their own subscriptions'
  ) then
    create policy "Users can view their own subscriptions"
      on public.subscriptions for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- No public insert/update policy — all writes go through the service-role
-- client from app/api/subscriptions/create, app/api/subscriptions/verify,
-- app/api/subscriptions/cancel, and app/api/payments/webhook, matching
-- opportunity_unlocks's existing pattern.

-- ── subscriptions.product (multiple paid products on one table) ─────────
-- The subscriptions table above was built for the single ₹49/month "full
-- access" plan. Adding a second, fully independent product — ₹39/month
-- "Internal HR Openings" — reuses the same table rather than duplicating
-- it: one row per Razorpay subscription either way, `product` says which
-- offering it is, and `razorpay_subscription_id` stays globally unique
-- regardless of product. A user can hold an active row of each product at
-- once; access checks (see lib/data/subscriptions.ts's
-- hasActiveSubscription(userId, product)) always filter by product, so the
-- two are never conflated.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

alter table public.subscriptions
  add column if not exists product text not null default 'full_access';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscriptions_product_check'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_product_check check (product in ('full_access', 'internal_hr'));
  end if;
end $$;

create index if not exists subscriptions_user_id_product_idx
  on public.subscriptions (user_id, product);

-- ── opportunities.is_internal (the "Internal HR Openings" product) ──────
-- Marks an opportunity as part of the ₹39/month Internal HR Openings
-- product instead of the regular free-to-browse listings — set by the
-- admin via the "Internal (HR-direct)" checkbox on the opportunity form.
-- applyPublishedFilter() in lib/data/opportunities.ts excludes these from
-- every general public listing (homepage, /opportunities, category pages,
-- sitemap, related-opportunities) so they genuinely only surface through
-- /internal-openings — the entire point of the product is that these
-- roles aren't findable the normal way. getInternalOpportunities() is the
-- mirror-image query used only by that page.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

alter table public.opportunities
  add column if not exists is_internal boolean not null default false;

create index if not exists opportunities_is_internal_idx
  on public.opportunities (is_internal) where is_internal;

-- ── site_announcement (admin-postable homepage banner) ───────────────────
-- A single, manually-controlled banner the admin can post above "Today's
-- Opportunities" on the homepage — e.g. "Today's opportunities are
-- delayed, check back shortly" on a quiet day, or "15 posted today, more
-- coming shortly" on a busy one. Always exactly one row (fixed id
-- 'singleton') rather than a growing table: posting a new announcement
-- overwrites the previous one, and there's no history to manage. Shown
-- whenever is_active is true, regardless of how many opportunities were
-- published that day (see app/page.tsx) — it's a general-purpose note,
-- not tied to the empty state, so the admin is responsible for removing
-- it once it's no longer relevant. is_active starts (and returns to)
-- false; the message text is kept even after being turned off, so
-- re-posting the same wording is one click of pre-filled text rather than
-- retyping it.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

create table if not exists public.site_announcement (
  id text primary key default 'singleton',
  message text not null default '',
  is_active boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.site_announcement (id, message, is_active)
values ('singleton', '', false)
on conflict (id) do nothing;

alter table public.site_announcement enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'site_announcement'
      and policyname = 'Anyone can read the active announcement'
  ) then
    create policy "Anyone can read the active announcement"
      on public.site_announcement for select
      using (is_active = true);
  end if;
end $$;

-- No public insert/update/delete policy — all writes go through the
-- service-role client from app/api/admin/announcement/route.ts.

-- ── email_optouts ("new opportunity" email alerts) ──────────────────────
-- Every signed-up user gets emailed (at the address they logged in with)
-- whenever new opportunities go live — see lib/email/resend-client.ts and
-- lib/notify/new-opportunity-alerts.ts. Recipients come straight from
-- auth.admin.listUsers(), so there's no separate "subscribed" list to
-- maintain — this table is just the exception list: presence of a row
-- means that user opted out (one-click unsubscribe link in every email,
-- or the toggle on their dashboard), same convention as push_subscriptions
-- being additive/exception-based rather than a full mailing list.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

create table if not exists public.email_optouts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.email_optouts enable row level security;

-- No public select/insert/update/delete policy — every read/write goes
-- through app/api/email/unsubscribe, app/api/email/preference, and
-- lib/email/resend-client.ts using the service-role client, same pattern
-- as push_subscriptions/opportunity_unlocks.

-- ── subscriptions.razorpay_payment_id / razorpay_order_id ────────────────
-- Lets a row in this table be matched back to an exact payment in the
-- Razorpay dashboard (Payments) without guessing from timestamps alone.
-- Populated by app/api/subscriptions/verify/route.ts (the browser-side
-- confirmation right after Razorpay Checkout succeeds) and
-- app/api/payments/webhook/route.ts (subscription.activated/charged
-- events) — both record the payment id for whichever charge most recently
-- activated/renewed the subscription, so this always reflects the LATEST
-- payment, not a full history of every monthly renewal. razorpay_order_id
-- is nullable because Razorpay doesn't always attach an order to a
-- subscription charge (it does for many, but not guaranteed for every
-- renewal cycle).
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file. Existing rows created before this migration will have both
-- columns NULL until their subscription's next renewal (or a cancel and
-- re-subscribe) fills them in.

alter table public.subscriptions
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_order_id text;

-- ── opportunities.premium_group_hint ─────────────────────────────────────
-- Some (not all) external application forms — typically the Google Forms
-- used for a referral-style application — ask a gatekeeping question like
-- "Name of Premium Membership group?" to confirm the applicant is a real,
-- paying FirstOffer subscriber rather than someone who stumbled onto the
-- form link. The admin fills this in per-opportunity with the expected
-- answer (e.g. "SDE Premium Group") only for the listings that actually
-- have that question; it's left blank for every other opportunity. Shown
-- on the opportunity detail page (app/opportunities/[id]/page.tsx) only
-- once the viewer has unlocked full apply access (the same canShowApply
-- check that reveals the HR email/contact/how-to-apply text) — never shown
-- to a locked/unsubscribed visitor, since the whole point is that only
-- genuine subscribers should know the answer.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

alter table public.opportunities
  add column if not exists premium_group_hint text;

-- ── site_visits (admin-only "how many strangers visited" counter) ───────
-- Backs the "Visitors Today" / "Total Visitors" tiles on /admin — see
-- lib/data/site-visits.ts. One row per (visitor, day): every real page
-- load pings app/api/track-visit/route.ts, which mints a long-lived
-- anonymous cookie the first time a browser is seen and upserts a row here
-- with today's date, ignoring the conflict on every later page load that
-- same day. That's what makes both tiles mean UNIQUE visitors rather than
-- raw page views — a person browsing ten pages, or coming back five times
-- in one day, still only ever adds one row for that day. "Total Visitors"
-- then counts distinct visitor_id across every row ever, so a visitor who
-- returns on a different day doesn't get double-counted either. Not a full
-- analytics system on purpose — no page-level detail, no referrers, no
-- geography — just the one headline number that was asked for. Never read
-- or written by the RLS-scoped client, same convention as rate_limit_hits.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

create table if not exists public.site_visits (
  visitor_id text not null,
  day date not null,
  first_seen_at timestamptz not null default now(),
  primary key (visitor_id, day)
);

create index if not exists site_visits_day_idx
  on public.site_visits (day);

alter table public.site_visits enable row level security;
-- No policies: only app/api/track-visit/route.ts (write) and
-- lib/data/site-visits.ts's getSiteVisitStats() (read) ever touch this
-- table, both through the service-role client.

-- ── opportunities.email_digest_sent_at (batched "new opportunity" emails) ──
-- Publishing an opportunity used to fire an instant email to every
-- signed-up user via after() (see lib/notify/new-opportunity-alerts.ts).
-- With ~38 opportunities/day, that meant ~38 separate broadcasts/day, each
-- listing every user again — Resend's rate limit (429s, visible in its
-- Logs tab) and the free plan's 100/day, 3,000/month caps got hit fast.
--
-- Fix: publishing no longer sends email at all (push notifications still
-- fire instantly — see notifyPush() in new-opportunity-alerts.ts, unaffected
-- by this). Instead, a Vercel Cron job (see vercel.json) hits
-- /api/cron/email-digest once a day, which collects every published
-- opportunity with email_digest_sent_at still null, sends ONE combined
-- digest email per audience (public / Internal HR) instead of one per
-- opportunity, and stamps every opportunity it just covered with this
-- timestamp so the next run doesn't repeat them. See
-- lib/email/opportunity-digest.ts for the actual query + send.
--
-- NOTE: this block is additive and safe to run on its own against the live
-- database — do NOT re-run the drop/create statements at the top of this
-- file.

alter table public.opportunities
  add column if not exists email_digest_sent_at timestamptz;

create index if not exists opportunities_email_digest_pending_idx
  on public.opportunities (published_at)
  where status = 'published' and email_digest_sent_at is null;
