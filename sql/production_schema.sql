-- ========================================================================================
-- SCHOLARLEDGER - PRODUCTION DATABASE SCHEMA
-- ========================================================================================
-- 
-- OVERVIEW:
-- This SQL file sets up the complete, production-ready PostgreSQL database for ScholarLedger.
-- It establishes all tables, constraints, functions, triggers, and Row Level Security (RLS) 
-- policies required for the application to function safely and securely on Supabase.
-- 
-- FINANCIAL ARCHITECTURE:
-- 1. application_payments: Tracks scholarship disbursals from the provider to the student.
-- 2. commission_transactions: Tracks commission fees paid to the center/admin for processing.
-- 3. student_payments: Tracks direct application/service fees paid by the student to the center.
-- All financial tables enforce amount >= 0 and utilize soft deletes (status = 'Reversed').
-- 
-- AUTHENTICATION ASSUMPTIONS:
-- - Admins are managed via Supabase Auth and synced to the `profiles` table.
-- - Students are managed via Supabase Auth and synced to the `students` table via `auth_user_id`.
-- 
-- ========================================================================================

create extension if not exists "pgcrypto";

-- ========================================================================================
-- 1. PROFILES (Admins / Staff)
-- ========================================================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'admin');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ========================================================================================
-- 2. STUDENTS
-- ========================================================================================
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id),
  student_code text unique,
  name text not null,
  father_name text,
  mother_name text,
  dob date,
  gender text,
  mobile text not null,
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
  annual_income numeric,
  percentage numeric,
  status text default 'Active',
  referred_through text,
  student_identifier text,
  bank_account text,
  ifsc text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_students_auth on students(auth_user_id);

-- Sequence for auto-generating Student Code (e.g., STU-0001)
create sequence if not exists student_code_seq start 1;

create or replace function set_student_code() returns trigger as $$
begin
  if new.student_code is null or new.student_code = '' then
    new.student_code := 'STU-' || lpad(nextval('student_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_student_code on students;
create trigger trg_set_student_code before insert on students for each row execute procedure set_student_code();

-- ========================================================================================
-- 3. SCHOLARSHIPS
-- ========================================================================================
create table if not exists scholarships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text,
  description text,
  academic_year text,
  official_url text,
  application_url text,
  scholarship_amount numeric,
  maximum_amount numeric,
  start_date date,
  end_date date,
  course_levels text,
  categories text,
  min_percentage numeric,
  income_limit numeric,
  gender text,
  state text,
  age_limit text,
  eligibility text,
  eligibility_conditions jsonb default '[]'::jsonb,
  required_documents jsonb default '[]'::jsonb,
  commission_percentage numeric default 0,
  show_to_students boolean default true,
  manual_review boolean default false,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================================================================================
-- 4. SCHOLARSHIP APPLICATIONS
-- ========================================================================================
create table if not exists scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  scholarship_id uuid not null references scholarships(id) on delete cascade,
  application_number text,
  registration_number text,
  login_id text,
  credential_handling text,
  encrypted_password text,
  academic_year text,
  status text not null default 'Not Started',
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

-- ========================================================================================
-- 5. APPLICATION PAYMENTS (Scholarship Disbursals)
-- ========================================================================================
create table if not exists application_payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references scholarship_applications(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  payment_date date default current_date,
  transaction_id text,
  payment_method text,
  status text default 'Received' check (status in ('Received', 'Pending', 'Failed', 'Reversed')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_payments_application on application_payments(application_id);

-- ========================================================================================
-- 6. COMMISSION TRANSACTIONS (Center Fees)
-- ========================================================================================
create table if not exists commission_transactions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references scholarship_applications(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  payment_date date default current_date,
  payment_mode text,
  reference_no text,
  status text default 'Received' check (status in ('Received', 'Pending', 'Failed', 'Reversed')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_commissions_application on commission_transactions(application_id);

-- ========================================================================================
-- 7. STUDENT PAYMENTS (Direct Service Fees)
-- ========================================================================================
create table if not exists student_payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  application_id uuid references scholarship_applications(id) on delete cascade,
  fee_due numeric default 0,
  amount numeric not null check (amount >= 0),
  payment_date date default current_date,
  payment_type text,
  payment_mode text,
  reference_no text,
  status text default 'Received' check (status in ('Received', 'Pending', 'Failed', 'Reversed')),
  received_by text,
  remarks text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_student_payments_student on student_payments(student_id);

-- ========================================================================================
-- 8. APPLICATION DOCUMENTS
-- ========================================================================================
create table if not exists application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references scholarship_applications(id) on delete cascade,
  document_type text not null,
  file_name text,
  storage_path text,
  document_number text,
  status text default 'Required',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_documents_application on application_documents(application_id);

-- ========================================================================================
-- 9. SUPPORT MESSAGES (Helpdesk)
-- ========================================================================================
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  subject text,
  category text,
  message text not null,
  related_scholarship text,
  response text,
  responded_at timestamptz,
  status text default 'Pending' check (status in ('Pending', 'Responded', 'Resolved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================================================================================
-- 10. IMPORTANT LINKS
-- ========================================================================================
create table if not exists important_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  category text default 'Other',
  description text,
  badge text,
  icon text,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================================================================================
-- 11. SETTINGS
-- ========================================================================================
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

-- ========================================================================================
-- 12. APPLICATION STATUSES (Lookup Table)
-- ========================================================================================
create table if not exists application_statuses (
  id uuid primary key default gen_random_uuid(),
  status_name text not null unique,
  display_order integer default 0,
  category text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into application_statuses (status_name, display_order, category) values
  ('Not Started', 1, 'Initial'),
  ('Registration Done', 2, 'In Progress'),
  ('Application Started', 3, 'In Progress'),
  ('Form Filled', 4, 'In Progress'),
  ('Documents Pending', 5, 'In Progress'),
  ('Documents Uploaded', 6, 'In Progress'),
  ('Submitted', 7, 'Submitted'),
  ('Under Verification', 8, 'Processing'),
  ('Deficiency / Correction Required', 9, 'Processing'),
  ('Approved', 10, 'Approved'),
  ('Rejected', 11, 'Rejected'),
  ('Payment Processing', 12, 'Payment'),
  ('Partially Received', 13, 'Payment'),
  ('Amount Received', 14, 'Payment'),
  ('Closed', 15, 'Closed')
on conflict (status_name) do nothing;

-- ========================================================================================
-- 13. AUTOMATIC TIMESTAMPS
-- ========================================================================================
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now(); return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_profiles on profiles;
create trigger trg_touch_profiles before update on profiles for each row execute procedure touch_updated_at();
drop trigger if exists trg_touch_students on students;
create trigger trg_touch_students before update on students for each row execute procedure touch_updated_at();
drop trigger if exists trg_touch_scholarships on scholarships;
create trigger trg_touch_scholarships before update on scholarships for each row execute procedure touch_updated_at();
drop trigger if exists trg_touch_applications on scholarship_applications;
create trigger trg_touch_applications before update on scholarship_applications for each row execute procedure touch_updated_at();
drop trigger if exists trg_touch_payments on application_payments;
create trigger trg_touch_payments before update on application_payments for each row execute procedure touch_updated_at();
drop trigger if exists trg_touch_commissions on commission_transactions;
create trigger trg_touch_commissions before update on commission_transactions for each row execute procedure touch_updated_at();
drop trigger if exists trg_touch_student_payments on student_payments;
create trigger trg_touch_student_payments before update on student_payments for each row execute procedure touch_updated_at();
drop trigger if exists trg_touch_documents on application_documents;
create trigger trg_touch_documents before update on application_documents for each row execute procedure touch_updated_at();
drop trigger if exists trg_touch_support on support_messages;
create trigger trg_touch_support before update on support_messages for each row execute procedure touch_updated_at();
drop trigger if exists trg_touch_links on important_links;
create trigger trg_touch_links before update on important_links for each row execute procedure touch_updated_at();
drop trigger if exists trg_touch_settings on settings;
create trigger trg_touch_settings before update on settings for each row execute procedure touch_updated_at();

-- ========================================================================================
-- 14. ROW LEVEL SECURITY (RLS)
-- ========================================================================================
alter table profiles enable row level security;
alter table students enable row level security;
alter table scholarships enable row level security;
alter table scholarship_applications enable row level security;
alter table application_payments enable row level security;
alter table commission_transactions enable row level security;
alter table student_payments enable row level security;
alter table application_documents enable row level security;
alter table support_messages enable row level security;
alter table important_links enable row level security;
alter table settings enable row level security;
alter table application_statuses enable row level security;

-- Admin Definition Function (Must exist in public schema)
create or replace function public.is_admin() returns boolean as $$
begin return (select role = 'admin' from public.profiles where id = auth.uid()); end;
$$ language plpgsql security definer;

-- Admin Policies (Full Access)
drop policy if exists "admin_all_profiles" on profiles;
create policy "admin_all_profiles" on profiles for all using (public.is_admin() or auth.uid() = id);
drop policy if exists "admin_all_students" on students;
create policy "admin_all_students" on students for all using (public.is_admin());
drop policy if exists "admin_all_scholarships" on scholarships;
create policy "admin_all_scholarships" on scholarships for all using (public.is_admin());
drop policy if exists "admin_all_applications" on scholarship_applications;
create policy "admin_all_applications" on scholarship_applications for all using (public.is_admin());
drop policy if exists "admin_all_payments" on application_payments;
create policy "admin_all_payments" on application_payments for all using (public.is_admin());
drop policy if exists "admin_all_commissions" on commission_transactions;
create policy "admin_all_commissions" on commission_transactions for all using (public.is_admin());
drop policy if exists "admin_all_student_payments" on student_payments;
create policy "admin_all_student_payments" on student_payments for all using (public.is_admin());
drop policy if exists "admin_all_documents" on application_documents;
create policy "admin_all_documents" on application_documents for all using (public.is_admin());
drop policy if exists "admin_all_support" on support_messages;
create policy "admin_all_support" on support_messages for all using (public.is_admin());
drop policy if exists "admin_all_links" on important_links;
create policy "admin_all_links" on important_links for all using (public.is_admin());
drop policy if exists "admin_all_settings" on settings;
create policy "admin_all_settings" on settings for all using (public.is_admin());
drop policy if exists "admin_all_statuses" on application_statuses;
create policy "admin_all_statuses" on application_statuses for all using (public.is_admin());

-- Student Policies (Strictly Scoped by auth_user_id)
drop policy if exists "students_read_self" on students;
create policy "students_read_self" on students for select using (auth_user_id = auth.uid());
drop policy if exists "students_update_self" on students;
create policy "students_update_self" on students for update using (auth_user_id = auth.uid());
drop policy if exists "students_read_scholarships" on scholarships;
create policy "students_read_scholarships" on scholarships for select using (is_active = true and show_to_students = true);
drop policy if exists "students_read_applications" on scholarship_applications;
create policy "students_read_applications" on scholarship_applications for select using (student_id in (select id from students where auth_user_id = auth.uid()));
drop policy if exists "students_read_payments" on application_payments;
create policy "students_read_payments" on application_payments for select using (application_id in (select id from scholarship_applications where student_id in (select id from students where auth_user_id = auth.uid())));
drop policy if exists "students_read_student_payments" on student_payments;
create policy "students_read_student_payments" on student_payments for select using (student_id in (select id from students where auth_user_id = auth.uid()));
drop policy if exists "students_read_docs" on application_documents;
create policy "students_read_docs" on application_documents for select using (application_id in (select id from scholarship_applications where student_id in (select id from students where auth_user_id = auth.uid())));
drop policy if exists "students_all_support" on support_messages;
create policy "students_all_support" on support_messages for all using (student_id in (select id from students where auth_user_id = auth.uid()));

-- ========================================================================================
-- 15. STORAGE BUCKET
-- ========================================================================================
insert into storage.buckets (id, name, public) values ('scholarship-documents', 'scholarship-documents', false) on conflict (id) do nothing;
drop policy if exists "docs_bucket_admin_all" on storage.objects;
create policy "docs_bucket_admin_all" on storage.objects for all using (bucket_id = 'scholarship-documents' and public.is_admin());

-- ========================================================================================
-- 16. FINANCIAL VIEWS
-- ========================================================================================
-- Aggregates scholarship payouts
create or replace view application_financials as
select
  a.id as application_id,
  a.expected_amount,
  coalesce(sum(p.amount) filter (where p.status = 'Received'), 0) as received_amount,
  greatest(a.expected_amount - coalesce(sum(p.amount) filter (where p.status = 'Received'), 0), 0) as pending_amount
from scholarship_applications a left join application_payments p on p.application_id = a.id group by a.id, a.expected_amount;

-- Aggregates commissions owed and paid to the center
create or replace view commission_financials as
select
  a.id as application_id,
  s.commission_percentage as default_rate,
  (a.expected_amount * coalesce(s.commission_percentage, 0) / 100) as commission_due,
  coalesce(sum(c.amount) filter (where c.status = 'Received'), 0) as commission_collected,
  greatest((a.expected_amount * coalesce(s.commission_percentage, 0) / 100) - coalesce(sum(c.amount) filter (where c.status = 'Received'), 0), 0) as commission_balance
from scholarship_applications a
join scholarships s on a.scholarship_id = s.id
left join commission_transactions c on c.application_id = a.id
group by a.id, a.expected_amount, s.commission_percentage;

-- ========================================================================================
-- 17. OPTIONAL DEMO DATA CLEANUP (Run only if needed)
-- ========================================================================================
/*
-- CAUTION: Only run these if you need to wipe out early testing data.
-- Do NOT run in a live production system with real financial records.
DELETE FROM students WHERE email LIKE '%@example.com' OR mobile = '9876543210';
DELETE FROM support_messages WHERE message LIKE '%mock%' OR message LIKE '%demo%';
*/

