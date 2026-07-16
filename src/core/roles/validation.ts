import type { CreateRoleInput, RoleFilters, UpdateRoleInput } from './types';

export interface RoleValidationIssue {
  field: string;
  message: string;
}

export type RoleValidationResult =
  | { valid: true }
  | { valid: false; issues: RoleValidationIssue[] };

export class RoleValidationError extends Error {
  constructor(public readonly issues: RoleValidationIssue[]) {
    super('Role validation failed.');
    this.name = 'RoleValidationError';
  }
}

export function validateRole(
  input: CreateRoleInput | UpdateRoleInput,
  partial = false,
): RoleValidationResult {
  const issues: RoleValidationIssue[] = [];
  const has = (field: keyof CreateRoleInput) => !partial || field in input;

  if (has('name')) requiredText(input.name, 'name', 100, issues);
  if (has('description')) text(input.description, 'description', 2000, issues);
  if (has('systemRole') && typeof input.systemRole !== 'boolean') {
    issues.push({ field: 'systemRole', message: 'Must be a boolean.' });
  }
  if (has('active') && typeof input.active !== 'boolean') {
    issues.push({ field: 'active', message: 'Must be a boolean.' });
  }
  if (partial && Object.keys(input).length === 0) {
    issues.push({ field: 'role', message: 'At least one field is required.' });
  }

  return issues.length ? { valid: false, issues } : { valid: true };
}

export function validateRoleFilters(filters?: RoleFilters): void {
  if (filters?.limit !== undefined && (!Number.isInteger(filters.limit) || filters.limit < 1)) {
    throw new TypeError('limit must be a positive integer.');
  }
  if (filters?.offset !== undefined && (!Number.isInteger(filters.offset) || filters.offset < 0)) {
    throw new TypeError('offset must be a non-negative integer.');
  }
}

function requiredText(
  value: unknown,
  field: string,
  maxLength: number,
  issues: RoleValidationIssue[],
): void {
  text(value, field, maxLength, issues);
  if (typeof value === 'string' && value.trim().length === 0) {
    issues.push({ field, message: 'Required.' });
  }
}

function text(
  value: unknown,
  field: string,
  maxLength: number,
  issues: RoleValidationIssue[],
): void {
  if (typeof value !== 'string') {
    issues.push({ field, message: 'Must be text.' });
  } else if (value.trim().length > maxLength) {
    issues.push({ field, message: `Must be ${maxLength} characters or fewer.` });
  }
}
