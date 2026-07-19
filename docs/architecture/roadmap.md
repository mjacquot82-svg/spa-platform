# JDS Platform Engineering Roadmap

## Purpose

This document is the official engineering roadmap for moving JDS Platform from a validated
prototype into a secure, persistent, multi-tenant production application. Work is organized by
milestone and outcome rather than by implementation phase.

The roadmap uses three categories:

1. **Product** — customer-visible capabilities and workflows.
2. **Production Foundation** — application composition, identity, tenancy, routing, and persistence.
3. **Production Hardening** — correctness, security, reliability, compliance, and operational readiness.

Statuses have the following meanings:

- **Prototype complete** — the workflow is demonstrable with in-memory data but is not production-ready.
- **Foundation complete** — reusable domain behavior exists, but production integration remains.
- **Planned** — implementation has not started beyond an empty module scaffold or placeholder route.
- **Deferred** — intentionally excluded from the initial beta scope.

Priorities are **Critical**, **High**, **Medium**, or **Low** relative to the first customer beta.

---

## 1. Product

### Product capability register

| ID | Capability | Purpose | Depends on | Priority | Status |
|---|---|---|---|---|---|
| P1 | Reception Dashboard | Give spa staff one operational view of today's appointments, pending forms, recent customers, booking, appointment details, and check-in. | Production composition root, authenticated business context, persistent appointments/forms/customers | Critical | Prototype complete |
| P2 | Booking | Let reception staff select a customer, service, eligible resources, and a valid slot, then create an appointment. | Catalog scheduling characteristics, persistent scheduling, transactional booking, business timezone | Critical | Prototype complete |
| P3 | Rescheduling | Find valid replacement slots and safely move an existing appointment. | Persistent appointments, transactional conflict protection, business timezone | Critical | Prototype complete |
| P4 | Appointment Forms | Assign published form versions to appointments and track pending/completed state. | Immutable form versions, persistent assignments/submissions, atomic completion linkage | High | Prototype complete |
| P5 | Customer Management UI | Search, create, update, archive, and review customers in the production shell. | Auth, business selection, authorization, persistent Customer repository | Critical | Domain foundation complete; UI placeholder |
| P6 | Catalog Management UI | Manage products, schedulable services, durations, buffers, and resource requirements. | Auth, authorization, persistent Catalog repository | Critical | Domain foundation complete; UI placeholder |
| P7 | Scheduling Administration | Configure resources, working hours, availability exceptions, and appointment operations outside demo pages. | Persistent Scheduling repositories, production routing, authorization | Critical | Domain foundation complete; demo UI only |
| P8 | Forms Administration | Create and publish versioned form definitions without a drag-and-drop designer. | Immutable versions, persistent Forms repository, authorization | High | Engine foundation complete; demo UI only |
| P9 | Customer Portal | Let customers view appointments, complete assigned forms, and manage permitted profile data. | Customer authentication, portal authorization, immutable forms, assignment completion, notifications | High | Planned |
| P10 | Notifications | Deliver appointment confirmations, reminders, form requests, and operational alerts. | Event/outbox infrastructure, customer contact preferences, templates, monitoring | High | Planned |
| P11 | Payments | Authorize and capture appointment or retail payments and support refunds. | Provider selection, payment ledger, idempotency, audit trail, compliance review | Medium | Planned |
| P12 | Operational Reports | Report appointments, utilization, forms, customers, and revenue without querying UI repositories directly. | Persistent data, reporting read models, authorization | Medium | UI placeholder |
| P13 | Memberships Product Experience | Manage customer-facing packages, subscriptions, visit allowances, and renewals. | Payments, customer accounts, entitlements, Catalog | Medium | Core staff membership module exists; product capability planned |
| P14 | Inventory | Track stock, consumption, adjustments, reorder levels, and audit history. | Persistent Catalog, authorization, audit trail | Medium | Planned |
| P15 | Retail | Sell Catalog products, update inventory, issue receipts, and associate purchases with customers. | Payments, Inventory, Catalog, Customers | Medium | Planned |
| P16 | Owner Dashboard | Present financial and operational KPIs across one or more businesses. | Reports, authorization, business selection, production data | Low for beta | Planned |

### Product scope guidance

The first beta should focus on P1–P8. P9 and P10 are valuable immediately after the internal
alpha but should not delay foundational data correctness. Payments, retail, inventory,
memberships, and owner analytics should follow only after core reception workflows are reliable.

---

## 2. Production Foundation

### F1 — Application Composition Root

**Why it matters:** Production pages need one controlled place to construct repositories, services,
identity context, and cross-module workflows. Page-level construction creates hidden singleton
state and binds production routes to fixtures.

**What currently exists:** Demo and dashboard pages instantiate in-memory repositories and services
at module scope. `App.tsx` maps several production routes directly to demo components.

**Exit criteria:**

- A single application bootstrap composes infrastructure and domain services.
- Production pages receive dependencies through explicit providers or route/application context.
- No production page constructs a repository or owns fixture records.
- Tests can replace the production composition with deterministic test adapters.

### F2 — Dependency Injection and Service Access

**Why it matters:** Consistent dependency access enables tenant changes, logout cleanup, testing,
observability, and future server-side or background execution.

**What currently exists:** Constructor injection is used inside services, but React pages import
concrete services and repositories directly.

**Exit criteria:**

- Typed provider interfaces expose services to React workflows.
- Service lifetime and cleanup rules are documented.
- UI modules depend on service contracts, not concrete repository adapters.
- Business switching recreates or safely rebinds business-scoped state.

### F3 — Repository Registration

**Why it matters:** Every runtime must know which repository implementation serves each domain
without scattering adapter selection throughout the application.

**What currently exists:** Customers and Catalog have Supabase adapters; Scheduling, Forms, and
appointment-form assignments have in-memory adapters only.

**Exit criteria:**

- Repository factories are registered centrally by environment.
- Development/test/demo adapters are explicit and cannot be selected accidentally in production.
- Missing production adapters fail at startup with a clear diagnostic.

### F4 — Authentication Integration

**Why it matters:** Customer data and operational actions must be associated with an authenticated
user and protected from anonymous access.

**What currently exists:** `AuthProvider` and Supabase authentication code exist, but the active
application router and shell do not use them.

**Exit criteria:**

- Protected routes require an authenticated session.
- Login, logout, session refresh, password recovery, and expired-session behavior are tested.
- Anonymous access is limited to explicitly public future portal routes.

### F5 — Business Selection

**Why it matters:** `businessId` is the central tenant boundary. It must come from verified
membership context rather than constants or caller-controlled input.

**What currently exists:** Service APIs are business-scoped, but production-looking pages use
hard-coded demo business IDs and the shell business selector is a placeholder.

**Exit criteria:**

- The active business is resolved from authenticated memberships.
- Users can switch only among authorized businesses.
- Business selection is persisted appropriately and invalid selections are rejected.
- All queries and commands derive tenant scope from trusted context.

### F6 — Membership Resolution

**Why it matters:** Authentication establishes identity; memberships establish which businesses
and roles that identity may use.

**What currently exists:** Core membership repository/service code and database migrations exist,
but they are not integrated into the active shell.

**Exit criteria:**

- Memberships load after authentication and before business-scoped routes render.
- Disabled or removed memberships revoke access promptly.
- Empty, single-business, and multi-business experiences are defined and tested.

### F7 — Authorization Integration

**Why it matters:** Receptionists, practitioners, managers, and owners require different access to
customers, forms, reports, settings, and destructive actions.

**What currently exists:** Roles, permissions, assignments, authorization evaluation, and providers
exist in Core but are not connected to production navigation or workflows.

**Exit criteria:**

- Route access, navigation visibility, commands, and sensitive fields use authorization checks.
- Server/database enforcement remains authoritative when the UI is bypassed.
- A documented permission matrix covers the beta roles.

### F8 — Replace Demo Repositories in Production

**Why it matters:** In-memory data is lost on refresh and is shared according to JavaScript module
lifetime rather than authenticated tenant context.

**What currently exists:** Production routes reuse demo pages and in-memory fixtures.

**Exit criteria:**

- No production route imports an `InMemory*Repository`.
- Demo routes remain isolated and visibly marked as non-production.
- Production builds cannot silently fall back to volatile storage.

### F9 — Persistent Repository Adapters

**Why it matters:** Appointments, schedules, forms, and assignments must survive refreshes,
deployments, and concurrent sessions.

**What currently exists:** Customer and Catalog persistence exist. Scheduling, Forms, submissions,
and appointment-form assignments are volatile.

**Exit criteria:**

- Migrations and adapters exist for resources, working hours, exceptions, appointments, forms,
  immutable form versions, submissions, and assignments.
- Repository contract tests run against in-memory and production adapters.
- Foreign keys and business ownership constraints prevent orphaned cross-domain references.

### F10 — Production Routing and Page Separation

**Why it matters:** Demo pages optimize for evaluation; production pages need authenticated layout,
real dependencies, consistent loading/error states, and permission-aware actions.

**What currently exists:** React Router and `AppShell` are present, but Calendar, Appointments,
Booking, and Rescheduling production routes render demo components.

**Exit criteria:**

- Production pages and demo pages are separate entry points over reusable workflow components.
- Playground and demo registrations are excluded from production navigation and optionally from
  production builds.
- Unknown, unauthorized, loading, and failure routes behave consistently.

### F11 — Remove Fixture Dependencies

**Why it matters:** Hard-coded dates, users, businesses, forms, and appointments conceal missing
runtime dependencies and can accidentally appear to customers.

**What currently exists:** Dashboard and workflow pages define fixture entities at module scope.

**Exit criteria:**

- Production source paths contain no fixture domain records.
- Demo fixtures live in a clearly named demo/test-data package.
- Seed tooling is explicit, repeatable, and environment-safe.

---

## 3. Production Hardening

### H1 — Business IANA Timezones

**Risk if omitted:** “Today,” working hours, reminders, and appointment times will be incorrect for
businesses outside UTC and around timezone boundaries.

**Recommended timing:** Before any customer demo using real schedules.

**Exit criteria:** Every business has an IANA timezone; date boundaries and display use that
timezone; APIs distinguish instants from local wall-clock values.

### H2 — Daylight-Saving-Time Handling

**Risk if omitted:** Slots may be duplicated, skipped, or shifted during DST transitions.

**Recommended timing:** Immediately after H1 and before beta.

**Exit criteria:** Automated tests cover spring-forward, fall-back, ambiguous times, nonexistent
times, and businesses without DST.

### H3 — Transactional Booking

**Risk if omitted:** Appointment creation, form assignment, and related writes may partially
succeed, leaving inconsistent workflow state.

**Recommended timing:** Before customer demo.

**Exit criteria:** Appointment creation and required related writes use a documented atomic command
or recoverable saga with idempotency and explicit failure handling.

### H4 — Concurrency Protection

**Risk if omitted:** Two receptionists can observe the same slot and create overlapping
appointments because conflict detection is currently read-then-write.

**Recommended timing:** Before customer demo; critical for beta.

**Exit criteria:** Conflict enforcement occurs transactionally in authoritative persistence;
concurrency tests prove one winner for competing bookings; updates use revision checks.

### H5 — Service Buffers and Multi-Resource Availability

**Risk if omitted:** Bookings can ignore setup/cleanup time and required rooms/equipment, producing
operationally impossible schedules.

**Recommended timing:** Before customer demo if the pilot business uses buffers or shared assets;
otherwise before beta.

**Exit criteria:** Availability applies before/after buffers, validates resource-type eligibility,
and intersects availability for all required resources.

### H6 — Appointment Lifecycle Policy

**Risk if omitted:** Generic updates can bypass validated check-in/cancel/complete/no-show
transitions, producing invalid operational states.

**Recommended timing:** Before customer demo.

**Exit criteria:** A single transition policy is enforced by all commands and persistence paths;
transition tests cover every allowed and rejected state change.

### H7 — Immutable Form Versions

**Risk if omitted:** Signed or submitted forms cannot be reconstructed reliably after definition
changes, creating legal and audit exposure.

**Recommended timing:** Before collecting any real consent or health information.

**Exit criteria:** Publishing creates immutable versions; assignments pin a version; submissions
record the exact version or immutable snapshot; published historical versions cannot be mutated.

### H8 — Submission/Assignment Consistency

**Risk if omitted:** Assignments may remain pending after submission or be marked completed without
a corresponding submission.

**Recommended timing:** Before customer portal or beta.

**Exit criteria:** Completion atomically links an assignment to a valid submission for the assigned
form version; invalid duplicate or cross-business completion is impossible.

### H9 — Audit History

**Risk if omitted:** The platform cannot explain who changed appointments, forms, permissions,
customer records, or operational status.

**Recommended timing:** Begin with persistence; complete before beta.

**Exit criteria:** Sensitive commands emit immutable actor, tenant, timestamp, before/after, and
correlation data with an authorized audit viewer and retention policy.

### H10 — Secure File Storage

**Risk if omitted:** File fields currently cannot preserve content securely or enforce tenant
access, retention, malware scanning, and deletion.

**Recommended timing:** Before enabling file fields for customers.

**Exit criteria:** Private object storage uses tenant-scoped authorization, metadata records,
size/type limits, malware controls, retention, and tested deletion.

### H11 — Digital Signatures

**Risk if omitted:** A typed name may be misrepresented as legally meaningful consent without
adequate evidence.

**Recommended timing:** Before using Forms for waivers or consent in beta.

**Exit criteria:** Legal requirements are documented; signature evidence is bound to immutable form
content, signer identity, timestamp, and integrity metadata; UX clearly states signature meaning.

### H12 — RLS and Tenant-Isolation Testing

**Risk if omitted:** A policy or query error may expose one business’s customer or health data to
another business.

**Recommended timing:** With each persistent adapter; mandatory before customer demo.

**Exit criteria:** Automated tests attempt cross-tenant reads and writes for every table and RPC;
service-role exceptions are documented; failures block CI.

### H13 — Integration Testing

**Risk if omitted:** Individually correct services may fail when composed with persistence,
authorization, forms, and scheduling.

**Recommended timing:** Start with Production Foundation and expand continuously.

**Exit criteria:** Repository contracts and critical multi-service workflows run against a local
production-like database in CI.

### H14 — End-to-End Testing

**Risk if omitted:** Routing, providers, browser behavior, forms, calendars, and receptionist
workflows can regress despite unit tests passing.

**Recommended timing:** Establish before customer demo; complete critical flows before beta.

**Exit criteria:** Automated browser tests cover login, business selection, booking, rescheduling,
check-in, form assignment/submission, authorization denial, and recovery from failures.

### H15 — Continuous Integration

**Risk if omitted:** Type, lint, test, build, migration, and security regressions can enter the main
branch without a repeatable gate.

**Recommended timing:** Now.

**Exit criteria:** Every pull request runs type-check, lint, unit/integration tests, production build,
migration validation, dependency scanning, and required status checks.

### H16 — Monitoring and Operational Telemetry

**Risk if omitted:** Failures and degraded workflows may remain invisible until customers report
them.

**Recommended timing:** Instrument during persistence work; dashboards before beta.

**Exit criteria:** Key workflow success/failure rates, latency, job health, database health, and
capacity signals are observable without recording sensitive form contents.

### H17 — Error Reporting and Structured Diagnostics

**Risk if omitted:** Generic errors and blank workflow failures will be difficult to diagnose in
customer environments.

**Recommended timing:** Before customer demo.

**Exit criteria:** Typed domain errors map to safe user messages; unexpected exceptions include
correlation IDs and structured context; React error boundaries and route recovery are present;
sensitive data is redacted.

### H18 — Backups and Recovery

**Risk if omitted:** Customer schedules, forms, and audit data may be permanently lost or recovery
may exceed acceptable downtime.

**Recommended timing:** Configure with production persistence; test before beta.

**Exit criteria:** Recovery objectives are documented; automated backups and point-in-time recovery
are configured; restoration is rehearsed and evidenced.

### H19 — Accessibility

**Risk if omitted:** Staff or customers may be unable to complete critical workflows, and the
platform may fail contractual or legal accessibility expectations.

**Recommended timing:** Incorporate continuously; formal audit before beta.

**Exit criteria:** Keyboard navigation, focus management, screen-reader semantics, contrast,
responsive behavior, validation announcements, and calendar/form workflows meet the agreed WCAG
target.

### H20 — Security, Privacy, and Data Retention

**Risk if omitted:** Health, consent, identity, and payment-adjacent information may be collected
without adequate safeguards or lifecycle rules.

**Recommended timing:** Requirements now; implementation alongside persistence; sign-off before beta.

**Exit criteria:** Data classification, encryption, least privilege, secrets management, retention,
deletion, export, incident response, and applicable regulatory obligations are documented, tested,
and approved.

### H21 — API and Module Boundary Cleanup

**Risk if omitted:** Persistence types, demo pages, and FullCalendar adapter types will become de
facto public contracts, increasing coupling and future migration cost.

**Recommended timing:** Before persistent adapters cause broader adoption.

**Exit criteria:** Public entry points expose intentional domain/application contracts only;
FullCalendar and database row types remain internal; API naming and lifecycle conventions are
documented; dependency-boundary checks run in CI.

### H22 — Developer Experience and Release Discipline

**Risk if omitted:** Environment setup, migrations, fixtures, and releases will depend on tribal
knowledge and produce inconsistent deployments.

**Recommended timing:** Now and continuously.

**Exit criteria:** README and contributor guides cover setup, architecture, testing, migrations,
fixtures, deployment, and rollback; changes are reviewed in coherent commits; release notes and
versioning rules are established.

---

## Recommended Release Milestones

Version numbers are recommendations. Scope and exit criteria matter more than preserving a specific
number.

### v0.3 — Application Shell *(implemented prototype)*

- React Router and reusable shell
- Responsive navigation and breadcrumbs
- Dashboard landing route
- Playground retained for development

### v0.4 — Forms Engine *(implemented prototype)*

- Dynamic form definitions and renderer
- Validation and in-memory submissions
- Appointment-form assignment relationship

### v0.5 — Reception Workflow *(implemented prototype)*

- Booking and rescheduling
- Reception dashboard and check-in
- Form assignment after appointment creation

### v0.6 — Production Foundation

- F1–F8 and F10–F11 complete
- Authentication, memberships, authorization, and business selection integrated
- Demo and production composition separated
- CI and documented development workflow operational

### v0.7 — Production Persistence

- F9 complete for all beta domains
- RLS and repository contract testing complete
- Transactional booking and concurrency protection complete
- Business timezone and DST model complete
- Immutable form versions and assignment/submission consistency complete

### v0.8 — Internal Alpha

- P1–P8 run entirely on production adapters
- Critical end-to-end workflows pass
- Monitoring, error reporting, backups, and audit history operational
- Internal staff exercise booking, rescheduling, check-in, and forms with non-customer data

### v0.9 — Customer Beta

- Security/privacy review complete
- Accessibility audit complete for critical workflows
- Pilot-business data migration and operational runbook tested
- Customer Portal and Notifications included only if required by the pilot agreement
- Defined support, incident, backup, and rollback processes in place

### v1.0 — Production Release

- Beta findings resolved
- Reliability and performance objectives met
- Production operations rehearsed
- Product scope supported by documented service levels and upgrade practices

---

## Prioritization Buckets

Every unfinished roadmap task appears in exactly one bucket below. Completed prototype milestones
are not repeated as remaining tasks.

### NOW

- **F1** Application Composition Root
- **F2** Dependency Injection and Service Access
- **F3** Repository Registration
- **F10** Production Routing and Page Separation
- **F11** Remove Fixture Dependencies
- **H15** Continuous Integration
- **H21** API and Module Boundary Cleanup
- **H22** Developer Experience and Release Discipline

### NEXT

- **F4** Authentication Integration
- **F5** Business Selection
- **F6** Membership Resolution
- **F7** Authorization Integration
- **F8** Replace Demo Repositories in Production
- **F9** Persistent Repository Adapters
- **P5** Customer Management UI
- **P6** Catalog Management UI
- **P7** Scheduling Administration
- **P8** Forms Administration
- **H1** Business IANA Timezones
- **H13** Integration Testing
- **H20** Security, Privacy, and Data Retention

### BEFORE CUSTOMER DEMO

- **P1** Reception Dashboard productionization
- **P2** Booking productionization
- **P3** Rescheduling productionization
- **P4** Appointment Forms productionization
- **H3** Transactional Booking
- **H4** Concurrency Protection
- **H5** Service Buffers and Multi-Resource Availability
- **H6** Appointment Lifecycle Policy
- **H12** RLS and Tenant-Isolation Testing
- **H14** End-to-End Testing baseline
- **H17** Error Reporting and Structured Diagnostics

### BEFORE BETA

- **P9** Customer Portal
- **P10** Notifications
- **P11** Payments
- **P12** Operational Reports
- **P13** Memberships Product Experience
- **P14** Inventory
- **P15** Retail
- **P16** Owner Dashboard
- **H2** Daylight-Saving-Time Handling
- **H7** Immutable Form Versions
- **H8** Submission/Assignment Consistency
- **H9** Audit History
- **H10** Secure File Storage
- **H11** Digital Signatures
- **H16** Monitoring and Operational Telemetry
- **H18** Backups and Recovery
- **H19** Accessibility

Items in the **BEFORE BETA** bucket may be explicitly deferred from the first pilot only through a
documented scope decision. H2 and H7–H9, H12, H16–H20 are not reasonable deferrals when the pilot
uses scheduling, consent, health information, or real customer data. Product items P11–P16 may be
deferred if they are outside the signed pilot scope.

---

## Senior Architect’s Position

### What I would build next

I would stop adding customer-visible modules temporarily and build the application composition root.
The immediate sequence would be F1, F2, F3, F10, and H15: separate demo pages from production
pages, register dependencies centrally, establish provider contracts, and put a repeatable CI gate
around the repository. I would then integrate identity and tenant context before implementing the
remaining persistent adapters.

The first production vertical slice should be narrow: authenticate, select an authorized business,
load persistent customers/catalog/scheduling data, book one appointment transactionally, reload the
page, and observe the same appointment. That slice should prove RLS, timezone handling, conflict
protection, diagnostics, and recovery before broadening the product surface.

### What I would deliberately postpone

I would postpone Payments, Inventory, Retail, advanced Reports, Memberships product behavior, the
Owner Dashboard, a drag-and-drop form designer, and broad industry customization. I would also avoid
building a customer portal until immutable form versions and assignment/submission consistency are
settled. These capabilities add surface area without reducing the current risk to core reception
operations.

### What I would absolutely not change

I would not collapse the modular monolith into microservices. The current scale does not justify
distributed transactions, operational overhead, or network boundaries. I would preserve:

- Business-scoped service APIs.
- Repository interfaces and constructor injection at the domain/service layer.
- Catalog, Scheduling, Forms, and Booking as distinct responsibilities.
- Pure availability calculations with strong unit coverage.
- The neutral `SchedulingCalendar` boundary around FullCalendar.
- Dynamic, industry-neutral form definitions and validation.
- The Developer Playground as an isolated engineering tool.

### Architectural decisions that have proven successful

The strongest decision is treating Booking as an orchestration layer rather than a domain that
absorbs Customers, Catalog, Scheduling, and Forms. That dependency direction remains correct.
Similarly, Forms is appropriately platform-wide, and Scheduling keeps the calendar library outside
its core domain types. In-memory repositories have been valuable for discovering workflows quickly;
their role should now narrow to tests and explicit demos rather than be discarded.

The platform should remain a modular monolith with intentional public APIs, one composition root,
authoritative persistent constraints, and clear application workflows. The next milestone is not
more breadth—it is making the existing breadth trustworthy.
