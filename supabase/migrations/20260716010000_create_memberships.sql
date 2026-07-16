create type public.membership_status as enum ('pending', 'active', 'suspended');

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  status public.membership_status not null default 'pending',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_user_business_unique unique (user_id, business_id)
);

create index memberships_business_id_idx on public.memberships (business_id);
create index memberships_user_id_idx on public.memberships (user_id);

create function public.set_membership_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger memberships_set_updated_at
before update on public.memberships
for each row execute function public.set_membership_updated_at();

alter table public.memberships enable row level security;

create policy "Users can view their memberships"
on public.memberships
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their memberships"
on public.memberships
for insert
to authenticated
with check ((select auth.uid()) = user_id and status = 'pending');

-- Status transitions are trusted server-side operations. Allowing users to
-- activate their own memberships would let them cross tenant boundaries.

create policy "Users can delete their memberships"
on public.memberships
for delete
to authenticated
using ((select auth.uid()) = user_id);
