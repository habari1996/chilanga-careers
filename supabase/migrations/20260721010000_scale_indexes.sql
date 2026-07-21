-- Indexes to keep the dashboard and Track Application fast as the tables
-- grow toward thousands of applications. Safe to run anytime; CREATE INDEX
-- IF NOT EXISTS is idempotent.

-- Dashboard loads applications ordered by created_at (paged via .range()).
create index if not exists idx_applications_created_at
  on public.applications (created_at desc);

-- Track Application looks up by email; dashboard filters by status.
create index if not exists idx_applications_email
  on public.applications (lower(email));
create index if not exists idx_applications_status
  on public.applications (status);

-- Dashboard aggregates grade12 points by application_id (chunked .in()).
create index if not exists idx_grade12_results_application_id
  on public.grade12_results (application_id);
