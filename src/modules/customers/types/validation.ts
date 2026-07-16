export interface CustomerValidationIssue {
  field: string;
  message: string;
}

export type CustomerValidationResult =
  | { valid: true }
  | { valid: false; issues: CustomerValidationIssue[] };

export class CustomerValidationError extends Error {
  constructor(public readonly issues: CustomerValidationIssue[]) {
    super('Customer validation failed.');
    this.name = 'CustomerValidationError';
  }
}
