import type { CreateRoleAssignmentInput } from './types';

export type RoleAssignmentValidationErrors = Record<string, string>;

export class RoleAssignmentValidationError extends Error {
  constructor(public readonly fields: RoleAssignmentValidationErrors) {
    super('Role assignment validation failed.');
    this.name = 'RoleAssignmentValidationError';
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCreateRoleAssignment(input: CreateRoleAssignmentInput): void {
  const errors: RoleAssignmentValidationErrors = {};
  validateRoleAssignmentId(input.membershipId, 'membershipId', errors);
  validateRoleAssignmentId(input.roleId, 'roleId', errors);
  if (Object.keys(errors).length) throw new RoleAssignmentValidationError(errors);
}

export function requireRoleAssignmentId(value: string, field: string): string {
  const errors: RoleAssignmentValidationErrors = {};
  validateRoleAssignmentId(value, field, errors);
  if (Object.keys(errors).length) throw new RoleAssignmentValidationError(errors);
  return value.trim();
}

function validateRoleAssignmentId(
  value: unknown,
  field: string,
  errors: RoleAssignmentValidationErrors,
): void {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
    errors[field] = 'Must be a valid UUID';
  }
}
