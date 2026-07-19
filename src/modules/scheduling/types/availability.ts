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
  /** Appointment omitted from conflict checks, for replacement-slot searches. */
  excludeAppointmentId?: string;
  workingHours: import('./working-hours').WorkingHours[];
  existingAppointments: import('./appointment').Appointment[];
  availabilityExceptions: AvailabilityException[];
}

export interface FindNextAvailableAppointmentsInput {
  businessId: string;
  catalogItemId: string;
  preferredResourceId?: string;
  preferredDate?: string;
  numberOfSuggestions?: number;
}

export type AppointmentSuggestionReason =
  | 'Earliest Available'
  | 'Preferred Provider'
  | 'Morning'
  | 'Afternoon';

export interface AppointmentSuggestion {
  resource: import('./resource').SchedulingResource;
  start: string;
  end: string;
  dayLabel: string;
  friendlyDate: string;
  friendlyTime: string;
  duration: number;
  reason: AppointmentSuggestionReason;
}
