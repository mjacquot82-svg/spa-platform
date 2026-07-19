# Product UX Architecture: Personas and Principles

## Purpose

JDS Platform is a reusable SaaS platform for appointment-based and service-oriented businesses. It must support multiple industries, operating models, business sizes, and locations without making one spa's workflow the default product architecture.

The platform should provide a shared foundation for business rules while allowing each application to optimize the experience for the person doing the work. A receptionist, practitioner, owner, and customer may act on the same appointment, but each approaches it with different context, urgency, and goals.

This document defines the primary personas that interact with JDS Platform and establishes UX principles every future feature and workflow must follow.

## Primary Personas

### Receptionist

The receptionist operates the front desk and coordinates the flow of customers, appointments, practitioners, and required information. This persona may be a dedicated receptionist, an administrative employee, or someone temporarily covering reception duties.

#### Responsibilities

- Manage the current day's arrivals, changes, cancellations, and delays.
- Book, reschedule, and confirm appointments.
- Find or create customer records without producing duplicates.
- Confirm contact details and appointment requirements.
- Assign, monitor, and help resolve incomplete forms.
- Check customers in and communicate their arrival to the appropriate practitioner.
- Answer availability, service, practitioner, duration, and pricing questions.
- Keep the schedule accurate while handling interruptions and concurrent requests.

#### Daily workflow

The receptionist begins with an operational view of today: upcoming arrivals, customers waiting, incomplete forms, schedule changes, and exceptions requiring attention. Throughout the day, the receptionist moves rapidly between incoming calls, in-person customers, appointment changes, form questions, and practitioner coordination.

The workflow is interruption-heavy. Work should remain in context, preserve entered information, and be easy to resume. The receptionist should not need to remember where information is stored or navigate across several sections to complete one appointment-related task.

#### Primary goals

- Keep arrivals and practitioners moving on time.
- Complete common front-desk tasks while the customer is still speaking.
- Prevent scheduling errors and duplicate customer records.
- Resolve missing information before it delays service.
- Give customers quick, confident answers.

#### Most common actions

- Search for a customer or appointment.
- Review today's appointment queue.
- Create a new appointment.
- Find the next suitable opening.
- Reschedule or cancel an appointment.
- Review appointment details.
- Assign or check the status of forms.
- Check in a customer.
- Confirm customer contact information.

#### Most time-sensitive actions

- Check in an arriving customer.
- Identify why an appointment is not ready.
- Resolve missing or incomplete forms.
- Find an appointment while a customer is waiting or calling.
- Find replacement availability during a reschedule request.
- Respond to a late customer, practitioner delay, or same-day cancellation.
- Prevent a conflicting or unsuitable booking.

#### Biggest frustrations

- Re-entering information the platform already has.
- Opening multiple screens to complete one appointment task.
- Long dropdowns instead of search.
- Losing progress when interrupted or changing one selection.
- Seeing internal identifiers or technical terminology.
- Being shown every possible action instead of the action needed now.
- Discovering missing forms or requirements only at check-in.
- Having to know which platform section owns a piece of information.
- Repeating the same setup for routine bookings.

#### Success metrics

- Median time to create an appointment.
- Median time to find a customer or appointment.
- Median time to check in an arriving customer.
- Clicks required for booking, rescheduling, form assignment, and check-in.
- Percentage of appointments ready at arrival.
- Duplicate customer rate.
- Scheduling correction rate.
- Percentage of common tasks completed from an appointment workspace.
- Receptionist-reported ease of use during busy periods.

### Practitioner

Practitioners deliver the booked service. Examples include estheticians, massage therapists, hair stylists, instructors, and technicians. Their experience should emphasize preparation, service delivery, documentation, and the next appointment rather than front-desk administration.

#### Daily workflow

The practitioner begins with My Day: an ordered schedule showing upcoming appointments, preparation needs, gaps, delays, and relevant customer context. Before each appointment, the practitioner reviews the service, forms, customer history, preferences, and notes. During or after the appointment, the practitioner records appropriate notes and completes any required documentation before moving to the next customer.

The practitioner should work primarily from the current appointment. Their workflow must be fast on mobile and tablet-sized screens and should avoid exposing unrelated administrative options.

#### Appointment preparation

- Show the service, duration, location, assigned resources, and relevant preparation requirements.
- Highlight changes since the customer's previous visit.
- Surface incomplete forms and information requiring practitioner review.
- Show only customer details relevant to safe and effective service delivery.
- Make special instructions and operational notes visible before the appointment begins.

#### Forms

- Clearly distinguish forms awaiting customer completion from forms awaiting practitioner review.
- Present the most relevant information first rather than requiring the practitioner to read every answer.
- Keep forms attached to the appointment context.
- Avoid asking the practitioner to enter information already supplied by the customer or receptionist.
- Make the next required form action explicit.

#### Notes

- Allow notes to begin from the current appointment.
- Preserve drafts during interruptions.
- Make prior relevant notes easy to reference without leaving the appointment.
- Use clear language that distinguishes customer-visible information from internal operational notes when the existing product rules require that distinction.
- Prefer useful defaults and concise structured inputs where they reduce repeated work.

#### Customer history

- Provide relevant appointment, service, form, and note history in chronological context.
- Emphasize recent and repeated information.
- Make prior services and practitioner preferences easy to find.
- Avoid forcing the practitioner to search across unrelated platform sections.

#### Schedule

- Show the practitioner's own day by default.
- Make the current appointment, next appointment, gaps, and delays visually clear.
- Keep schedule changes immediately understandable.
- Provide enough context to prepare without turning the schedule into a receptionist or manager view.

#### Success metrics

- Percentage of appointments reviewed before service begins.
- Time required to prepare for an appointment.
- Time required to complete required notes and forms.
- Percentage of documentation completed on time.
- Reduction in repeated data entry.
- Practitioner-reported readiness for the next appointment.
- On-time appointment starts and transitions.

### Owner / Manager

The owner or manager oversees business performance, staffing, customer activity, configuration, and operational exceptions. In a small business this person may sometimes perform receptionist or practitioner work, but the owner experience must not assume those roles are always combined.

#### Business oversight

- Understand current business health and operational exceptions.
- Compare performance over meaningful periods and locations.
- Identify issues requiring action without monitoring routine front-desk activity.
- Move from summary information to supporting detail when needed.

#### Reporting

- Present clear answers to business questions rather than raw system data.
- Make reporting periods, filters, and comparisons obvious.
- Preserve context when drilling into details.
- Use consistent definitions for metrics across the platform.

#### Staff

- Review staff schedules, workload, availability, and performance.
- Manage staff access and relevant configuration.
- Identify coverage problems and scheduling constraints.
- Support multiple receptionists, practitioners, roles, and locations.

#### Customers

- Understand customer growth, retention, activity, and service patterns.
- Find a customer quickly when resolving an exception.
- Review customer-level context without replacing the operational receptionist workflow.

#### Revenue

- Monitor revenue, payments, service performance, and meaningful trends.
- Identify exceptions and opportunities requiring attention.
- Relate financial outcomes to services, staff, customers, and locations using established platform concepts.

#### Configuration

- Configure services, resources, schedules, forms, permissions, locations, and business preferences.
- Understand the operational effect of a configuration change before applying it.
- Use sensible defaults while allowing deliberate business-specific choices.
- Avoid exposing technical implementation details.

#### Success metrics

- Time required to answer common business questions.
- Accuracy and consistency of reported metrics.
- Time required to configure common business changes.
- Reduction in configuration mistakes.
- Ability to identify operational exceptions promptly.
- Adoption across staff roles and locations.
- Owner or manager confidence in business status.

### Customer

The customer interacts with the business to book and manage appointments, complete required information, receive timely communication, review history, and make payments. The experience should be clear without requiring knowledge of the business's internal processes.

#### Booking

- Begin with the customer's intent: desired service, practitioner, location, or time.
- Show suitable availability without requiring the customer to understand resource rules.
- Explain duration, price, preparation, and important policies before confirmation.
- Reuse known customer information with permission rather than requesting it again.
- Provide a complete confirmation and a clear next action.

#### Rescheduling

- Begin from the existing appointment.
- Preserve relevant service and preference choices by default.
- Show suitable replacement availability and any meaningful consequences before confirmation.
- Present the old and new appointment details clearly.

#### Forms

- Show which forms are required, why they matter, and when they are due.
- Save progress and support completion on a phone.
- Avoid duplicate questions across forms and profile information when the platform already knows the answer.
- Confirm completion and show anything still outstanding.

#### Notifications

- Communicate appointment confirmations, changes, reminders, forms, and payment needs in actionable language.
- Take the customer directly to the relevant appointment or task.
- Avoid notifications that provide information without a useful next action.
- Respect the customer's established communication preferences.

#### History

- Show upcoming and previous appointments in a simple chronological view.
- Make relevant receipts, completed forms, and service history easy to locate.
- Use customer-friendly service and practitioner names.

#### Payments

- Clearly explain the amount, purpose, timing, and status of a payment.
- Begin payment from the relevant appointment whenever possible.
- Make receipts and payment history easy to find.
- Avoid asking for payment or identity information the platform can safely reuse under existing rules.

#### Success metrics

- Booking completion rate.
- Time required to book or reschedule.
- Form completion rate before arrival.
- Payment completion rate.
- Appointment confirmation and attendance rate.
- Customer support requests per appointment.
- Customer-reported clarity and confidence.
- Percentage of customer tasks completed successfully on mobile.

## UX Principles

### 1. Every unnecessary click is a bug.

Each click must move the user closer to completing the current task. Repeated selection, unnecessary confirmation, avoidable navigation, and screens that exist only to lead to another screen should be treated as usability defects.

### 2. Assume the receptionist has another customer waiting.

Design for interruptions, divided attention, and visible queues. Preserve context, keep actions concise, and make the next required decision obvious. A workflow that succeeds only under uninterrupted attention does not fit front-desk work.

### 3. The appointment is the primary workspace.

Booking, rescheduling, forms, check-in, customer context, practitioner preparation, notes, notifications, and payments should begin from or return to the relevant appointment whenever possible. Users should not need to reconstruct appointment context across platform sections.

### 4. Search before navigation.

When a user knows the customer, appointment, service, or staff member they need, search should be faster than navigating a hierarchy. Prefer searchable selection over long dropdowns and repeated page changes.

### 5. Show the next action instead of every action.

Use appointment state, persona, timing, and known business rules to emphasize what should happen next. Keep secondary actions available without giving them equal visual priority.

### 6. Defaults should solve the common case.

Use known business configuration and current context to choose practical defaults. Defaults should reduce routine decisions while remaining visible and reversible.

### 7. Never ask users to repeat information the system already knows.

Carry context between workflows, reuse established customer information, retain valid selections, and prefill known values. Ask again only when confirmation is necessary or the information may no longer be reliable.

### 8. Use operational language instead of technical language.

Use the words people use while doing the job: guest, appointment, forms to complete, check in, and next available. Do not expose implementation concepts, internal identifiers, repository terminology, or architecture language in user workflows.

### 9. Business logic belongs in the platform. User workflows belong in the application.

The platform should provide consistent rules and capabilities across industries. Each application should compose those capabilities into persona-specific workflows using the industry's language, configuration, and operational priorities.

### 10. Optimize for the receptionist because they spend the most time in the software.

The receptionist experience should set the standard for speed, continuity, search, and appointment-centered work. This priority must not erase other personas; it recognizes that small inefficiencies have their largest cumulative impact at the front desk.

## Navigation Philosophy

Navigation should reflect the current persona's responsibilities. It should not expose the same information architecture to every role merely because the underlying platform capabilities are shared. Persona navigation is an experience-level presentation of existing platform concepts, not a separate business model.

### Reception

- **Today:** Arrivals, waiting customers, incomplete forms, schedule changes, and immediate front-desk actions.
- **New Appointment:** A direct entry into customer search and booking.
- **Schedule:** Calendar, availability, and appointment lookup.
- **Customers:** Search-first customer records and history.
- **Services:** Operational service details needed to answer questions and book correctly.
- **Forms:** Forms requiring assignment, completion, or attention.

### Practitioner

- **My Day:** Current and upcoming work, preparation needs, and delays.
- **My Appointments:** The practitioner's appointment list and appointment workspaces.
- **Forms:** Customer responses and practitioner review tasks.
- **Notes:** Notes requiring completion or recent drafts.
- **Customer History:** Relevant prior services, forms, and notes.

### Owner

- **Dashboard:** Business health and exceptions requiring attention.
- **Reports:** Performance, revenue, utilization, and trends.
- **Customers:** Customer activity, retention, and exceptions.
- **Staff:** People, roles, schedules, workload, and access.
- **Inventory:** Operational inventory status and management.
- **Settings:** Services, resources, forms, locations, permissions, and business configuration.

### Customer

- **Book:** Find and reserve a suitable appointment.
- **Appointments:** Upcoming and previous appointments, including rescheduling actions.
- **Forms:** Required, in-progress, and completed forms.
- **Payments:** Amounts due, receipts, and payment history.
- **Profile:** Contact details, preferences, and account information.

## Workflow Principles

Every future workflow review must ask:

1. Can this be completed with fewer clicks?
2. Can this screen make a decision automatically?
3. Can this workflow begin from an appointment?
4. Can this workflow begin from a search?
5. Can the software suggest the next action?

These questions should be answered before adding another screen, navigation item, confirmation step, or required field. If a workflow cannot satisfy a principle, the reason should come from a genuine user decision or established business rule rather than implementation convenience.

## SaaS Principles

JDS Platform must always be designed for:

- Businesses with one employee.
- Businesses with multiple receptionists.
- Businesses with multiple practitioners.
- Multi-location businesses.

Workflows must remain understandable when one person performs several roles, but no workflow should assume the owner is also the receptionist. Role combinations are a business configuration, not a universal operating model.

Shared platform behavior must not encode the staffing, terminology, services, or habits of one business. Industry applications should configure the shared capabilities and present the appropriate persona experience.

Michelle's workflow should be viewed as one configuration of the platform rather than the default architecture. It is a valuable reference workflow, but it must not constrain other industries, staffing models, locations, or persona experiences.

## Product Architecture Statement

> "The platform owns business rules.
>
> Each industry owns configuration.
>
> Each persona owns a different experience."
