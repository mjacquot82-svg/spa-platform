create type public.catalog_item_type as enum ('Product', 'Service');

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  type public.catalog_item_type not null,
  name text not null check (char_length(trim(name)) between 1 and 200),
  description text,
  category text,
  image text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index catalog_items_business_id_idx on public.catalog_items (business_id);
create index catalog_items_business_type_idx on public.catalog_items (business_id, type);
create index catalog_items_business_category_idx on public.catalog_items (business_id, category);

create function public.set_catalog_item_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger catalog_items_set_updated_at
before update on public.catalog_items
for each row execute function public.set_catalog_item_updated_at();

alter table public.catalog_items enable row level security;

-- Tenant policies are installed after Businesses and Memberships exist by the
-- platform architecture standardization migration.
