import type { CreateCatalogItemInput, UpdateCatalogItemInput } from './catalog-item';

export type CatalogItemValidationInput = CreateCatalogItemInput | UpdateCatalogItemInput;

export interface ValidationIssue {
  field: string;
  message: string;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; issues: ValidationIssue[] };

export class CatalogValidationError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super('Catalog item validation failed.');
    this.name = 'CatalogValidationError';
  }
}
