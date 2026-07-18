export interface AvailabilityException {
  id: string;
  resourceId: string;
  start: string;
  end: string;
  type: 'available' | 'unavailable';
  reason?: string;
}

export interface TimeInterval {
  start: string;
  end: string;
}

export interface FindAvailableSlotsForDayInput {
  /** ISO date or offset-bearing ISO timestamp identifying the business calendar day. */
  date: string;
  resourceId: string;
  requestedDurationMinutes: number;
  slotIncrementMinutes: number;
  workingHours: import('./working-hours').WorkingHours[];
  existingAppointments: import('./appointment').Appointment[];
  availabilityExceptions: AvailabilityException[];
}
