import type { Address } from '../../shared/types';
import type { CreateBusinessInput, UpdateBusinessInput } from './types';

export type BusinessValidationErrors = Record<string, string>;

export class BusinessValidationError extends Error {
  constructor(public readonly fields: BusinessValidationErrors) {
    super('Business validation failed');
    this.name = 'BusinessValidationError';
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

function requiredText(
  value: unknown,
  field: string,
  errors: BusinessValidationErrors,
  maxLength: number,
) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors[field] = 'Required';
  } else if (value.trim().length > maxLength) {
    errors[field] = `Must be ${maxLength} characters or fewer`;
  }
}

function validateUrl(value: unknown, field: string, errors: BusinessValidationErrors) {
  requiredText(value, field, errors, 2048);
  if (errors[field]) return;

  try {
    const url = new URL(value as string);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
  } catch {
    errors[field] = 'Must be a valid HTTP or HTTPS URL';
  }
}

function validateAddress(address: unknown, errors: BusinessValidationErrors) {
  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    errors.address = 'Required';
    return;
  }

  const value = address as Address;
  requiredText(value.line1, 'address.line1', errors, 200);
  requiredText(value.country, 'address.country', errors, 2);
  if (value.line2 !== undefined) {
    requiredText(value.line2, 'address.line2', errors, 200);
  }
  if (value.city !== undefined) requiredText(value.city, 'address.city', errors, 100);
  if (value.region !== undefined) requiredText(value.region, 'address.region', errors, 100);
  if (value.postalCode !== undefined) {
    requiredText(value.postalCode, 'address.postalCode', errors, 30);
  }
}

function validateFields(
  input: CreateBusinessInput | UpdateBusinessInput,
  partial: boolean,
): BusinessValidationErrors {
  const errors: BusinessValidationErrors = {};
  const has = (field: keyof CreateBusinessInput) => !partial || field in input;

  if (has('name')) requiredText(input.name, 'name', errors, 200);
  if (input.legalName !== undefined) {
    requiredText(input.legalName, 'legalName', errors, 200);
  }
  if (has('email')) {
    requiredText(input.email, 'email', errors, 320);
    if (!errors.email && !EMAIL_PATTERN.test(input.email as string)) {
      errors.email = 'Must be a valid email address';
    }
  }
  if (has('phone')) requiredText(input.phone, 'phone', errors, 50);
  if (has('website')) validateUrl(input.website, 'website', errors);
  if (has('logo')) validateUrl(input.logo, 'logo', errors);
  if (has('address')) validateAddress(input.address, errors);
  if (has('timezone')) {
    requiredText(input.timezone, 'timezone', errors, 100);
    if (!errors.timezone) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: input.timezone }).format();
      } catch {
        errors.timezone = 'Must be a valid IANA timezone';
      }
    }
  }
  if (has('currency') && !CURRENCY_PATTERN.test(input.currency ?? '')) {
    errors.currency = 'Must be a three-letter uppercase ISO 4217 code';
  }
  if (has('active') && typeof input.active !== 'boolean') {
    errors.active = 'Must be a boolean';
  }

  return errors;
}

export function validateCreateBusiness(input: CreateBusinessInput): void {
  const errors = validateFields(input, false);
  if (Object.keys(errors).length) throw new BusinessValidationError(errors);
}

export function validateUpdateBusiness(input: UpdateBusinessInput): void {
  const errors = validateFields(input, true);
  if (Object.keys(input).length === 0) errors.business = 'At least one field is required';
  if (Object.keys(errors).length) throw new BusinessValidationError(errors);
}
