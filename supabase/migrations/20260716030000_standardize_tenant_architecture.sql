-- Memberships are the single source of truth for tenant access. Keeping this
-- check in one function prevents policy behavior from drifting between modules.
create function public.has_active_business_membership(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships
    where memberships.business_id = target_business_id
      and memberships.user_id = (select auth.uid())
      and memberships.status = 'active'
  );
$$;

revoke all on function public.has_active_business_membership(uuid) from public;
grant execute on function public.has_active_business_membership(uuid) to authenticated;

alter table public.catalog_items
  add column deleted_at timestamptz,
  add constraint catalog_items_business_id_fkey
    foreign key (business_id) references public.businesses (id) on delete cascade;

alter table public.customers add column deleted_at timestamptz;

create or replace function public.set_catalog_item_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.business_id <> old.business_id then
    raise exception 'A catalog item cannot be moved between businesses';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create index catalog_items_business_not_deleted_idx
on public.catalog_items (business_id)
where deleted_at is null;

create index customers_business_not_deleted_idx
on public.customers (business_id)
where deleted_at is null;

drop index public.customers_business_customer_number_unique;
create unique index customers_business_customer_number_unique
on public.customers (business_id, customer_number)
where customer_number is not null and deleted_at is null;

drop policy if exists "catalog_items_select_for_business" on public.catalog_items;
drop policy if exists "catalog_items_insert_for_business" on public.catalog_items;
drop policy if exists "catalog_items_update_for_business" on public.catalog_items;
drop policy if exists "catalog_items_delete_for_business" on public.catalog_items;

create policy "Active business members can view catalog items"
on public.catalog_items for select to authenticated
using (public.has_active_business_membership(business_id));

create policy "Active business members can create catalog items"
on public.catalog_items for insert to authenticated
with check (public.has_active_business_membership(business_id));

create policy "Active business members can update catalog items"
on public.catalog_items for update to authenticated
using (public.has_active_business_membership(business_id))
with check (public.has_active_business_membership(business_id));

drop policy if exists "Active business members can view customers" on public.customers;
drop policy if exists "Active business members can create customers" on public.customers;
drop policy if exists "Active business members can update customers" on public.customers;
drop policy if exists "Active business members can delete customers" on public.customers;

create policy "Active business members can view customers"
on public.customers for select to authenticated
using (public.has_active_business_membership(business_id));

create policy "Active business members can create customers"
on public.customers for insert to authenticated
with check (public.has_active_business_membership(business_id));

create policy "Active business members can update customers"
on public.customers for update to authenticated
using (public.has_active_business_membership(business_id))
with check (public.has_active_business_membership(business_id));

create policy "Active business members can view businesses"
on public.businesses for select to authenticated
using (public.has_active_business_membership(id));

create policy "Active business members can update businesses"
on public.businesses for update to authenticated
using (public.has_active_business_membership(id))
with check (public.has_active_business_membership(id));

-- Physical deletion is intentionally unavailable to authenticated clients.
-- Trusted maintenance processes may still use the service role when required.
