create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null check (
    char_length(key) between 3 and 200
    and key = lower(trim(key))
    and key ~ '^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$'
  ),
  description text not null default '' check (char_length(trim(description)) <= 2000),
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permissions_key_unique unique (key)
);

create index permissions_active_idx
on public.permissions (active)
where deleted_at is null;

create function public.set_permission_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.key <> old.key then
    raise exception 'A permission key cannot be changed';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger permissions_set_updated_at
before update on public.permissions
for each row execute function public.set_permission_updated_at();

alter table public.roles
add constraint roles_id_business_unique unique (id, business_id);

create table public.role_permissions (
  business_id uuid not null references public.businesses (id) on delete cascade,
  role_id uuid not null,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id),
  constraint role_permissions_role_business_fkey
    foreign key (role_id, business_id)
    references public.roles (id, business_id)
    on delete cascade
);

create index role_permissions_business_id_idx
on public.role_permissions (business_id);

create index role_permissions_permission_id_idx
on public.role_permissions (permission_id);

create function public.has_any_active_business_membership()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships
    where memberships.user_id = (select auth.uid())
      and memberships.status = 'active'
  );
$$;

create function public.can_access_role(target_business_id uuid, target_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roles
    join public.memberships
      on memberships.business_id = roles.business_id
    where roles.id = target_role_id
      and roles.business_id = target_business_id
      and roles.deleted_at is null
      and memberships.user_id = (select auth.uid())
      and memberships.status = 'active'
  );
$$;

revoke all on function public.has_any_active_business_membership() from public;
revoke all on function public.can_access_role(uuid, uuid) from public;
grant execute on function public.has_any_active_business_membership() to authenticated;
grant execute on function public.can_access_role(uuid, uuid) to authenticated;

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

create policy "Active members can view permissions"
on public.permissions for select to authenticated
using (
  deleted_at is null
  and public.has_any_active_business_membership()
);

-- Permission definitions are platform-owned. Authenticated clients receive no
-- insert, update, or delete policies; trusted service-role clients manage them.

create policy "Business members can view role permissions"
on public.role_permissions for select to authenticated
using (public.can_access_role(business_id, role_id));

create policy "Business members can assign role permissions"
on public.role_permissions for insert to authenticated
with check (
  public.can_access_role(business_id, role_id)
  and exists (
    select 1
    from public.permissions
    where permissions.id = role_permissions.permission_id
      and permissions.active
      and permissions.deleted_at is null
  )
);

create policy "Business members can remove role permissions"
on public.role_permissions for delete to authenticated
using (public.can_access_role(business_id, role_id));
