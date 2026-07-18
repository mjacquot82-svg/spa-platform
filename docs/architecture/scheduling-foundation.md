# JDS Scheduling Foundation

## Calendar UI and scheduling logic

Phase 2A separates calendar presentation from availability decisions. `SchedulingCalendar`
renders and captures interactions. Pure functions in `availability.service.ts` decide whether
intervals conflict and generate candidate slots. The scheduling service is a thin,
persistence-free JDS facade; no scheduling engine has been selected.

FullCalendar Standard is the selected calendar UI implementation. It is wrapped by
`SchedulingCalendar` and a private adapter so other JDS modules exchange neutral values and
must not import FullCalendar types. FullCalendar Premium resource views are not adopted.

Scheduling Engine status: **Not Selected / Evaluating**.

## Domain types

- `SchedulingResource` identifies active staff, rooms, or equipment owned by a business.
- `Appointment` represents a scheduled interval, its shared resources, lifecycle status,
  and optional links to customer and catalog records.
- `WorkingHours` describes one resource's enabled wall-clock interval for a weekday, where
  Sunday is 0 and Saturday is 6.
- `AvailabilityException` marks a resource interval as explicitly available or unavailable.
- `CalendarEvent` is the library-independent UI projection used by JDS calendar consumers.
- `TimeRangeSelection` and `CalendarEventChange` are neutral calendar interaction payloads.

## Timezone assumptions

Availability interval inputs use ISO 8601 timestamps with an explicit `Z` or numeric offset.
Calculations preserve and compare the wall date and offset supplied by the caller instead of
silently converting through the host's local timezone. Slot generation preserves the offset
from its `date` input; a date-only `YYYY-MM-DD` value is explicitly interpreted as UTC.
Intervals crossing a calendar day are not supported by working-hours checks in this phase.

This foundation does not model daylight-saving transitions. **TODO:** business-specific IANA
timezone support is required before production scheduling.

## Later phases

- Persistent resources
- Recurring working-hours rules beyond the initial weekday model
- Business IANA timezones and daylight-saving behavior
- Appointment persistence
- Service-to-resource eligibility
- Multi-resource availability calculation
- Booking, payment, notification, and customer workflows
