export interface AvailabilityExceptionValidationIssue {
  field: string;
  message: string;
}

export type AvailabilityExceptionValidationResult =
  | { valid: true }
  | { valid: false; issues: AvailabilityExceptionValidationIssue[] };

export class AvailabilityExceptionValidationError extends Error {
  constructor(public readonly issues: AvailabilityExceptionValidationIssue[]) {
    super('Availability exception validation failed.');
    this.name = 'AvailabilityExceptionValidationError';
  }
}
