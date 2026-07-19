import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface DemoPageRegistration {
  path: `/${string}`;
  title: string;
  description: string;
  module: string;
  component: LazyExoticComponent<ComponentType>;
}

/** Add a registration here to make a demo routable and list it in the Playground. */
export const demoPages: readonly DemoPageRegistration[] = [
  {
    path: '/planning-demo',
    title: 'Planning Demo',
    description: 'Prepare future availability, publish September, and see Booking availability update immediately.',
    module: 'Scheduling',
    component: lazy(() => import('../../modules/scheduling/pages/PlanningDemo')),
  },
  {
    path: '/forms-demo',
    title: 'Dynamic Forms Demo',
    description: 'Render, validate, and submit a reusable form definition entirely in memory.',
    module: 'Forms',
    component: lazy(() => import('../../modules/forms/pages/FormsDemo')),
  },
  {
    path: '/booking-demo',
    title: 'Receptionist Booking Demo',
    description: 'Create an appointment through the customer, catalog, and scheduling services.',
    module: 'Booking',
    component: lazy(() => import('../../modules/booking/pages/BookingDemo')),
  },
  {
    path: '/appointment-forms-demo',
    title: 'Appointment Forms Demo',
    description: 'Assign published forms to appointments and review assignment status.',
    module: 'Booking',
    component: lazy(() => import('../../modules/booking/pages/AppointmentFormsDemo')),
  },
  {
    path: '/reschedule-demo',
    title: 'Appointment Rescheduling Demo',
    description: 'Find replacement availability and reschedule an existing appointment.',
    module: 'Booking',
    component: lazy(() => import('../../modules/booking/pages/RescheduleDemo')),
  },
  {
    path: '/calendar-demo',
    title: 'Calendar Demo',
    description: 'Explore calendar selection, event clicks, drag-and-drop, and resizing.',
    module: 'Scheduling',
    component: lazy(() => import('../../modules/scheduling/pages/CalendarDemo')),
  },
  {
    path: '/resources-demo',
    title: 'Resources Demo',
    description: 'Browse reusable staff, rooms, and equipment grouped by resource type.',
    module: 'Scheduling',
    component: lazy(() => import('../../modules/scheduling/pages/ResourcesDemo')),
  },
  {
    path: '/working-hours-demo',
    title: 'Working Hours Demo',
    description: 'Review recurring weekly schedules, split shifts, and disabled days.',
    module: 'Scheduling',
    component: lazy(() => import('../../modules/scheduling/pages/WorkingHoursDemo')),
  },
  {
    path: '/availability-exceptions-demo',
    title: 'Availability Exceptions Demo',
    description: 'Compare recurring working hours with temporary closures and extra availability.',
    module: 'Scheduling',
    component: lazy(() => import('../../modules/scheduling/pages/AvailabilityExceptionsDemo')),
  },
  {
    path: '/appointments-demo',
    title: 'Appointments Demo',
    description: 'See how appointments, exceptions, and working hours compose into available slots.',
    module: 'Scheduling',
    component: lazy(() => import('../../modules/scheduling/pages/AppointmentsDemo')),
  },
] as const;

export function findDemoPage(pathname: string): DemoPageRegistration | undefined {
  return demoPages.find((demo) => demo.path === pathname);
}
