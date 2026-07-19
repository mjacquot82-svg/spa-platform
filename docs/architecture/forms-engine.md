# JDS Forms Engine

## Platform-wide capability

Forms is a horizontal platform module because structured information collection appears in every
supported industry: intake and consent forms, waivers, inspections, registrations, and checklists.
The Forms domain owns versioned definitions, ordered field definitions, validation, and immutable
submission records. Industry modules provide definitions as data rather than creating separate
rendering systems.

## Dynamic rendering

`FormRenderer` consumes a neutral `Form` definition and selects controls from each field's type.
This keeps rendering consistent while allowing industries to compose different forms without
hard-coded spa, contractor, hospitality, or employee behavior. Definition and submission
validation remain public Forms services, so alternate renderers can enforce the same rules.

The engine intentionally does not include a drag-and-drop designer. Definitions can initially be
created by code or future administrative interfaces without coupling authoring UX to rendering.

## Independent from Booking

Forms does not know when, why, or for whom a form is requested. It has no dependencies on Booking,
Customers, Appointments, or Notifications. This prevents workflow assumptions from entering a
platform-wide information model. Future orchestration layers may associate IDs across modules
without changing the Forms Engine's core responsibilities.

The current repository is business-scoped and in-memory. No Supabase adapter is implemented.

## Future integrations

- Booking may request or attach required form submissions.
- Customers may present form history and prefill approved values.
- Notifications may deliver form requests and completion reminders.
- PDF generation may render signed, versioned submissions as durable documents.
