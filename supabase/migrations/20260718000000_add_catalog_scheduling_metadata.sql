alter table public.catalog_items
  add column duration_minutes integer check (duration_minutes > 0),
  add column buffer_before_minutes integer not null default 0 check (buffer_before_minutes >= 0),
  add column buffer_after_minutes integer not null default 0 check (buffer_after_minutes >= 0),
  add column resource_types_required text[] not null default '{}';

alter table public.catalog_items
  add constraint catalog_items_resource_types_required_check
  check (resource_types_required <@ array['staff', 'room', 'equipment']::text[]),
  add constraint catalog_items_scheduling_metadata_check
  check (
    (
      type = 'Service'
      and (
        duration_minutes is not null
        or (buffer_before_minutes = 0 and buffer_after_minutes = 0 and resource_types_required = '{}')
      )
    )
    or (
      duration_minutes is null
      and buffer_before_minutes = 0
      and buffer_after_minutes = 0
      and resource_types_required = '{}'
    )
  );
