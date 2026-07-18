import type {
  Appointment,
  AppointmentFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../types';
import { AppointmentConflictError, AppointmentValidationError } from '../types';
import { intervalsOverlap } from './availability.service';
import type { AppointmentRepository } from './appointment.repository';
import { validateAppointment } from './appointment.validation';

export class AppointmentService {
  constructor(private readonly repository: AppointmentRepository) {}

  async createAppointment(businessId: string, input: CreateAppointmentInput): Promise<Appointment> {
    assertValid(input, false);
    const scopedBusinessId = requireId(businessId, 'businessId');
    const normalized = normalize(input) as CreateAppointmentInput;
    await this.assertNoConflict(scopedBusinessId, normalized);
    return this.repository.create(scopedBusinessId, normalized);
  }

  async updateAppointment(
    businessId: string,
    id: string,
    input: UpdateAppointmentInput,
  ): Promise<Appointment> {
    assertValid(input, true);
    const scopedBusinessId = requireId(businessId, 'businessId');
    const scopedId = requireId(id, 'id');
    const existing = await this.repository.getById(scopedBusinessId, scopedId);
    if (!existing) throw new Error('Appointment not found.');
    const normalized = normalize(input);
    const merged = { ...existing, ...normalized };
    assertValid(merged, false);
    await this.assertNoConflict(scopedBusinessId, merged, scopedId);
    return this.repository.update(scopedBusinessId, scopedId, normalized);
  }

  archiveAppointment(businessId: string, id: string): Promise<Appointment> {
    return this.repository.update(requireId(businessId, 'businessId'), requireId(id, 'id'), { active: false });
  }

  async restoreAppointment(businessId: string, id: string): Promise<Appointment> {
    const scopedBusinessId = requireId(businessId, 'businessId');
    const scopedId = requireId(id, 'id');
    const existing = await this.repository.getById(scopedBusinessId, scopedId);
    if (!existing) throw new Error('Appointment not found.');
    await this.assertNoConflict(scopedBusinessId, { ...existing, active: true }, scopedId);
    return this.repository.update(scopedBusinessId, scopedId, { active: true });
  }

  listAppointments(businessId: string, filters?: AppointmentFilters): Promise<Appointment[]> {
    return this.repository.list(requireId(businessId, 'businessId'), normalizeFilters(filters));
  }

  listAppointmentsForResource(businessId: string, resourceId: string): Promise<Appointment[]> {
    return this.listAppointments(businessId, { resourceId: requireId(resourceId, 'resourceId') });
  }

  listAppointmentsForCustomer(businessId: string, customerId: string): Promise<Appointment[]> {
    return this.listAppointments(businessId, { customerId: requireId(customerId, 'customerId') });
  }

  listAppointmentsForDay(businessId: string, date: string): Promise<Appointment[]> {
    const { start, end } = dayBounds(date);
    return this.listAppointments(businessId, { endsAfter: start, startsBefore: end });
  }

  getAppointment(businessId: string, id: string): Promise<Appointment | null> {
    return this.repository.getById(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }

  private async assertNoConflict(
    businessId: string,
    proposed: Pick<Appointment, 'resourceIds' | 'start' | 'end' | 'status' | 'active'>,
    excludeId?: string,
  ): Promise<void> {
    if (!blocksAvailability(proposed)) return;
    const appointments = await this.repository.list(businessId, { active: true });
    const conflicts = appointments.filter((appointment) =>
      appointment.id !== excludeId && blocksAvailability(appointment) &&
      appointment.resourceIds.some((resourceId) => proposed.resourceIds.includes(resourceId)) &&
      intervalsOverlap(proposed, appointment),
    );
    if (conflicts.length) throw new AppointmentConflictError(conflicts.map((item) => item.id));
  }
}

function blocksAvailability(appointment: Pick<Appointment, 'status' | 'active'>): boolean {
  return appointment.active && appointment.status !== 'cancelled' && appointment.status !== 'no_show';
}

function assertValid(input: CreateAppointmentInput | UpdateAppointmentInput, partial: boolean): void {
  const result = validateAppointment(input, partial);
  if (!result.valid) throw new AppointmentValidationError(result.issues);
}

function requireId(value: string, field: string): string {
  if (!value.trim()) throw new TypeError(`${field} is required.`);
  return value.trim();
}

function normalize<T extends CreateAppointmentInput | UpdateAppointmentInput>(input: T): T {
  return {
    ...input,
    ...('customerId' in input && input.customerId !== undefined ? { customerId: input.customerId.trim() } : {}),
    ...('catalogItemId' in input && input.catalogItemId !== undefined ? { catalogItemId: input.catalogItemId.trim() } : {}),
    ...(input.resourceIds ? { resourceIds: [...new Set(input.resourceIds.map((id) => id.trim()))] } : {}),
    ...('notes' in input && input.notes !== undefined ? { notes: input.notes.trim() } : {}),
    ...(input.metadata ? { metadata: { ...input.metadata } } : {}),
  };
}

function normalizeFilters(filters?: AppointmentFilters): AppointmentFilters | undefined {
  if (!filters) return undefined;
  return {
    ...filters,
    ...(filters.customerId ? { customerId: requireId(filters.customerId, 'customerId') } : {}),
    ...(filters.resourceId ? { resourceId: requireId(filters.resourceId, 'resourceId') } : {}),
  };
}

function dayBounds(value: string): { start: string; end: string } {
  const match = /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2}))?$/.exec(value);
  if (!match) throw new TypeError('date must be YYYY-MM-DD or an explicit-offset ISO timestamp.');
  const start = `${match[1]}T00:00:00${match[2] ?? 'Z'}`;
  const end = new Date(Date.parse(start) + 24 * 60 * 60 * 1000).toISOString();
  return { start, end };
}
