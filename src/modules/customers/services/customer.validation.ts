import type {
  CreateCustomerInput,
  CustomerValidationIssue,
  CustomerValidationResult,
  UpdateCustomerInput,
} from '../types';
import type { Address } from '../../../shared/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCustomer(
  input: CreateCustomerInput | UpdateCustomerInput,
  partial = false,
): CustomerValidationResult {
  const issues: CustomerValidationIssue[] = [];
  const has = (field: keyof CreateCustomerInput) => !partial || field in input;

  if (has('customerNumber') && input.customerNumber !== undefined) {
    optionalText(input.customerNumber, 'customerNumber', 100, issues);
  }
  if (has('firstName')) text(input.firstName, 'firstName', 200, issues, true);
  if (has('lastName')) text(input.lastName, 'lastName', 200, issues, true);
  if (has('companyName') && input.companyName !== undefined) {
    optionalText(input.companyName, 'companyName', 200, issues);
  }
  if (!partial && !hasIdentity(input)) {
    issues.push({ field: 'customer', message: 'A personal name or company name is required.' });
  }
  if (has('email')) {
    text(input.email, 'email', 320, issues);
    if (typeof input.email === 'string' && !EMAIL_PATTERN.test(input.email.trim())) {
      issues.push({ field: 'email', message: 'Must be a valid email address.' });
    }
  }
  if (has('phone')) text(input.phone, 'phone', 50, issues);
  if (has('address')) validateAddress(input.address, issues);
  if (has('notes')) text(input.notes, 'notes', 10000, issues, true);
  if (has('active') && typeof input.active !== 'boolean') {
    issues.push({ field: 'active', message: 'Must be a boolean.' });
  }
  if (partial && Object.keys(input).length === 0) {
    issues.push({ field: 'customer', message: 'At least one field is required.' });
  }

  return issues.length ? { valid: false, issues } : { valid: true };
}

function hasIdentity(input: CreateCustomerInput | UpdateCustomerInput): boolean {
  return [input.firstName, input.lastName, input.companyName].some(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );
}

function text(
  value: unknown,
  field: string,
  maxLength: number,
  issues: CustomerValidationIssue[],
  allowEmpty = false,
): void {
  if (typeof value !== 'string') {
    issues.push({ field, message: 'Must be text.' });
  } else if (!allowEmpty && value.trim().length === 0) {
    issues.push({ field, message: 'Required.' });
  } else if (value.trim().length > maxLength) {
    issues.push({ field, message: `Must be ${maxLength} characters or fewer.` });
  }
}

function optionalText(
  value: unknown,
  field: string,
  maxLength: number,
  issues: CustomerValidationIssue[],
): void {
  text(value, field, maxLength, issues);
  if (typeof value === 'string' && value.trim().length === 0) {
    issues.push({ field, message: 'Omit this field instead of using an empty value.' });
  }
}

function validateAddress(value: unknown, issues: CustomerValidationIssue[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    issues.push({ field: 'address', message: 'Required.' });
    return;
  }
  const address = value as Address;
  text(address.line1, 'address.line1', 200, issues);
  if (address.line2 !== undefined) optionalText(address.line2, 'address.line2', 200, issues);
  if (address.city !== undefined) optionalText(address.city, 'address.city', 100, issues);
  if (address.region !== undefined) optionalText(address.region, 'address.region', 100, issues);
  if (address.postalCode !== undefined) {
    optionalText(address.postalCode, 'address.postalCode', 30, issues);
  }
  text(address.country, 'address.country', 2, issues);
}
