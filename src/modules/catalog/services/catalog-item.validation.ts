import type { CatalogItemValidationInput, ValidationIssue, ValidationResult } from '../types';

const has = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);

export function validateCatalogItem(input: CatalogItemValidationInput, partial = false): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!partial && !has(input, 'name')) issues.push({ field: 'name', message: 'Name is required.' });
  if (has(input, 'name') && (!input.name || input.name.trim().length > 200)) {
    issues.push({ field: 'name', message: 'Name is required and must not exceed 200 characters.' });
  }
  return issues.length === 0 ? { valid: true } : { valid: false, issues };
}
