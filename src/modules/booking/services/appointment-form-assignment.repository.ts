import type { AppointmentFormAssignment, AppointmentFormAssignmentFilters, AppointmentFormAssignmentStatus, CreateAppointmentFormAssignmentInput } from '../types';

export interface AppointmentFormAssignmentRepository {
  create(businessId: string, input: CreateAppointmentFormAssignmentInput): Promise<AppointmentFormAssignment>;
  updateStatus(businessId: string, id: string, status: AppointmentFormAssignmentStatus, completedAt: string | null): Promise<AppointmentFormAssignment>;
  list(businessId: string, filters?: AppointmentFormAssignmentFilters): Promise<AppointmentFormAssignment[]>;
  getById(businessId: string, id: string): Promise<AppointmentFormAssignment | null>;
}

/** Volatile, business-scoped relationship storage for demos and tests. */
export class InMemoryAppointmentFormAssignmentRepository implements AppointmentFormAssignmentRepository {
  private readonly assignments = new Map<string, AppointmentFormAssignment>();

  constructor(seed: AppointmentFormAssignment[] = []) {
    for (const assignment of seed) this.assignments.set(this.key(assignment.businessId, assignment.id), { ...assignment });
  }

  async create(businessId: string, input: CreateAppointmentFormAssignmentInput): Promise<AppointmentFormAssignment> {
    const assignment: AppointmentFormAssignment = { id: crypto.randomUUID(), businessId, appointmentId: input.appointmentId, formId: input.formId, status: 'pending', assignedAt: new Date().toISOString(), completedAt: null };
    this.assignments.set(this.key(businessId, assignment.id), assignment);
    return { ...assignment };
  }

  async updateStatus(businessId: string, id: string, status: AppointmentFormAssignmentStatus, completedAt: string | null): Promise<AppointmentFormAssignment> {
    const key = this.key(businessId, id);
    const existing = this.assignments.get(key);
    if (!existing) throw new Error('Appointment form assignment not found.');
    const updated = { ...existing, status, completedAt };
    this.assignments.set(key, updated);
    return { ...updated };
  }

  async list(businessId: string, filters: AppointmentFormAssignmentFilters = {}): Promise<AppointmentFormAssignment[]> {
    return [...this.assignments.values()]
      .filter((item) => item.businessId === businessId)
      .filter((item) => filters.appointmentId === undefined || item.appointmentId === filters.appointmentId)
      .filter((item) => filters.formId === undefined || item.formId === filters.formId)
      .filter((item) => filters.status === undefined || item.status === filters.status)
      .sort((left, right) => right.assignedAt.localeCompare(left.assignedAt))
      .map((item) => ({ ...item }));
  }

  async getById(businessId: string, id: string): Promise<AppointmentFormAssignment | null> {
    const assignment = this.assignments.get(this.key(businessId, id));
    return assignment ? { ...assignment } : null;
  }

  private key(businessId: string, id: string): string { return `${businessId}:${id}`; }
}
