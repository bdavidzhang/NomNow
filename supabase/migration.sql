-- Run this in the Supabase SQL editor to set up the schema.

-- Users table
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  avatar_url  text,
  school      text,
  created_at  timestamptz default now()
);

-- Events table
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  food_type        text[] not null default '{}',
  location_name    text not null,
  lat              float8 not null,
  lng              float8 not null,
  start_time       timestamptz not null,
  end_time         timestamptz,
  expected_people  int,
  posted_by        uuid references public.users(id) on delete set null,
  created_at       timestamptz default now()
);

-- Index for time-range queries
create index if not exists events_start_time_idx on public.events (start_time desc);

-- Row Level Security
alter table public.users enable row level security;
alter table public.events enable row level security;

-- Users: anyone can read, only the service role can write
create policy "Users are publicly readable" on public.users
  for select using (true);

-- Events: anyone can read
create policy "Events are publicly readable" on public.events
  for select using (true);

-- Events: only the poster can update/delete (enforced via API, service role bypasses)
-- We manage insert/update/delete through the service role in API routes.

-- Anonymous posting
alter table public.events add column if not exists is_anonymous boolean not null default false;

-- Campus scoping: add campus column to events
alter table public.events add column if not exists campus text;
create index if not exists events_campus_idx on public.events (campus);

-- Backfill existing events from poster's school
update public.events e
  set campus = u.school
  from public.users u
  where e.posted_by = u.id
    and e.campus is null
    and u.school is not null;

-- Recurring events: series table
create table if not exists public.event_series (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  food_type           text[] not null default '{}',
  location_name       text not null,
  lat                 float8 not null,
  lng                 float8 not null,
  start_time_of_day   time not null,        -- e.g. '12:30'
  duration_minutes    int,                   -- null = open-ended
  frequency           text not null,         -- 'weekly' | 'biweekly' | 'monthly'
  days_of_week        int[] default '{}',    -- 0=Sun..6=Sat (for weekly/biweekly)
  days_of_month       int[] default '{}',    -- 1-31 (for monthly)
  anchor_date         date not null,         -- reference date for biweekly parity
  generated_until     date not null,         -- instances exist up to this date
  is_active           boolean not null default true,
  expected_people     int,
  is_anonymous        boolean not null default false,
  posted_by           uuid references public.users(id) on delete set null,
  campus              text,
  created_at          timestamptz default now()
);

alter table public.event_series enable row level security;

create policy "Event series are publicly readable" on public.event_series
  for select using (true);

-- Add series_id FK to events
alter table public.events add column if not exists series_id uuid references public.event_series(id) on delete cascade;
create index if not exists events_series_id_idx on public.events (series_id);
