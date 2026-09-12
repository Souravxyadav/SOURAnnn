-- ============================================================
-- Scholarship Student Management System — Supabase Schema
-- Run this whole file once in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. profiles (mirrors auth.users, one row per admin)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ------------------------------------------------------------
-- 2. students
-- ------------------------------------------------------------
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  student_code text unique,
  name text not null,
  father_name text,
  mother_name text,
  dob date,
  gender text,
  mobile text,
  email text,
  college text,
  university text,
  course text,
  branch text,
  academic_year text,
  current_semester text,
  category text,
  address text,
  city text,
  state text,
  pincode text,
  student_identifier text,
  bank_account text,
  ifsc text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-generate STU-0001, STU-0002 ... when student_code is left blank
create sequence if not exists student_code_seq start 1;

create or replace function set_student_code()
returns trigger as $$
begin
  if new.student_code is null or new.student_code = '' then
    new.student_code := 'STU-' || lpad(nextval('student_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_student_code on students;
create trigger trg_set_student_code
  before insert on students
  for each row execute procedure set_student_code();

-- ------------------------------------------------------------
-- 3. scholarships
-- ------------------------------------------------------------
create table if not exists scholarships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text,
  description text,
  academic_year text,
  official_url text,
  application_url text,
  maximum_amount numeric,
  start_date date,
  end_date date,
  eligibility text,
  required_documents jsonb default '[]'::jsonb,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4. scholarship_applications
-- ------------------------------------------------------------
create table if not exists scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  scholarship_id uuid not null references scholarships(id) on delete cascade,

  application_number text,
  registration_number text,

  login_id text,
  encrypted_password text, -- store encrypted/obfuscated value from the client, never plain if avoidable

  academic_year text,

  status text not null default 'Not Started',
  -- Not Started, Registration Done, Application Started, Form Filled,
  -- Documents Pending, Documents Uploaded, Submitted, Under Verification,
  -- Deficiency / Correction Required, Approved, Rejected,
  -- Payment Processing, Partially Received, Amount Received, Closed

  application_date date,
  submission_date date,
  verification_date date,
  approval_date date,

  expected_amount numeric default 0,

  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (student_id, scholarship_id, academic_year)
);

create index if not exists idx_apps_student on scholarship_applications(student_id);
create index if not exists idx_apps_scholarship on scholarship_applications(scholarship_id);
create index if not exists idx_apps_status on scholarship_applications(status);

-- ------------------------------------------------------------
-- 5. application_payments
-- ------------------------------------------------------------
create table if not exists application_payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references scholarship_applications(id) on delete cascade,
  amount numeric not null,
  payment_date date default current_date,
  transaction_id text,
  payment_method text,
  status text default 'Received', -- Received, Pending, Failed, Reversed
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_payments_application on application_payments(application_id);

-- ------------------------------------------------------------
-- 6. application_documents
-- ------------------------------------------------------------
create table if not exists application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references scholarship_applications(id) on delete cascade,
  document_type text not null,
  file_name text,
  storage_path text,
  document_number text,
  status text default 'Required', -- Not Required, Required, Pending, Uploaded, Verified, Rejected, Expired
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_documents_application on application_documents(application_id);

-- ------------------------------------------------------------
-- updated_at auto-touch trigger (generic, reused by every table)
-- ------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_students on students;
create trigger trg_touch_students before update on students
  for each row execute procedure touch_updated_at();

drop trigger if exists trg_touch_scholarships on scholarships;
create trigger trg_touch_scholarships before update on scholarships
  for each row execute procedure touch_updated_at();

drop trigger if exists trg_touch_applications on scholarship_applications;
create trigger trg_touch_applications before update on scholarship_applications
  for each row execute procedure touch_updated_at();

drop trigger if exists trg_touch_payments on application_payments;
create trigger trg_touch_payments before update on application_payments
  for each row execute procedure touch_updated_at();

drop trigger if exists trg_touch_documents on application_documents;
create trigger trg_touch_documents before update on application_documents
  for each row execute procedure touch_updated_at();

-- ------------------------------------------------------------
-- Row Level Security — every table locked to authenticated users only
-- (single-admin app: any logged-in user of this project = the owner)
-- ------------------------------------------------------------
alter table profiles enable row level security;
alter table students enable row level security;
alter table scholarships enable row level security;
alter table scholarship_applications enable row level security;
alter table application_payments enable row level security;
alter table application_documents enable row level security;

-- profiles: a user can only see/edit their own profile row
drop policy if exists "profiles_self" on profiles;
create policy "profiles_self" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- All other tables: full access for any authenticated user, none for anon
drop policy if exists "students_auth_all" on students;
create policy "students_auth_all" on students
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "scholarships_auth_all" on scholarships;
create policy "scholarships_auth_all" on scholarships
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "applications_auth_all" on scholarship_applications;
create policy "applications_auth_all" on scholarship_applications
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "payments_auth_all" on application_payments;
create policy "payments_auth_all" on application_payments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "documents_auth_all" on application_documents;
create policy "documents_auth_all" on application_documents
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Storage bucket for documents (private)
-- Run this section too — it creates the bucket + access policies
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('scholarship-documents', 'scholarship-documents', false)
on conflict (id) do nothing;

drop policy if exists "docs_bucket_auth_select" on storage.objects;
create policy "docs_bucket_auth_select" on storage.objects
  for select using (bucket_id = 'scholarship-documents' and auth.role() = 'authenticated');

drop policy if exists "docs_bucket_auth_insert" on storage.objects;
create policy "docs_bucket_auth_insert" on storage.objects
  for insert with check (bucket_id = 'scholarship-documents' and auth.role() = 'authenticated');

drop policy if exists "docs_bucket_auth_update" on storage.objects;
create policy "docs_bucket_auth_update" on storage.objects
  for update using (bucket_id = 'scholarship-documents' and auth.role() = 'authenticated');

drop policy if exists "docs_bucket_auth_delete" on storage.objects;
create policy "docs_bucket_auth_delete" on storage.objects
  for delete using (bucket_id = 'scholarship-documents' and auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Helpful views for dashboard-style aggregation (optional but used by app)
-- ------------------------------------------------------------
create or replace view application_financials as
select
  a.id as application_id,
  a.expected_amount,
  coalesce(sum(p.amount) filter (where p.status = 'Received'), 0) as received_amount,
  greatest(a.expected_amount - coalesce(sum(p.amount) filter (where p.status = 'Received'), 0), 0) as pending_amount
from scholarship_applications a
left join application_payments p on p.application_id = a.id
group by a.id, a.expected_amount;

-- Done. Next: create one admin user in Authentication → Users,
-- then log in from login.html using that email/password.
