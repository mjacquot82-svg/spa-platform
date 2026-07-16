import type {
  CreatePermissionInput,
  PermissionFilters,
  UpdatePermissionInput,
} from './types';

export interface PermissionValidationIssue {
  field: string;
  message: string;
}

export type PermissionValidationResult =
  | { valid: true }
  | { valid: false; issues: PermissionValidationIssue[] };

export class PermissionValidationError extends Error {
  constructor(public readonly issues: PermissionValidationIssue[]) {
    super('Permission validation failed.');
    this.name = 'PermissionValidationError';
  }
}

const PERMISSION_KEY_PATTERN = /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/;

export function validatePermission(
  input: CreatePermissionInput | UpdatePermissionInput,
  partial = false,
): PermissionValidationResult {
  const issues: PermissionValidationIssue[] = [];
  const has = (field: keyof CreatePermissionInput) => !partial || field in input;

  if (has('key')) {
    if (typeof (input as CreatePermissionInput).key !== 'string') {
      issues.push({ field: 'key', message: 'Must be text.' });
    } else if (!PERMISSION_KEY_PATTERN.test((input as CreatePermissionInput).key.trim())) {
      issues.push({
        field: 'key',
        message: 'Must contain at least two lowercase dot-separated segments.',
      });
    } else if ((input as CreatePermissionInput).key.trim().length > 200) {
      issues.push({ field: 'key', message: 'Must be 200 characters or fewer.' });
    }
  }
  if (has('description')) {
    const description = input.description;
    if (typeof description !== 'string') {
      issues.push({ field: 'description', message: 'Must be text.' });
    } else if (description.trim().length > 2000) {
      issues.push({ field: 'description', message: 'Must be 2000 characters or fewer.' });
    }
  }
  if (has('active') && typeof input.active !== 'boolean') {
    issues.push({ field: 'active', message: 'Must be a boolean.' });
  }
  if (partial && Object.keys(input).length === 0) {
    issues.push({ field: 'permission', message: 'At least one field is required.' });
  }

  return issues.length ? { valid: false, issues } : { valid: true };
}

export function validatePermissionFilters(filters?: PermissionFilters): void {
  if (filters?.limit !== undefined && (!Number.isInteger(filters.limit) || filters.limit < 1)) {
    throw new TypeError('limit must be a positive integer.');
  }
  if (filters?.offset !== undefined && (!Number.isInteger(filters.offset) || filters.offset < 0)) {
    throw new TypeError('offset must be a non-negative integer.');
  }
}
