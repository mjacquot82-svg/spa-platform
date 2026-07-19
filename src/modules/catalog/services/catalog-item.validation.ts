import { CATALOG_RESOURCE_TYPES, type CatalogItemValidationInput, type ValidationIssue, type ValidationResult } from '../types';

const has = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);

export function validateCatalogItem(input: CatalogItemValidationInput, partial = false): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!partial && !has(input, 'name')) issues.push({ field: 'name', message: 'Name is required.' });
  if (has(input, 'name') && (!input.name || input.name.trim().length > 200)) {
    issues.push({ field: 'name', message: 'Name is required and must not exceed 200 characters.' });
  }
  if (input.type === 'Service') {
    const schedulingFieldsPresent = input.durationMinutes !== undefined ||
      (input.bufferBeforeMinutes ?? 0) > 0 || (input.bufferAfterMinutes ?? 0) > 0 ||
      (input.resourceTypesRequired?.length ?? 0) > 0;
    if (!partial && schedulingFieldsPresent && input.durationMinutes === undefined) {
      issues.push({ field: 'durationMinutes', message: 'Duration is required for schedulable services.' });
    }
    if (has(input, 'durationMinutes') && (!Number.isInteger(input.durationMinutes) || (input.durationMinutes ?? 0) <= 0)) {
      issues.push({ field: 'durationMinutes', message: 'Duration must be an integer greater than zero.' });
    }
    for (const field of ['bufferBeforeMinutes', 'bufferAfterMinutes'] as const) {
      const value = input[field];
      if (has(input, field) && (!Number.isInteger(value) || (value ?? -1) < 0)) {
        issues.push({ field, message: `${field === 'bufferBeforeMinutes' ? 'Buffer before' : 'Buffer after'} must be a non-negative integer.` });
      }
    }
    if (has(input, 'resourceTypesRequired')) {
      const resourceTypes = input.resourceTypesRequired;
      if (!Array.isArray(resourceTypes) || resourceTypes.length === 0 ||
          new Set(resourceTypes).size !== resourceTypes.length ||
          resourceTypes.some((type) => !CATALOG_RESOURCE_TYPES.includes(type))) {
        issues.push({ field: 'resourceTypesRequired', message: 'At least one valid resource type is required.' });
      }
    }
  }
  return issues.length === 0 ? { valid: true } : { valid: false, issues };
}
