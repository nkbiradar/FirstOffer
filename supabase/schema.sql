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
-- One row = one Telegram opportunity, extracted (by AI, later) or entered
-- manually. Every field that isn't guaranteed to appear in a Telegram post
-- is nullable — nothing here should be invented if the source doesn't say it.

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
-- writes go through the service-role client from trusted server/admin code.

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
