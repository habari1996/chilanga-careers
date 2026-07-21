-- Lock down public read/write access to applicant PII.
--
-- Before this migration, the `applications`, `grade12_results`, and `jobs`
-- tables were reachable with the app's public (anon) API key with no Row
-- Level Security restricting SELECT/UPDATE/DELETE. That meant anyone could
-- read every applicant's name, email, phone, NRC number, DOB, address,
-- criminal-record disclosure, and uploaded document URLs (NRC copy, CV,
-- certificates) with a single unauthenticated REST call, and could insert
-- or overwrite rows directly, bypassing the application form entirely.
--
-- This migration:
--   1. Enables RLS on applications, grade12_results, and jobs.
--   2. Keeps public INSERT on applications/grade12_results so the Apply
--      form keeps working without a login.
--   3. Restricts SELECT/UPDATE on applications and grade12_results to
--      authenticated (HR) sessions only.
--   4. Keeps jobs readable by everyone (job listings are meant to be
--      public) but restricts INSERT/UPDATE (posting/editing jobs) to
--      authenticated sessions.
--   5. Adds a narrow `track_application` RPC so the public "Track Your
--      Application" page can look up a single application by email
--      without needing a table-wide SELECT policy.
--
-- Run this in the Supabase SQL Editor for this project, or via the
-- Supabase CLI: `supabase db push`.

-- ── applications ────────────────────────────────────────────────────────
alter table public.applications enable row level security;

drop policy if exists "public insert applications" on public.applications;
create policy "public insert applications"
  on public.applications
  for insert
  to anon
  with check (true);

drop policy if exists "staff read applications" on public.applications;
create policy "staff read applications"
  on public.applications
  for select
  to authenticated
  using (true);

drop policy if exists "staff update applications" on public.applications;
create policy "staff update applications"
  on public.applications
  for update
  to authenticated
  using (true);

-- No anon SELECT/UPDATE/DELETE policy is defined, so those are denied by
-- default once RLS is enabled.

-- ── grade12_results ─────────────────────────────────────────────────────
alter table public.grade12_results enable row level security;

drop policy if exists "public insert grade12 results" on public.grade12_results;
create policy "public insert grade12 results"
  on public.grade12_results
  for insert
  to anon
  with check (true);

drop policy if exists "staff read grade12 results" on public.grade12_results;
create policy "staff read grade12 results"
  on public.grade12_results
  for select
  to authenticated
  using (true);

-- ── jobs ─────────────────────────────────────────────────────────────────
alter table public.jobs enable row level security;

drop policy if exists "public read jobs" on public.jobs;
create policy "public read jobs"
  on public.jobs
  for select
  to anon, authenticated
  using (true);

drop policy if exists "staff manage jobs insert" on public.jobs;
create policy "staff manage jobs insert"
  on public.jobs
  for insert
  to authenticated
  with check (true);

drop policy if exists "staff manage jobs update" on public.jobs;
create policy "staff manage jobs update"
  on public.jobs
  for update
  to authenticated
  using (true);

-- ── track_application RPC ───────────────────────────────────────────────
-- Returns only the columns the "Track Your Application" page needs, for
-- exactly one email, instead of exposing the whole applications table to
-- anon SELECT.
create or replace function public.track_application(p_email text)
returns table (
  full_name text,
  status text,
  created_at timestamptz,
  qualification text,
  email text
)
language sql
security definer
set search_path = public
as $$
  select full_name, status, created_at, qualification, email
  from public.applications
  where email = lower(p_email)
  order by created_at desc
  limit 1;
$$;

grant execute on function public.track_application(text) to anon, authenticated;
