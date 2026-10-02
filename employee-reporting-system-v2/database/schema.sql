-- Portfolio reference schema for V2.
-- Run only after reviewing against the live Supabase project.
-- This file intentionally excludes production data.

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  employee_number text,
  name text not null,
  department text,
  position text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  year integer not null,
  month integer not null,
  status text not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_year_check check (year between 2000 and 2100),
  constraint reports_month_check check (month between 1 and 12),
  constraint reports_status_check check (status in ('draft','submitted','revision','approved','completed')),
  unique (employee_id, year, month)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  activity_date date not null,
  description text not null,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  attendance_date date not null,
  check_in_photo text,
  check_out_photo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, attendance_date)
);

create index if not exists employees_user_id_idx on public.employees(user_id);
create index if not exists reports_employee_id_idx on public.reports(employee_id);
create index if not exists activities_report_id_idx on public.activities(report_id);
create index if not exists attendance_report_id_idx on public.attendance(report_id);
