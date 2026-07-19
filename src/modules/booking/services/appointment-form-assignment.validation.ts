import { APPOINTMENT_FORM_ASSIGNMENT_STATUSES, type AppointmentFormAssignmentStatus, type AppointmentFormAssignmentValidationIssue, type AppointmentFormAssignmentValidationResult, type CreateAppointmentFormAssignmentInput } from '../types';

export function validateAppointmentFormAssignment(input: CreateAppointmentFormAssignmentInput): AppointmentFormAssignmentValidationResult {
  const issues: AppointmentFormAssignmentValidationIssue[] = [];
  if (!input.appointmentId?.trim()) issues.push({ field: 'appointmentId', message: 'Appointment is required.' });
  if (!input.formId?.trim()) issues.push({ field: 'formId', message: 'Form is required.' });
  return issues.length ? { valid: false, issues } : { valid: true };
}

export function validateAppointmentFormAssignmentStatus(status: AppointmentFormAssignmentStatus): AppointmentFormAssignmentValidationResult {
  return APPOINTMENT_FORM_ASSIGNMENT_STATUSES.includes(status)
    ? { valid: true }
    : { valid: false, issues: [{ field: 'status', message: 'Status must be pending, completed, or expired.' }] };
}
