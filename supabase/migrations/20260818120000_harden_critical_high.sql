-- =============================================================================
-- Harden critical + high findings from security review (2026-08-18)
-- =============================================================================
-- 1. Close anonymous bypasses on applications / grade12 / submit_application
-- 2. is_hr() only trusts active hr_staff rows (no domain OR)
-- 3. Public jobs: Published only
-- 4. track_application requires email + full_name; returns less data
-- 5. Role-gated job updates
-- 6. submit_application_full RPC: application + grade12 in one transaction
-- =============================================================================

-- ── 1. is_hr() — table only, SECURITY DEFINER (no RLS recursion) ─────────
create or replace function public.is_hr()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1 from public.hr_staff
      where lower(email) = lower(auth.jwt() ->> 'email')
        and is_active = true
    ),
    false
  );
$$;

create or replace function public.current_hr_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.hr_staff
  where lower(email) = lower(auth.jwt() ->> 'email')
    and is_active = true
  limit 1;
$$;

create or replace function public.can_approve_jobs()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1 from public.hr_staff
      where lower(email) = lower(auth.jwt() ->> 'email')
        and is_active = true
        and role in ('admin', 'hr_director')
    ),
    false
  );
$$;

grant execute on function public.is_hr() to authenticated;
grant execute on function public.current_hr_role() to authenticated;
grant execute on function public.can_approve_jobs() to authenticated;

-- ── 2. Close anonymous application / grade12 inserts ─────────────────────
drop policy if exists "public insert applications" on public.applications;
drop policy if exists "public insert grade12 results" on public.grade12_results;

revoke execute on function public.submit_application(jsonb) from anon;
revoke execute on function public.submit_application(jsonb) from public;
revoke execute on function public.submit_application(jsonb) from authenticated;

-- ── 3. Combined transactional submit (service role only) ─────────────────
create or replace function public.submit_application_full(
  p jsonb,
  p_grade12 jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  item jsonb;
begin
  insert into public.applications (
    full_name, email, phone, alt_phone, dob, age, gender, nationality,
    qualification, institution, field_of_study, graduation_year,
    skills, experience, cv_url, nrc_url, qualifications_url,
    tertiary_certificate_url, job_id, status
  ) values (
    nullif(trim(p->>'full_name'), ''),
    lower(nullif(trim(p->>'email'), '')),
    nullif(trim(p->>'phone'), ''),
    nullif(trim(p->>'alt_phone'), ''),
    nullif(p->>'dob', '')::date,
    nullif(p->>'age', '')::int,
    nullif(trim(p->>'gender'), ''),
    coalesce(nullif(trim(p->>'nationality'), ''), 'Zambian'),
    nullif(trim(p->>'qualification'), ''),
    nullif(trim(p->>'institution'), ''),
    nullif(trim(p->>'field_of_study'), ''),
    nullif(trim(p->>'graduation_year'), ''),
    nullif(trim(p->>'skills'), ''),
    nullif(trim(p->>'experience'), ''),
    nullif(trim(p->>'cv_url'), ''),
    nullif(trim(p->>'nrc_url'), ''),
    nullif(trim(p->>'qualifications_url'), ''),
    nullif(trim(p->>'tertiary_certificate_url'), ''),
    nullif(p->>'job_id', '')::uuid,
    'New'
  )
  returning id into new_id;

  if p_grade12 is not null and jsonb_typeof(p_grade12) = 'array' then
    for item in select * from jsonb_array_elements(p_grade12)
    loop
      insert into public.grade12_results (application_id, subject, grade, points)
      values (
        new_id,
        nullif(trim(item->>'subject'), ''),
        nullif(trim(item->>'grade'), ''),
        coalesce(nullif(item->>'points', '')::int, 0)
      );
    end loop;
  end if;

  return new_id;
end;
$$;

revoke all on function public.submit_application_full(jsonb, jsonb) from public;
revoke all on function public.submit_application_full(jsonb, jsonb) from anon;
revoke all on function public.submit_application_full(jsonb, jsonb) from authenticated;

-- ── 4. Jobs: public may only read Published (HR sees all via is_hr) ───────
drop policy if exists "public read jobs" on public.jobs;
drop policy if exists "public read published jobs" on public.jobs;
create policy "public read published jobs"
  on public.jobs
  for select
  to anon, authenticated
  using (
    status = 'Published'
    or public.is_hr()
  );

drop policy if exists "hr update jobs" on public.jobs;
create policy "hr update jobs"
  on public.jobs
  for update
  to authenticated
  using (public.is_hr())
  with check (public.is_hr());

drop policy if exists "hr insert jobs" on public.jobs;
create policy "hr insert jobs"
  on public.jobs
  for insert
  to authenticated
  with check (public.is_hr());

drop policy if exists "hr delete jobs" on public.jobs;
create policy "hr delete jobs"
  on public.jobs
  for delete
  to authenticated
  using (public.is_hr());

-- ── 5. track_application — require email + full_name; less data ──────────
drop function if exists public.track_application(text);
drop function if exists public.track_application(text, text);

create or replace function public.track_application(
  p_email text,
  p_full_name text
)
returns table (
  status text,
  created_at timestamptz,
  qualification text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email is null or length(trim(p_email)) < 5 then
    return;
  end if;
  if p_full_name is null or length(trim(p_full_name)) < 2 then
    return;
  end if;

  return query
  select a.status, a.created_at, a.qualification
  from public.applications a
  where lower(a.email) = lower(trim(p_email))
    and lower(a.full_name) = lower(trim(p_full_name))
  order by a.created_at desc
  limit 5;
end;
$$;

revoke all on function public.track_application(text, text) from public;
grant execute on function public.track_application(text, text) to anon, authenticated;

-- ── 6. Storage path prefix restriction ───────────────────────────────────
drop policy if exists "anon upload cvs" on storage.objects;
create policy "anon upload cvs"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] in ('cv', 'nrc', 'qualifications', 'tertiary')
  );

drop policy if exists "hr read cvs" on storage.objects;
create policy "hr read cvs"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'cvs' and public.is_hr());

drop policy if exists "anon read cvs" on storage.objects;

comment on function public.submit_application_full is
  'Server-only transactional application + grade12 insert. Call with service_role key after Turnstile verify.';
