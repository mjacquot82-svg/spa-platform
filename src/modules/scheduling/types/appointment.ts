export const APPOINTMENT_STATUSES = [
  'tentative',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'no_show',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** A business-scoped scheduling fact. Booking is a separate workflow. */
export interface Appointment {
  id: string;
  businessId: string;
  customerId: string;
  catalogItemId: string;
  resourceIds: string[];
  /** Explicit-offset ISO 8601 timestamp. */
  start: string;
  /** Explicit-offset ISO 8601 timestamp. */
  end: string;
  status: AppointmentStatus;
  notes: string;
  metadata: Record<string, unknown>;
  active: boolean;
}

export type CreateAppointmentInput = Omit<Appointment, 'id' | 'businessId'>;
export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;

export interface AppointmentFilters {
  customerId?: string;
  resourceId?: string;
  status?: AppointmentStatus;
  active?: boolean;
  endsAfter?: string;
  startsBefore?: string;
}
