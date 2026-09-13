-- ============================================================
-- Scholarship Student Management System — Supabase Schema
-- Run this whole file once in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- --------------------------------------------------------------
-- 1. profiles (mirrors auth.users, one row per admin)
-- --------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger as $$
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

-- --------------------------------------------------------------
-- 2. students
-- --------------------------------------------------------------
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
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

-- --------------------------------------------------------------
-- 3. scholarships
-- --------------------------------------------------------------
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

-- --------------------------------------------------------------
-- 4. scholarship_applications
-- --------------------------------------------------------------
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

-- --------------------------------------------------------------
-- 5. application_payments (Scholarship Disbursals to Student)
-- --------------------------------------------------------------
create table if not exists application_payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references scholarship_applications(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  payment_date date default current_date,
  transaction_id text,
  payment_method text,
  status text default 'Received', -- Received, Pending, Failed, Reversed
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_payments_application on application_payments(application_id);

-- --------------------------------------------------------------
-- 5a. commission_transactions (Center Commission/Fees)
-- --------------------------------------------------------------
create table if not exists commission_transactions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references scholarship_applications(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  payment_date date default current_date,
  payment_mode text,
  reference_no text,
  status text default 'Received',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_commissions_application on commission_transactions(application_id);

-- --------------------------------------------------------------
-- 5b. student_payments (Direct fees paid by student to center)
-- --------------------------------------------------------------
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
  status text default 'Received',
  received_by text,
  remarks text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_student_payments_student on student_payments(student_id);

-- --------------------------------------------------------------
-- 6. application_documents
-- --------------------------------------------------------------
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

-- --------------------------------------------------------------
-- 7. support_messages
-- --------------------------------------------------------------
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

-- --------------------------------------------------------------
-- 8. important_links
-- --------------------------------------------------------------
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

-- --------------------------------------------------------------
-- 9. settings
-- --------------------------------------------------------------
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

-- --------------------------------------------------------------
-- 10. application_statuses (lookup table)
-- --------------------------------------------------------------
create table if not exists application_statuses (
  id uuid primary key default gen_random_uuid(),
  status_name text not null unique,
  display_order integer default 0,
  category text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Populate default application statuses
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

-- --------------------------------------------------------------
-- updated_at auto-touch trigger (generic, reused by every table)
-- --------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to all tables
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

-- --------------------------------------------------------------
-- Row Level Security (RLS)
-- --------------------------------------------------------------
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

-- Admin role function (helper)
create or replace function public.is_admin()
returns boolean as $$
begin
  return (select role = 'admin' from public.profiles where id = auth.uid());
end;
$$ language plpgsql security definer;

-- Students check logic: are they viewing their own record?
-- Since student auth uses a custom token, we use a JWT claim if configured,
-- OR we allow access if they are authenticating via Supabase Auth and their user ID matches.
-- If the app uses a custom RPC for login and stores ID in local storage (very bad!), we must fix that in Phase 8.
-- Assuming we use Supabase Auth for students (which we should per Phase 8). We will assume student id = auth.uid() or a linkage table.
-- Let's link auth.users.id to students.id.

-- For now, let's allow authenticated admins to see everything.
create policy "admin_all_profiles" on profiles for all using (public.is_admin() or auth.uid() = id);
create policy "admin_all_students" on students for all using (public.is_admin());
create policy "admin_all_scholarships" on scholarships for all using (public.is_admin());
create policy "admin_all_applications" on scholarship_applications for all using (public.is_admin());
create policy "admin_all_payments" on application_payments for all using (public.is_admin());
create policy "admin_all_commissions" on commission_transactions for all using (public.is_admin());
create policy "admin_all_student_payments" on student_payments for all using (public.is_admin());
create policy "admin_all_documents" on application_documents for all using (public.is_admin());
create policy "admin_all_support" on support_messages for all using (public.is_admin());
create policy "admin_all_links" on important_links for all using (public.is_admin());
create policy "admin_all_settings" on settings for all using (public.is_admin());
create policy "admin_all_statuses" on application_statuses for all using (public.is_admin());

-- Students RLS: We will add an auth_user_id column to students so they can log in via Supabase Auth.
alter table students add column if not exists auth_user_id uuid references auth.users(id);
create index if not exists idx_students_auth on students(auth_user_id);

create policy "students_read_self" on students for select using (auth_user_id = auth.uid());
create policy "students_update_self" on students for update using (auth_user_id = auth.uid());
create policy "students_read_scholarships" on scholarships for select using (is_active = true and show_to_students = true);
create policy "students_read_applications" on scholarship_applications for select using (student_id in (select id from students where auth_user_id = auth.uid()));
create policy "students_read_payments" on application_payments for select using (application_id in (select id from scholarship_applications where student_id in (select id from students where auth_user_id = auth.uid())));
create policy "students_read_student_payments" on student_payments for select using (student_id in (select id from students where auth_user_id = auth.uid()));
create policy "students_read_docs" on application_documents for select using (application_id in (select id from scholarship_applications where student_id in (select id from students where auth_user_id = auth.uid())));
create policy "students_all_support" on support_messages for all using (student_id in (select id from students where auth_user_id = auth.uid()));

-- --------------------------------------------------------------
-- Storage bucket for documents (private)
-- --------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('scholarship-documents', 'scholarship-documents', false)
on conflict (id) do nothing;

create policy "docs_bucket_admin_all" on storage.objects for all using (bucket_id = 'scholarship-documents' and public.is_admin());

-- --------------------------------------------------------------
-- Helpful views for dashboard-style aggregation
-- --------------------------------------------------------------
create or replace view application_financials as
select
  a.id as application_id,
  a.expected_amount,
  coalesce(sum(p.amount) filter (where p.status = 'Received'), 0) as received_amount,
  greatest(a.expected_amount - coalesce(sum(p.amount) filter (where p.status = 'Received'), 0), 0) as pending_amount
from scholarship_applications a
left join application_payments p on p.application_id = a.id
group by a.id, a.expected_amount;

-- View for commissions
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

