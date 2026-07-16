import { MEMBERSHIP_STATUSES } from './types';
import type { CreateMembershipInput, MembershipStatus, UpdateMembershipInput } from './types';

export type MembershipValidationErrors = Record<string, string>;

export class MembershipValidationError extends Error {
  constructor(public readonly fields: MembershipValidationErrors) {
    super('Membership validation failed');
    this.name = 'MembershipValidationError';
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateId(value: unknown, field: string, errors: MembershipValidationErrors): void {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
    errors[field] = 'Must be a valid UUID';
  }
}

function validateStatus(value: unknown, errors: MembershipValidationErrors): void {
  if (!MEMBERSHIP_STATUSES.includes(value as MembershipStatus)) {
    errors.status = `Must be one of: ${MEMBERSHIP_STATUSES.join(', ')}`;
  }
}

export function validateCreateMembership(input: CreateMembershipInput): void {
  const errors: MembershipValidationErrors = {};
  validateId(input.userId, 'userId', errors);
  validateId(input.businessId, 'businessId', errors);
  if (input.status !== undefined) validateStatus(input.status, errors);
  if (Object.keys(errors).length) throw new MembershipValidationError(errors);
}

export function validateUpdateMembership(input: UpdateMembershipInput): void {
  const errors: MembershipValidationErrors = {};
  validateStatus(input.status, errors);
  if (Object.keys(errors).length) throw new MembershipValidationError(errors);
}

export function requireMembershipId(value: string, field: string): string {
  const errors: MembershipValidationErrors = {};
  validateId(value, field, errors);
  if (Object.keys(errors).length) throw new MembershipValidationError(errors);
  return value.trim();
}
