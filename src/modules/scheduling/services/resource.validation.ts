import {
  SCHEDULING_RESOURCE_TYPES,
  type CreateSchedulingResourceInput,
  type SchedulingResourceValidationIssue,
  type SchedulingResourceValidationResult,
  type UpdateSchedulingResourceInput,
} from '../types';

export function validateSchedulingResource(
  input: CreateSchedulingResourceInput | UpdateSchedulingResourceInput,
  partial = false,
): SchedulingResourceValidationResult {
  const issues: SchedulingResourceValidationIssue[] = [];
  const has = (field: keyof CreateSchedulingResourceInput) => !partial || field in input;

  if (has('name')) validateRequiredText(input.name, 'name', 200, issues);
  if (has('type') && !SCHEDULING_RESOURCE_TYPES.includes(input.type as never)) {
    issues.push({ field: 'type', message: 'Must be staff, room, or equipment.' });
  }
  if (input.description !== undefined) {
    validateOptionalText(input.description, 'description', 2000, issues);
  }
  if (input.color !== undefined) validateOptionalText(input.color, 'color', 100, issues);
  if (has('active') && typeof input.active !== 'boolean') {
    issues.push({ field: 'active', message: 'Must be a boolean.' });
  }
  if (has('metadata') && !isMetadata(input.metadata)) {
    issues.push({ field: 'metadata', message: 'Must be an object.' });
  }
  if (partial && Object.keys(input).length === 0) {
    issues.push({ field: 'resource', message: 'At least one field is required.' });
  }

  return issues.length ? { valid: false, issues } : { valid: true };
}

function validateRequiredText(
  value: unknown,
  field: string,
  maxLength: number,
  issues: SchedulingResourceValidationIssue[],
): void {
  if (typeof value !== 'string') {
    issues.push({ field, message: 'Must be text.' });
  } else if (!value.trim()) {
    issues.push({ field, message: 'Required.' });
  } else if (value.trim().length > maxLength) {
    issues.push({ field, message: `Must be ${maxLength} characters or fewer.` });
  }
}

function validateOptionalText(
  value: unknown,
  field: string,
  maxLength: number,
  issues: SchedulingResourceValidationIssue[],
): void {
  if (typeof value !== 'string') {
    issues.push({ field, message: 'Must be text.' });
  } else if (!value.trim()) {
    issues.push({ field, message: 'Omit this field instead of using an empty value.' });
  } else if (value.trim().length > maxLength) {
    issues.push({ field, message: `Must be ${maxLength} characters or fewer.` });
  }
}

function isMetadata(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
