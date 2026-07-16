create table public.roles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text not null default '' check (char_length(trim(description)) <= 2000),
  system_role boolean not null default false,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index roles_business_name_unique
on public.roles (business_id, lower(trim(name)))
where deleted_at is null;

create index roles_business_active_idx
on public.roles (business_id, active)
where deleted_at is null;

create function public.set_role_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.business_id <> old.business_id then
    raise exception 'A role cannot be moved between businesses';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.set_role_updated_at();

alter table public.roles enable row level security;

create policy "Active business members can view roles"
on public.roles for select to authenticated
using (public.has_active_business_membership(business_id));

create policy "Active business members can create roles"
on public.roles for insert to authenticated
with check (public.has_active_business_membership(business_id));

create policy "Active business members can update roles"
on public.roles for update to authenticated
using (public.has_active_business_membership(business_id))
with check (public.has_active_business_membership(business_id));

-- There is no authenticated DELETE policy. Deletion is represented by
-- deleted_at so references can remain stable when assignments are added later.
