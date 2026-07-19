export interface AppointmentFormAssignmentValidationIssue { field: string; message: string; }
export type AppointmentFormAssignmentValidationResult = { valid: true } | { valid: false; issues: AppointmentFormAssignmentValidationIssue[] };

export class AppointmentFormAssignmentValidationError extends Error {
  constructor(public readonly issues: AppointmentFormAssignmentValidationIssue[]) {
    super('Appointment form assignment validation failed.');
    this.name = 'AppointmentFormAssignmentValidationError';
  }
}

export class DuplicateAppointmentFormAssignmentError extends Error {
  constructor() { super('This form is already assigned to the appointment.'); this.name = 'DuplicateAppointmentFormAssignmentError'; }
}
