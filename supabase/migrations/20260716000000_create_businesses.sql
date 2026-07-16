create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 200),
  legal_name text check (
    legal_name is null or char_length(trim(legal_name)) between 1 and 200
  ),
  email text not null check (char_length(trim(email)) between 3 and 320),
  phone text not null check (char_length(trim(phone)) between 1 and 50),
  website text not null check (char_length(trim(website)) between 1 and 2048),
  logo text not null check (char_length(trim(logo)) between 1 and 2048),
  address jsonb not null check (jsonb_typeof(address) = 'object'),
  timezone text not null check (char_length(trim(timezone)) between 1 and 100),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_active_idx on public.businesses (active);
create index businesses_name_idx on public.businesses (name);

create function public.set_business_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_business_updated_at();

alter table public.businesses enable row level security;

-- Access policies intentionally belong to the future membership/authorization
-- module. Until then, this table is accessible only through trusted server-side
-- clients that use Supabase's service role.
