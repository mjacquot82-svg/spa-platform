export interface AppointmentValidationIssue {
  field: string;
  message: string;
}

export type AppointmentValidationResult =
  | { valid: true }
  | { valid: false; issues: AppointmentValidationIssue[] };

export class AppointmentValidationError extends Error {
  constructor(public readonly issues: AppointmentValidationIssue[]) {
    super('Appointment validation failed.');
    this.name = 'AppointmentValidationError';
  }
}

export class AppointmentConflictError extends Error {
  constructor(public readonly conflictingAppointmentIds: string[]) {
    super('Appointment conflicts with an existing appointment for a shared resource.');
    this.name = 'AppointmentConflictError';
  }
}
