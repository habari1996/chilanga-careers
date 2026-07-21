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

-- Remove the pre-existing policy that granted anon SELECT on ALL rows
-- (it was defined as `using (true)` for the anon role, which exposed the
-- whole table). Public application lookups now go through the
-- track_application() RPC below instead.
drop policy if exists "applicant_can_track_own" on public.applications;

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

-- ── submit_application RPC ──────────────────────────────────────────────
-- The Apply form needs the new row's id back (to attach grade12_results),
-- but there is no anon SELECT policy on applications, so a direct
-- .insert().select() fails on the RETURNING clause. This SECURITY DEFINER
-- function inserts server-side and returns only the new id. It explicitly
-- omits id/created_at/score from the insert so the client can't set them.
create or replace function public.submit_application(p jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.applications;
  new_id bigint;
begin
  rec := jsonb_populate_record(null::public.applications, p);

  insert into public.applications (
    full_name, email, phone, alt_phone, dob, age, gender, nationality,
    qualification, institution, field_of_study, graduation_year,
    skills, experience, cv_url, nrc_url, qualifications_url,
    tertiary_certificate_url, cv_text, job_id, status
  ) values (
    rec.full_name, rec.email, rec.phone, rec.alt_phone, rec.dob, rec.age, rec.gender, rec.nationality,
    rec.qualification, rec.institution, rec.field_of_study, rec.graduation_year,
    rec.skills, rec.experience, rec.cv_url, rec.nrc_url, rec.qualifications_url,
    rec.tertiary_certificate_url, rec.cv_text, rec.job_id, coalesce(rec.status, 'New')
  )
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.submit_application(jsonb) to anon, authenticated;
