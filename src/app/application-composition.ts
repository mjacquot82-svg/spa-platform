import { CatalogItemService, InMemoryCatalogItemRepository } from '../modules/catalog/services';
import type { CatalogItem } from '../modules/catalog/types';
import { CustomerService, InMemoryCustomerRepository } from '../modules/customers/services';
import type { Customer } from '../modules/customers/types';
import { FormService, InMemoryFormRepository } from '../modules/forms/services';
import type { Form } from '../modules/forms/types';
import { AppointmentFormAssignmentService, InMemoryAppointmentFormAssignmentRepository } from '../modules/booking/services';
import type { AppointmentFormAssignment } from '../modules/booking/types';
import {
  AppointmentService, AvailabilityExceptionService, InMemoryAppointmentRepository,
  InMemoryAvailabilityExceptionRepository, InMemoryPlanningPeriodRepository,
  InMemorySchedulingResourceRepository, InMemoryWorkingHoursRepository, PlanningPeriodService,
  SchedulingResourceService, SchedulingService, WorkingHoursService,
} from '../modules/scheduling/services';
import type { Appointment, AvailabilityException, PlanningPeriod, SchedulingResource, WorkingHours } from '../modules/scheduling/types';

export interface ApplicationServices {
  businessId: string;
  catalogItems: CatalogItemService;
  customers: CustomerService;
  forms: FormService;
  appointments: AppointmentService;
  appointmentForms: AppointmentFormAssignmentService;
  resources: SchedulingResourceService;
  workingHours: WorkingHoursService;
  availabilityExceptions: AvailabilityExceptionService;
  planningPeriods: PlanningPeriodService;
  scheduling: SchedulingService;
}

export interface ApplicationSeed {
  catalogItems?: CatalogItem[];
  customers?: Customer[];
  forms?: Form[];
  appointments?: Appointment[];
  appointmentForms?: AppointmentFormAssignment[];
  resources?: SchedulingResource[];
  workingHours?: WorkingHours[];
  availabilityExceptions?: AvailabilityException[];
  planningPeriods?: PlanningPeriod[];
}

export function createApplicationServices(businessId: string, seed: ApplicationSeed = {}): ApplicationServices {
  const catalogItems = new CatalogItemService(new InMemoryCatalogItemRepository(seed.catalogItems));
  const customers = new CustomerService(new InMemoryCustomerRepository(seed.customers));
  const forms = new FormService(new InMemoryFormRepository(seed.forms));
  const appointments = new AppointmentService(new InMemoryAppointmentRepository(seed.appointments));
  const resources = new SchedulingResourceService(new InMemorySchedulingResourceRepository(seed.resources));
  const workingHours = new WorkingHoursService(new InMemoryWorkingHoursRepository(seed.workingHours));
  const availabilityExceptions = new AvailabilityExceptionService(new InMemoryAvailabilityExceptionRepository(seed.availabilityExceptions));
  const planningPeriods = new PlanningPeriodService(new InMemoryPlanningPeriodRepository(seed.planningPeriods));
  const appointmentForms = new AppointmentFormAssignmentService(new InMemoryAppointmentFormAssignmentRepository(seed.appointmentForms), appointments, forms);
  const scheduling = new SchedulingService(catalogItems, resources, workingHours, availabilityExceptions, appointments, planningPeriods);
  return { businessId, catalogItems, customers, forms, appointments, appointmentForms, resources, workingHours, availabilityExceptions, planningPeriods, scheduling };
}

/** Fixture-free registration used by production routes until persistent adapters are registered. */
export function createProductionApplication(): ApplicationServices { return createApplicationServices('production-business'); }
