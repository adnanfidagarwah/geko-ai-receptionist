
-- SQL schema (run in Supabase)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text,
  phone text,
  address text,
  status text not null default 'active',
  global_roles text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  owner uuid references users(id) on delete set null,
  name text not null,
  address text,
  phone text,
  upsell_prompt text,
  reservation_enabled boolean default true,
  agent_id text,
  llm_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clinics (
  id uuid primary key default gen_random_uuid(),
  owner uuid references users(id) on delete set null,
  name text not null,
  address text,
  phone text,
  agent_id text,
  llm_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null default 0,
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clinic_services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  name text not null,
  duration_minutes int not null default 30,
  price numeric not null default 0,
  description text,
  requires_evaluation boolean not null default false,
  requires_deposit boolean not null default false,
  is_maintenance boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clinic_locations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  label text,
  timezone text,
  phone text,
  website text,
  directions_url text,
  allow_same_day boolean default true,
  default_slot_length int,
  reschedule_policy text,
  late_fee_policy text,
  bookable_window text,
  holidays_notes text,
  hours jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clinic_providers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  name text,
  title text,
  specialties text,
  services text,
  schedule_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clinic_add_ons (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  name text,
  description text,
  price numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clinic_insurance_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  name text,
  notes text,
  payment_methods text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clinic_plan_coverages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  plan_id uuid references clinic_insurance_plans(id) on delete cascade,
  service text,
  coverage_detail text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists clinic_policies (
  clinic_id uuid primary key references clinics(id) on delete cascade,
  emergency_script text,
  consent_text text,
  privacy_policy_url text,
  privacy_mode boolean default true,
  notify_sms boolean default true,
  notify_whatsapp boolean default false,
  notify_email boolean default true,
  updated_at timestamptz default now()
);

create table if not exists clinic_messaging (
  clinic_id uuid primary key references clinics(id) on delete cascade,
  greeting_line text,
  closing_line text,
  tone_variants text[] default '{}',
  updated_at timestamptz default now()
);

create table if not exists clinic_onboarding (
  clinic_id uuid primary key references clinics(id) on delete cascade,
  locations jsonb default '[]',
  providers jsonb default '[]',
  services jsonb default '[]',
  add_ons jsonb default '[]',
  insurance jsonb default '{}'::jsonb,
  policies jsonb default '{}'::jsonb,
  messaging jsonb default '{}'::jsonb,
  selected_voice_id text,
  completed_sections text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  org_model text not null check (org_model in ('Restaurant','Clinic')),
  org_id uuid not null,
  role text not null check (role in ('owner','manager','staff','agent','viewer')),
  is_default boolean not null default false,
  permissions text[] default '{}',
  created_at timestamptz default now()
);
create index on memberships(user_id);
create index on memberships(org_model, org_id);
create index on memberships(org_id, role);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  patient_name text,
  patient_phone text,
  service_name text,
  requested_time timestamptz,
  confirmed_time timestamptz,
  status text not null default 'pending',
  via_call_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  customer_name text,
  customer_phone text,
  items jsonb not null default '[]',
  total_amount numeric not null default 0,
  delivery_address text,
  delivery_or_pickup text check (delivery_or_pickup in ('delivery','pickup')) default 'pickup',
  status text not null default 'pending',
  estimated_time timestamptz,
  via_call_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists restaurant_reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  guest_name text,
  guest_phone text,
  guest_email text,
  party_size int not null default 2,
  reservation_time timestamptz not null,
  duration_minutes int not null default 90,
  special_requests text,
  status text not null default 'pending',
  via_call_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists restaurant_reservations_restaurant_time_idx
  on restaurant_reservations (restaurant_id, reservation_time);

create table if not exists restaurant_customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  full_name text,
  phone text not null,
  email text,
  last_order_at timestamptz default now(),
  total_orders int not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (restaurant_id, phone)
);
create index if not exists restaurant_customers_phone_idx on restaurant_customers (phone);

create table if not exists call_logs (
  call_id text primary key,
  from_number text,
  to_number text,
  direction text,
  agent_id text,
  agent_version int,
  start_timestamp timestamptz,
  end_timestamp timestamptz,
  duration_ms bigint,
  transcript text,
  transcript_object jsonb,
  transcript_with_tool_calls jsonb,
  recording_url text,
  call_summary text,
  sentiment text,
  cost jsonb,
  clinic_id uuid references clinics(id) on delete set null,
  restaurant_id uuid references restaurants(id) on delete set null,
  linked_appointment uuid references appointments(id) on delete set null,
  linked_order uuid references orders(id) on delete set null,
  linked_reservation uuid,
  created_at timestamptz default now()
);
create index if not exists call_logs_clinic_idx on call_logs (clinic_id, start_timestamp desc);

create table if not exists restaurant_upsells (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  call_id text references call_logs(call_id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  session_id text,
  agent_id text,
  offer_label text,
  offer_description text,
  offer_type text,
  price numeric,
  status text not null default 'accepted' check (status in ('pitched','accepted','declined','pending')),
  customer_name text,
  customer_phone text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists restaurant_upsells_restaurant_idx on restaurant_upsells (restaurant_id, created_at desc);
create index if not exists restaurant_upsells_call_idx on restaurant_upsells (call_id);
create index if not exists restaurant_upsells_session_idx on restaurant_upsells (session_id);

-- Working hours per weekday (0=Sunday ... 6=Saturday)
create table if not exists clinic_working_hours (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  is_open boolean not null default true,
  open_time time not null,   -- e.g. '09:00'
  close_time time not null,  -- e.g. '17:00'
  created_at timestamptz default now()
);
create index on clinic_working_hours (clinic_id, weekday);

-- Optional: breaks within working windows (e.g., lunch)
create table if not exists clinic_working_breaks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);
create index on clinic_working_breaks (clinic_id, weekday);

-- 1) Patients table
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete cascade,
  full_name text,
  phone text not null,
  email text,
  dob date,
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (clinic_id, phone)
);

create index if not exists idx_patients_phone on public.patients(phone);
create index if not exists idx_patients_clinic on public.patients(clinic_id);

-- 2) (Optional) RLS enable + policies
-- Enable only if you plan to use user tokens; service_role anyway bypasses RLS.
alter table public.patients enable row level security;

-- Allow org members of the clinic to SELECT/INSERT/UPDATE
-- We’re using memberships(org_model='Clinic', org_id=clinic_id, user_id=auth.uid())
create policy "patients_select_by_org_members"
on public.patients
for select
to authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.org_model = 'Clinic'
      and m.org_id = patients.clinic_id
      and m.user_id = auth.uid()
  )
);

create policy "patients_insert_by_org_members"
on public.patients
for insert
to authenticated
with check (
  exists (
    select 1 from public.memberships m
    where m.org_model = 'Clinic'
      and m.org_id = patients.clinic_id
      and m.user_id = auth.uid()
  )
);

create policy "patients_update_by_org_members"
on public.patients
for update
to authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.org_model = 'Clinic'
      and m.org_id = patients.clinic_id
      and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.memberships m
    where m.org_model = 'Clinic'
      and m.org_id = patients.clinic_id
      and m.user_id = auth.uid()
  )
);
