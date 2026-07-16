create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_number text check (
    customer_number is null or char_length(trim(customer_number)) between 1 and 100
  ),
  first_name text not null default '' check (char_length(trim(first_name)) <= 200),
  last_name text not null default '' check (char_length(trim(last_name)) <= 200),
  company_name text check (
    company_name is null or char_length(trim(company_name)) between 1 and 200
  ),
  email text not null check (char_length(trim(email)) between 3 and 320),
  phone text not null check (char_length(trim(phone)) between 1 and 50),
  address jsonb not null check (jsonb_typeof(address) = 'object'),
  notes text not null default '' check (char_length(notes) <= 10000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_identity_required check (
    char_length(trim(first_name)) > 0
    or char_length(trim(last_name)) > 0
    or company_name is not null
  )
);

create unique index customers_business_customer_number_unique
on public.customers (business_id, customer_number)
where customer_number is not null;

create index customers_business_name_idx
on public.customers (business_id, last_name, first_name);

create index customers_business_active_idx
on public.customers (business_id, active);

create function public.set_customer_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.business_id <> old.business_id then
    raise exception 'A customer cannot be moved between businesses';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_customer_updated_at();

alter table public.customers enable row level security;

create policy "Active business members can view customers"
on public.customers for select to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.business_id = customers.business_id
      and memberships.user_id = (select auth.uid())
      and memberships.status = 'active'
  )
);

create policy "Active business members can create customers"
on public.customers for insert to authenticated
with check (
  exists (
    select 1
    from public.memberships
    where memberships.business_id = customers.business_id
      and memberships.user_id = (select auth.uid())
      and memberships.status = 'active'
  )
);

create policy "Active business members can update customers"
on public.customers for update to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.business_id = customers.business_id
      and memberships.user_id = (select auth.uid())
      and memberships.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.memberships
    where memberships.business_id = customers.business_id
      and memberships.user_id = (select auth.uid())
      and memberships.status = 'active'
  )
);

create policy "Active business members can delete customers"
on public.customers for delete to authenticated
using (
  exists (
    select 1
    from public.memberships
    where memberships.business_id = customers.business_id
      and memberships.user_id = (select auth.uid())
      and memberships.status = 'active'
  )
);
