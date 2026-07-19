# Phase 5C: Intelligent Appointment Suggestions

## Workflow improvement

| Previous workflow | New workflow | Receptionist clicks removed |
| --- | --- | ---: |
| Find customer → choose treatment → choose provider → choose date → inspect calendar/slots → choose time → create appointment | Find customer → choose treatment → choose a recommended appointment → book | 2–3 per appointment |
| Select a provider before knowing who is available | Leave **Any available** selected and let Scheduling compare every eligible provider | 1 |
| Pick a date and repeat the search when that date is full | Scheduling continues across tomorrow, following days, and later weeks until it finds the closest openings | At least 2 per failed date |
| Open and scan the calendar to discover an opening | Choose from earliest, today, tomorrow morning, tomorrow afternoon, and next-this-week recommendations | 1–several, plus calendar scanning time |
| Re-enter or locate a chosen time in the calendar | Selecting a recommendation updates the optional calendar selection automatically | 1 |

The common path is four selections: customer, treatment, suggested appointment, and book. Provider and date controls are preferences, not required steps.

## Architectural decisions

- `SchedulingService.findNextAvailableAppointments()` extends the existing Scheduling Domain. It receives business, catalog item, optional provider/date preferences, and a suggestion count.
- Scheduling reads the existing Catalog item and owns treatment duration, before/after buffers, required resource types, eligible-provider filtering, working hours, exceptions, appointment conflicts, multi-day fallback, chronological sorting, and friendly labels/reasons.
- The existing `findAvailableSlotsForDay()` remains the calculation primitive. Multi-day suggestion searching composes it rather than recreating overlap or availability rules.
- Existing Catalog, resource, working-hours, exception, and appointment services are injected into the Scheduling service. No repositories or parallel scheduling mechanism were added.
- Booking only submits preferences, renders `AppointmentSuggestion` results, stores the selected answer, and asks the existing appointment service to book it.
- FullCalendar is retained behind **Show calendar** as an optional refinement. The recommended path does not open it.
- The playground includes 30-, 45-, 60-, and 90-minute treatments. Scheduling tests verify that each duration produces correctly sized suggestions.

## Explicit confirmations

- **No duplicated scheduling logic:** Booking contains no availability calculation, duration calculation, conflict checking, buffer handling, or provider search.
- **Calendar remains optional:** FullCalendar is hidden by default and is only shown when the receptionist chooses **Show calendar**.
- **All appointment suggestions originate from Scheduling:** every displayed recommendation is returned by `SchedulingService.findNextAvailableAppointments()`.
