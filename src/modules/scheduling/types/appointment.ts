export type AppointmentStatus =
  | 'tentative'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled';

export interface Appointment {
  id: string;
  businessId: string;
  customerId?: string;
  catalogItemId?: string;
  resourceIds: string[];
  title: string;
  /** ISO 8601 timestamp. */
  start: string;
  /** ISO 8601 timestamp. */
  end: string;
  status: AppointmentStatus;
  notes?: string;
}
