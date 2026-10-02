-- Portfolio reference RLS policy pattern.
-- Review against the live project before applying.

alter table public.employees enable row level security;
alter table public.reports enable row level security;
alter table public.activities enable row level security;
alter table public.attendance enable row level security;

-- Employee read access to own employee row; admin can read all.
create policy employees_select_own_or_admin
on public.employees
for select
to authenticated
using (
  user_id = auth.uid()
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Employee can read own reports; admin can read all.
create policy reports_select_own_or_admin
on public.reports
for select
to authenticated
using (
  exists (
    select 1
    from public.employees e
    where e.id = reports.employee_id
      and e.user_id = auth.uid()
  )
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Similar ownership rule for child records.
create policy activities_select_own_or_admin
on public.activities
for select
to authenticated
using (
  exists (
    select 1
    from public.reports r
    join public.employees e on e.id = r.employee_id
    where r.id = activities.report_id
      and (
        e.user_id = auth.uid()
        or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      )
  )
);

create policy attendance_select_own_or_admin
on public.attendance
for select
to authenticated
using (
  exists (
    select 1
    from public.reports r
    join public.employees e on e.id = r.employee_id
    where r.id = attendance.report_id
      and (
        e.user_id = auth.uid()
        or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      )
  )
);

-- Insert/update/delete policies in the live project should be kept consistent
-- with the ownership and admin rules above.
