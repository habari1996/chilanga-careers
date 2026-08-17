-- ============================================================
-- 1. HR Staff table (replaces pure domain-based is_hr())
-- 2. Notes / commands for making the cvs storage bucket private
-- ============================================================

-- ── hr_staff table ──────────────────────────────────────────
create table if not exists public.hr_staff (
  id            bigserial primary key,
  email         text not null unique,
  role          text not null default 'hr_officer'
                check (role in ('hr_director', 'hr_manager', 'hr_officer', 'admin')),
  full_name     text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Seed with the known staff from the current roles.js mapping
insert into public.hr_staff (email, role, full_name) values
  ('wamusheke-yvonne.simenda@huaxin.com', 'hr_director', 'Yvonne Simenda'),
  ('nduwa.mtonga@huaxin.com',             'hr_manager',  'Nduwa Mtonga'),
  ('mulenga.mutale@huaxin.com',           'hr_manager',  'Mulenga Mutale'),
  ('kudzanai.siame@huaxincem.com',        'admin',       'Kudzanai Siame')
on conflict (email) do update set
  role = excluded.role,
  full_name = excluded.full_name,
  is_active = true,
  updated_at = now();

-- RLS on hr_staff: only HR can read the list
alter table public.hr_staff enable row level security;

drop policy if exists "hr read staff list" on public.hr_staff;
create policy "hr read staff list"
  on public.hr_staff
  for select
  to authenticated
  using (public.is_hr());

-- Only service role / superuser can insert/update staff (manage via SQL Editor for now)
-- (no insert/update policy for authenticated → default deny)

-- ── Strengthen is_hr() to prefer the table ──────────────────
-- Falls back to domain check only if the table has no matching active row.
-- This keeps existing sessions working while you migrate.
create or replace function public.is_hr()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    exists (
      select 1 from public.hr_staff
      where lower(email) = lower(auth.jwt() ->> 'email')
        and is_active = true
    )
    or (auth.jwt() ->> 'email') ilike '%@huaxin.com'
    or (auth.jwt() ->> 'email') ilike '%@huaxincem.com'
    or (auth.jwt() ->> 'email') ilike '%@chilangacement.co.zm',
    false
  );
$$;

grant execute on function public.is_hr() to authenticated;

-- Optional helper: return the role for the current user
create or replace function public.current_hr_role()
returns text
language sql
stable
set search_path = public
as $$
  select role from public.hr_staff
  where lower(email) = lower(auth.jwt() ->> 'email')
    and is_active = true
  limit 1;
$$;

grant execute on function public.current_hr_role() to authenticated;

-- ============================================================
-- STORAGE: make cvs bucket private (RUN THESE MANUALLY)
-- ============================================================
-- After confirming the frontend is live with signed URLs:

-- 1) Optional backfill of any remaining public URLs → paths
-- update public.applications set
--   cv_url                   = regexp_replace(cv_url,                   '^.*/storage/v1/object/public/cvs/', ''),
--   nrc_url                  = regexp_replace(nrc_url,                  '^.*/storage/v1/object/public/cvs/', ''),
--   qualifications_url       = regexp_replace(qualifications_url,       '^.*/storage/v1/object/public/cvs/', ''),
--   tertiary_certificate_url = regexp_replace(tertiary_certificate_url, '^.*/storage/v1/object/public/cvs/', '')
-- where cv_url like '%/object/public/cvs/%'
--    or nrc_url like '%/object/public/cvs/%'
--    or qualifications_url like '%/object/public/cvs/%'
--    or tertiary_certificate_url like '%/object/public/cvs/%';

-- 2) Make the bucket private
-- update storage.buckets set public = false where id = 'cvs';

-- After step 2, only authenticated HR (via the "hr read cvs" policy) can
-- generate signed URLs. Anon can still UPLOAD (needed by the Apply form).
