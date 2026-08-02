-- Loodi shared identity. This migration deliberately does not copy OAuth
-- provider metadata into public tables: auth.users remains the sole owner of it.

create table public.reserved_handles (
  handle text primary key,
  reason text not null default 'platform',
  created_at timestamptz not null default now(),
  constraint reserved_handles_normalized check (handle = lower(btrim(handle)))
);

create table public.reserved_module_names (
  name text primary key,
  created_at timestamptz not null default now(),
  constraint reserved_module_names_normalized check (name = lower(btrim(name))),
  constraint reserved_module_names_format check (name ~ '^[a-z0-9]+$')
);

insert into public.reserved_handles (handle) values
  ('admin'), ('administrator'), ('api'), ('auth'), ('support'), ('help'),
  ('contact'), ('system'), ('root'), ('moderation'), ('team'), ('loodi');

insert into public.reserved_module_names (name) values
  ('collec'), ('mate'), ('mag'), ('places'), ('fest'), ('sessions'), ('friends');

create or replace function public.assert_valid_handle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.handle := lower(btrim(new.handle));

  if char_length(new.handle) < 3
    or char_length(new.handle) > 24
    or new.handle !~ '^[a-z0-9]([a-z0-9_]*[a-z0-9])?$' then
    raise exception 'Invalid handle format' using errcode = 'check_violation';
  end if;

  if exists (select 1 from public.reserved_handles where handle = new.handle)
    or exists (
      select 1 from public.reserved_module_names
      where new.handle = 'loodi' || name
        or new.handle = 'loodi_' || name
        or new.handle = 'loodi-' || name
    ) then
    raise exception 'This handle is reserved' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique,
  account_type text not null default 'individual'
    check (account_type in ('individual', 'organization')),
  default_collection_visibility text not null default 'friends'
    check (default_collection_visibility in ('private', 'friends', 'public')),
  created_at timestamptz not null default now()
);

create trigger profiles_validate_handle
before insert or update of handle on public.profiles
for each row execute function public.assert_valid_handle();

alter table public.profiles enable row level security;
alter table public.reserved_handles enable row level security;
alter table public.reserved_module_names enable row level security;

create policy "Profiles are readable by their owner"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
