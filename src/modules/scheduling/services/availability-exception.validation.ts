import type {
  AvailabilityExceptionValidationIssue,
  AvailabilityExceptionValidationResult,
  CreateAvailabilityExceptionInput,
  UpdateAvailabilityExceptionInput,
} from '../types';

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

export function validateAvailabilityException(
  input: CreateAvailabilityExceptionInput | UpdateAvailabilityExceptionInput,
  partial = false,
): AvailabilityExceptionValidationResult {
  const issues: AvailabilityExceptionValidationIssue[] = [];
  const has = (field: keyof CreateAvailabilityExceptionInput) => !partial || field in input;

  for (const field of ['resourceId', 'title'] as const) {
    if (has(field) && (typeof input[field] !== 'string' || !input[field]?.trim())) {
      issues.push({ field, message: 'Required.' });
    }
  }
  if (has('type') && input.type !== 'available' && input.type !== 'unavailable') {
    issues.push({ field: 'type', message: 'Must be available or unavailable.' });
  }
  if (has('active') && typeof input.active !== 'boolean') {
    issues.push({ field: 'active', message: 'Must be a boolean.' });
  }
  if (has('metadata') && (!input.metadata || typeof input.metadata !== 'object' || Array.isArray(input.metadata))) {
    issues.push({ field: 'metadata', message: 'Must be an object.' });
  }
  validateTimestamp('start', input.start, has('start'), issues);
  validateTimestamp('end', input.end, has('end'), issues);
  if (typeof input.start === 'string' && typeof input.end === 'string' &&
      ISO_8601.test(input.start) && ISO_8601.test(input.end) &&
      Date.parse(input.start) >= Date.parse(input.end)) {
    issues.push({ field: 'end', message: 'Must be after start.' });
  }
  if (partial && Object.keys(input).length === 0) {
    issues.push({ field: 'availabilityException', message: 'At least one field is required.' });
  }
  return issues.length ? { valid: false, issues } : { valid: true };
}

function validateTimestamp(
  field: 'start' | 'end',
  value: string | undefined,
  required: boolean,
  issues: AvailabilityExceptionValidationIssue[],
): void {
  if (!required) return;
  if (typeof value !== 'string' || !ISO_8601.test(value) || !Number.isFinite(Date.parse(value))) {
    issues.push({ field, message: 'Must be an ISO 8601 timestamp with an explicit offset.' });
  }
}
