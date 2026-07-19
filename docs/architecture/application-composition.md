# Application Composition

## Composition root

The application composition root is the only production location that constructs repository adapters and domain services. It builds dependencies in one direction:

1. Repository adapters
2. Domain services
3. Cross-domain application services such as `SchedulingService`
4. `ApplicationServicesProvider`
5. Routed pages and shared workflow components

`createProductionApplication()` creates the graph once, above the router outlet. Every production page therefore observes the same service instances and the same underlying application state.

## Repository registration

Repository choice is centralized in `createApplicationServices()`. Pages never import or construct repository implementations. The current production registration is deliberately fixture-free and uses volatile adapters until persistent adapters are introduced. Replacing those adapters does not require workflow or page changes.

## Service registration

The composition root constructs existing Catalog, Customer, Forms, Booking, and Scheduling services. The same `PlanningPeriodService` is passed to both the application provider and `SchedulingService`. Publishing a period through Planning therefore changes the publication state used by subsequent Booking suggestions immediately.

## Application providers

`ApplicationServicesProvider` exposes the configured graph through `useApplicationServices()`. Production pages are thin wrappers over shared workflow components and consume services from this provider. They do not select infrastructure or own service lifetimes.

## Demo providers

Playground fixtures live in `demo-application.ts`. The Developer Playground creates one explicit demo graph and wraps all selected demos with it. Demo state is isolated from production state, while navigation between Planning and Booking demos preserves the same demo service instances.

## Production providers

`App.tsx` constructs the production graph once and wraps the production shell. The production Planning route uses `PlanningPage`; the Playground registry uses `PlanningDemo`. Both render the shared `PlanningWorkflow`, but only the demo provider supplies fixtures.

## Why pages never construct repositories

Page-local repositories fragment state by route and bind UI code to infrastructure. They can make a publication appear successful in Planning while Booking continues reading a different repository. Central composition prevents that split, makes repository replacement explicit, and allows integration tests to exercise the same graph used by workflows.
