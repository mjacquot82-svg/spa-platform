import type {
  Appointment,
  AppointmentFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../types';

export interface AppointmentRepository {
  create(businessId: string, input: CreateAppointmentInput): Promise<Appointment>;
  update(businessId: string, id: string, input: UpdateAppointmentInput): Promise<Appointment>;
  list(businessId: string, filters?: AppointmentFilters): Promise<Appointment[]>;
  getById(businessId: string, id: string): Promise<Appointment | null>;
}

/** Volatile, business-scoped storage for demos and tests. */
export class InMemoryAppointmentRepository implements AppointmentRepository {
  private readonly appointments = new Map<string, Appointment>();

  constructor(seed: Appointment[] = []) {
    for (const appointment of seed) this.appointments.set(this.key(appointment.businessId, appointment.id), clone(appointment));
  }

  async create(businessId: string, input: CreateAppointmentInput): Promise<Appointment> {
    const appointment = { ...cloneInput(input), id: crypto.randomUUID(), businessId };
    this.appointments.set(this.key(businessId, appointment.id), appointment);
    return clone(appointment);
  }

  async update(businessId: string, id: string, input: UpdateAppointmentInput): Promise<Appointment> {
    const key = this.key(businessId, id);
    const existing = this.appointments.get(key);
    if (!existing) throw new Error('Appointment not found.');
    const updated = { ...existing, ...cloneInput(input) };
    this.appointments.set(key, updated);
    return clone(updated);
  }

  async list(businessId: string, filters: AppointmentFilters = {}): Promise<Appointment[]> {
    return [...this.appointments.values()]
      .filter((appointment) => appointment.businessId === businessId)
      .filter((appointment) => filters.customerId === undefined || appointment.customerId === filters.customerId)
      .filter((appointment) => filters.resourceId === undefined || appointment.resourceIds.includes(filters.resourceId))
      .filter((appointment) => filters.status === undefined || appointment.status === filters.status)
      .filter((appointment) => filters.active === undefined || appointment.active === filters.active)
      .filter((appointment) => filters.endsAfter === undefined || Date.parse(appointment.end) > Date.parse(filters.endsAfter))
      .filter((appointment) => filters.startsBefore === undefined || Date.parse(appointment.start) < Date.parse(filters.startsBefore))
      .sort((left, right) => left.start.localeCompare(right.start))
      .map(clone);
  }

  async getById(businessId: string, id: string): Promise<Appointment | null> {
    const appointment = this.appointments.get(this.key(businessId, id));
    return appointment ? clone(appointment) : null;
  }

  private key(businessId: string, id: string): string {
    return `${businessId}:${id}`;
  }
}

function clone(appointment: Appointment): Appointment {
  return { ...appointment, resourceIds: [...appointment.resourceIds], metadata: { ...appointment.metadata } };
}

function cloneInput<T extends CreateAppointmentInput | UpdateAppointmentInput>(input: T): T {
  return {
    ...input,
    ...(input.resourceIds ? { resourceIds: [...input.resourceIds] } : {}),
    ...(input.metadata ? { metadata: { ...input.metadata } } : {}),
  };
}
