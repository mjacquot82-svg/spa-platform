export interface AvailabilityException {
  id: string;
  businessId: string;
  resourceId: string;
  start: string;
  end: string;
  type: 'available' | 'unavailable';
  title: string;
  reason?: string;
  color?: string;
  metadata: Record<string, unknown>;
  active: boolean;
}

export type CreateAvailabilityExceptionInput = Omit<AvailabilityException, 'id' | 'businessId'>;
export type UpdateAvailabilityExceptionInput = Partial<CreateAvailabilityExceptionInput>;

export interface AvailabilityExceptionFilters {
  resourceId?: string;
  type?: AvailabilityException['type'];
  active?: boolean;
  /** Includes exceptions whose half-open interval overlaps this timestamp. */
  endsAfter?: string;
  /** Includes exceptions whose half-open interval overlaps this timestamp. */
  startsBefore?: string;
}

export interface TimeInterval {
  start: string;
  end: string;
}

export interface FindAvailableSlotsForDayInput {
  /** ISO date or offset-bearing ISO timestamp identifying the business calendar day. */
  date: string;
  businessId: string;
  resourceId: string;
  requestedDurationMinutes: number;
  slotIncrementMinutes: number;
  workingHours: import('./working-hours').WorkingHours[];
  existingAppointments: import('./appointment').Appointment[];
  availabilityExceptions: AvailabilityException[];
}
