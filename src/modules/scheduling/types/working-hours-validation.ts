export interface WorkingHoursValidationIssue {
  field: string;
  message: string;
}

export type WorkingHoursValidationResult =
  | { valid: true }
  | { valid: false; issues: WorkingHoursValidationIssue[] };

export class WorkingHoursValidationError extends Error {
  constructor(public readonly issues: WorkingHoursValidationIssue[]) {
    super('Working hours validation failed.');
    this.name = 'WorkingHoursValidationError';
  }
}
