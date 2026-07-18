import {
  APPOINTMENT_STATUSES,
  type AppointmentValidationIssue,
  type AppointmentValidationResult,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
} from '../types';

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

export function validateAppointment(
  input: CreateAppointmentInput | UpdateAppointmentInput,
  partial = false,
): AppointmentValidationResult {
  const issues: AppointmentValidationIssue[] = [];
  const has = (field: keyof CreateAppointmentInput) => !partial || field in input;

  for (const field of ['customerId', 'catalogItemId'] as const) {
    if (has(field) && (typeof input[field] !== 'string' || !input[field]?.trim())) {
      issues.push({ field, message: 'Required.' });
    }
  }
  if (has('resourceIds')) {
    if (!Array.isArray(input.resourceIds) || input.resourceIds.length === 0) {
      issues.push({ field: 'resourceIds', message: 'At least one resource is required.' });
    } else if (input.resourceIds.some((id) => typeof id !== 'string' || !id.trim())) {
      issues.push({ field: 'resourceIds', message: 'Resource ids must be non-empty strings.' });
    }
  }
  if (has('status') && !APPOINTMENT_STATUSES.includes(input.status as never)) {
    issues.push({ field: 'status', message: 'Must be a supported appointment status.' });
  }
  if (has('notes') && typeof input.notes !== 'string') {
    issues.push({ field: 'notes', message: 'Must be text.' });
  }
  if (has('metadata') && (!input.metadata || typeof input.metadata !== 'object' || Array.isArray(input.metadata))) {
    issues.push({ field: 'metadata', message: 'Must be an object.' });
  }
  if (has('active') && typeof input.active !== 'boolean') {
    issues.push({ field: 'active', message: 'Must be a boolean.' });
  }
  validateTimestamp('start', input.start, has('start'), issues);
  validateTimestamp('end', input.end, has('end'), issues);
  if (typeof input.start === 'string' && typeof input.end === 'string' &&
      ISO_8601.test(input.start) && ISO_8601.test(input.end) &&
      Date.parse(input.start) >= Date.parse(input.end)) {
    issues.push({ field: 'end', message: 'Must be after start.' });
  }
  if (partial && Object.keys(input).length === 0) {
    issues.push({ field: 'appointment', message: 'At least one field is required.' });
  }
  return issues.length ? { valid: false, issues } : { valid: true };
}

function validateTimestamp(
  field: 'start' | 'end',
  value: string | undefined,
  required: boolean,
  issues: AppointmentValidationIssue[],
): void {
  if (!required) return;
  if (typeof value !== 'string' || !ISO_8601.test(value) || !Number.isFinite(Date.parse(value))) {
    issues.push({ field, message: 'Must be an ISO 8601 timestamp with an explicit offset.' });
  }
}
