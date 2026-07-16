insert into public.permissions (key, description, active)
values
  ('catalog.view', 'View catalog items', true),
  ('catalog.create', 'Create catalog items', true),
  ('catalog.update', 'Update catalog items', true),
  ('catalog.delete', 'Delete catalog items', true),
  ('customers.view', 'View customers', true),
  ('customers.create', 'Create customers', true),
  ('customers.update', 'Update customers', true),
  ('customers.delete', 'Delete customers', true),
  ('business.view', 'View business details', true),
  ('business.update', 'Update business details', true),
  ('roles.view', 'View roles', true),
  ('roles.create', 'Create roles', true),
  ('roles.update', 'Update roles', true),
  ('roles.delete', 'Delete roles', true),
  ('roles.permissions.view', 'View permissions assigned to roles', true),
  ('roles.permissions.manage', 'Manage permissions assigned to roles', true),
  ('role_assignments.view', 'View role assignments', true),
  ('role_assignments.manage', 'Manage role assignments', true)
on conflict (key) do nothing;

create function public.resolve_membership_permission_keys(target_membership_id uuid)
returns table (permission_key text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct permissions.key
  from public.memberships
  join public.role_assignments
    on role_assignments.membership_id = memberships.id
    and role_assignments.business_id = memberships.business_id
  join public.roles
    on roles.id = role_assignments.role_id
    and roles.business_id = memberships.business_id
  join public.role_permissions
    on role_permissions.role_id = roles.id
    and role_permissions.business_id = roles.business_id
  join public.permissions
    on permissions.id = role_permissions.permission_id
  where memberships.id = target_membership_id
    and memberships.user_id = (select auth.uid())
    and memberships.status = 'active'
    and roles.active
    and roles.deleted_at is null
    and permissions.active
    and permissions.deleted_at is null
  order by permissions.key;
$$;

create function public.has_business_permission(
  target_business_id uuid,
  requested_permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships
    join public.role_assignments
      on role_assignments.membership_id = memberships.id
      and role_assignments.business_id = memberships.business_id
    join public.roles
      on roles.id = role_assignments.role_id
      and roles.business_id = memberships.business_id
    join public.role_permissions
      on role_permissions.role_id = roles.id
      and role_permissions.business_id = roles.business_id
    join public.permissions
      on permissions.id = role_permissions.permission_id
    where memberships.business_id = target_business_id
      and memberships.user_id = (select auth.uid())
      and memberships.status = 'active'
      and roles.active
      and roles.deleted_at is null
      and permissions.key = requested_permission_key
      and permissions.active
      and permissions.deleted_at is null
  );
$$;

revoke all on function public.resolve_membership_permission_keys(uuid) from public;
revoke all on function public.has_business_permission(uuid, text) from public;
grant execute on function public.resolve_membership_permission_keys(uuid) to authenticated;
grant execute on function public.has_business_permission(uuid, text) to authenticated;

drop policy if exists "Active business members can view businesses" on public.businesses;
drop policy if exists "Active business members can update businesses" on public.businesses;

create policy "Authorized members can view businesses"
on public.businesses for select to authenticated
using (public.has_business_permission(id, 'business.view'));

create policy "Authorized members can update businesses"
on public.businesses for update to authenticated
using (public.has_business_permission(id, 'business.update'))
with check (public.has_business_permission(id, 'business.update'));

drop policy if exists "Active business members can view roles" on public.roles;
drop policy if exists "Active business members can create roles" on public.roles;
drop policy if exists "Active business members can update roles" on public.roles;

create policy "Authorized members can view roles"
on public.roles for select to authenticated
using (public.has_business_permission(business_id, 'roles.view'));

create policy "Authorized members can create roles"
on public.roles for insert to authenticated
with check (public.has_business_permission(business_id, 'roles.create'));

create policy "Authorized members can update roles"
on public.roles for update to authenticated
using (public.has_business_permission(business_id, 'roles.update'))
with check (public.has_business_permission(business_id, 'roles.update'));

drop policy if exists "Business members can view role permissions" on public.role_permissions;
drop policy if exists "Business members can assign role permissions" on public.role_permissions;
drop policy if exists "Business members can remove role permissions" on public.role_permissions;

create policy "Authorized members can view role permissions"
on public.role_permissions for select to authenticated
using (
  public.can_access_role(business_id, role_id)
  and public.has_business_permission(business_id, 'roles.permissions.view')
);

create policy "Authorized members can assign role permissions"
on public.role_permissions for insert to authenticated
with check (
  public.can_access_role(business_id, role_id)
  and public.has_business_permission(business_id, 'roles.permissions.manage')
  and exists (
    select 1
    from public.permissions
    where permissions.id = role_permissions.permission_id
      and permissions.active
      and permissions.deleted_at is null
  )
);

create policy "Authorized members can remove role permissions"
on public.role_permissions for delete to authenticated
using (
  public.can_access_role(business_id, role_id)
  and public.has_business_permission(business_id, 'roles.permissions.manage')
);

drop policy if exists "Active business members can view role assignments"
on public.role_assignments;
drop policy if exists "Active business members can create role assignments"
on public.role_assignments;
drop policy if exists "Active business members can delete role assignments"
on public.role_assignments;

create policy "Authorized members can view role assignments"
on public.role_assignments for select to authenticated
using (public.has_business_permission(business_id, 'role_assignments.view'));

create policy "Authorized members can create role assignments"
on public.role_assignments for insert to authenticated
with check (
  public.has_business_permission(business_id, 'role_assignments.manage')
  and public.can_access_role(business_id, role_id)
);

create policy "Authorized members can delete role assignments"
on public.role_assignments for delete to authenticated
using (public.has_business_permission(business_id, 'role_assignments.manage'));

drop policy if exists "Active business members can view catalog items" on public.catalog_items;
drop policy if exists "Active business members can create catalog items" on public.catalog_items;
drop policy if exists "Active business members can update catalog items" on public.catalog_items;

create policy "Authorized members can view catalog items"
on public.catalog_items for select to authenticated
using (public.has_business_permission(business_id, 'catalog.view'));

create policy "Authorized members can create catalog items"
on public.catalog_items for insert to authenticated
with check (public.has_business_permission(business_id, 'catalog.create'));

create policy "Authorized members can update catalog items"
on public.catalog_items for update to authenticated
using (public.has_business_permission(business_id, 'catalog.update'))
with check (public.has_business_permission(business_id, 'catalog.update'));

drop policy if exists "Active business members can view customers" on public.customers;
drop policy if exists "Active business members can create customers" on public.customers;
drop policy if exists "Active business members can update customers" on public.customers;

create policy "Authorized members can view customers"
on public.customers for select to authenticated
using (public.has_business_permission(business_id, 'customers.view'));

create policy "Authorized members can create customers"
on public.customers for insert to authenticated
with check (public.has_business_permission(business_id, 'customers.create'));

create policy "Authorized members can update customers"
on public.customers for update to authenticated
using (public.has_business_permission(business_id, 'customers.update'))
with check (public.has_business_permission(business_id, 'customers.update'));

create function public.soft_delete_catalog_item(target_business_id uuid, target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_business_permission(target_business_id, 'catalog.delete') then
    raise exception 'Permission denied' using errcode = '42501';
  end if;

  update public.catalog_items
  set deleted_at = now()
  where business_id = target_business_id
    and id = target_id
    and deleted_at is null;
end;
$$;

create function public.soft_delete_customer(target_business_id uuid, target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_business_permission(target_business_id, 'customers.delete') then
    raise exception 'Permission denied' using errcode = '42501';
  end if;

  update public.customers
  set deleted_at = now()
  where business_id = target_business_id
    and id = target_id
    and deleted_at is null;
end;
$$;

create function public.soft_delete_role(target_business_id uuid, target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_business_permission(target_business_id, 'roles.delete') then
    raise exception 'Permission denied' using errcode = '42501';
  end if;

  update public.roles
  set deleted_at = now()
  where business_id = target_business_id
    and id = target_id
    and deleted_at is null;
end;
$$;

revoke all on function public.soft_delete_catalog_item(uuid, uuid) from public;
revoke all on function public.soft_delete_customer(uuid, uuid) from public;
revoke all on function public.soft_delete_role(uuid, uuid) from public;
grant execute on function public.soft_delete_catalog_item(uuid, uuid) to authenticated;
grant execute on function public.soft_delete_customer(uuid, uuid) to authenticated;
grant execute on function public.soft_delete_role(uuid, uuid) to authenticated;

-- Keep soft deletion behind the *.delete checks instead of allowing clients
-- with *.update to write deleted_at directly.
revoke update on public.catalog_items from authenticated;
grant update (name, description, category, image, active) on public.catalog_items to authenticated;

revoke update on public.customers from authenticated;
grant update (
  customer_number,
  first_name,
  last_name,
  company_name,
  email,
  phone,
  address,
  notes,
  active
) on public.customers to authenticated;

revoke update on public.roles from authenticated;
grant update (name, description, system_role, active) on public.roles to authenticated;
