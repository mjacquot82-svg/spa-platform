# JDS Scheduling Foundation

## Calendar UI and scheduling logic

Phase 2A separates calendar presentation from availability decisions. `SchedulingCalendar`
renders and captures interactions. Pure functions in `availability.service.ts` decide whether
intervals conflict and generate candidate slots. The scheduling service is a thin,
persistence-free JDS facade; no scheduling engine has been selected.

FullCalendar Standard is the selected calendar UI implementation. It is wrapped by
`SchedulingCalendar` and a private adapter so other JDS modules exchange neutral values and
must not import FullCalendar types. FullCalendar Premium resource views are not adopted.

External Scheduling Engine status: **Not Selected / Evaluating**. The pure JDS availability
calculator described below is domain logic, not a separately adopted scheduling engine.

## Domain types

- `SchedulingResource` identifies active staff, rooms, or equipment owned by a business.
- `Appointment` represents a scheduled interval, its shared resources, lifecycle status,
  and required links to customer and catalog records.
- `WorkingHours` describes one resource's recurring wall-clock ranges for a weekday, where
  Sunday is 0 and Saturday is 6. A day may be disabled or contain multiple non-overlapping ranges.
- `AvailabilityException` is an active or archived, business-owned temporary override for one
  resource. It carries an ISO 8601 interval, display details, metadata, and an `available` or
  `unavailable` type.
- `CalendarEvent` is the library-independent UI projection used by JDS calendar consumers.
- `TimeRangeSelection` and `CalendarEventChange` are neutral calendar interaction payloads.

## Timezone assumptions

Availability interval inputs use ISO 8601 timestamps with an explicit `Z` or numeric offset.
Calculations preserve and compare the wall date and offset supplied by the caller instead of
silently converting through the host's local timezone. Slot generation preserves the offset
from its `date` input; a date-only `YYYY-MM-DD` value is explicitly interpreted as UTC.
Intervals crossing a calendar day are not supported by working-hours checks in this phase.

## Actual availability

Actual availability is the union of enabled recurring `WorkingHours` and active `available`
exception intervals, minus every active `unavailable` exception interval and every active
appointment in a blocking status. Unavailable overrides win when exceptions overlap. Available
exceptions can extend a resource beyond normal hours;
unavailable exceptions can partially or completely close normal hours. Multiple exceptions are
allowed, and archived exceptions are retained by the in-memory domain repository but ignored by
availability calculations.

In shorthand: **Working Hours + Availability Exceptions - Appointments = Actual Availability**.
Appointments are scheduling facts. Booking is a later workflow that may create appointments;
the appointment domain does not itself implement booking, payments, notifications, or customer
search. Cancelled and no-show appointments do not consume availability, and archived appointments
are ignored.

Repositories and services require `businessId` for every operation. The current adapter is
intentionally in-memory only. Exception timestamps require ISO 8601 values with an explicit UTC
or numeric offset; the availability engine currently evaluates same-day exceptions in the offset
of the requested calendar day.

This foundation does not model daylight-saving transitions. **TODO:** business-specific IANA
timezone support is required before production scheduling.

## Catalog and booking boundary

Catalog owns the characteristics of a service: its duration, optional setup and cleanup buffers,
and the kinds of resources it requires. These values describe what must be scheduled; Catalog does
not generate slots or decide whether a resource is available.

Scheduling owns time calculations and appointment searching. `SchedulingService` reads treatment
characteristics from Catalog, identifies eligible providers, and combines duration and buffers with
working hours, availability exceptions, and existing appointments. Booking is a thin workflow layer:
it passes receptionist preferences to Scheduling, renders the returned suggestions, and creates the
selected interval through `AppointmentService`. No availability, duration, provider-search, or
conflict rule is implemented in Booking or Catalog.

## Later phases

- Persistent resources
- Recurring working-hours rules beyond the initial weekday model
- Business IANA timezones and daylight-saving behavior
- Appointment persistence
- Service-to-resource eligibility
- Multi-resource availability calculation
- Booking, payment, notification, and customer workflows
