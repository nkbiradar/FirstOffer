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
