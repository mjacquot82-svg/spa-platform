alter table public.memberships
add constraint memberships_id_business_unique unique (id, business_id);

create table public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null,
  role_id uuid not null,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_assignments_membership_business_fkey
    foreign key (membership_id, business_id)
    references public.memberships (id, business_id)
    on delete cascade,
  constraint role_assignments_role_business_fkey
    foreign key (role_id, business_id)
    references public.roles (id, business_id)
    on delete cascade,
  constraint role_assignments_membership_role_unique
    unique (membership_id, role_id)
);

create index role_assignments_business_membership_idx
on public.role_assignments (business_id, membership_id);

create index role_assignments_business_role_idx
on public.role_assignments (business_id, role_id);

alter table public.role_assignments enable row level security;

create policy "Active business members can view role assignments"
on public.role_assignments for select to authenticated
using (public.has_active_business_membership(business_id));

create policy "Active business members can create role assignments"
on public.role_assignments for insert to authenticated
with check (
  public.has_active_business_membership(business_id)
  and public.can_access_role(business_id, role_id)
);

create policy "Active business members can delete role assignments"
on public.role_assignments for delete to authenticated
using (public.has_active_business_membership(business_id));

-- Assignments are immutable associations. Changing a role means deleting the
-- old association and inserting a new one, so no UPDATE policy is provided.
