export interface SchedulingResourceValidationIssue {
  field: string;
  message: string;
}

export type SchedulingResourceValidationResult =
  | { valid: true }
  | { valid: false; issues: SchedulingResourceValidationIssue[] };

export class SchedulingResourceValidationError extends Error {
  constructor(public readonly issues: SchedulingResourceValidationIssue[]) {
    super('Scheduling resource validation failed.');
    this.name = 'SchedulingResourceValidationError';
  }
}
