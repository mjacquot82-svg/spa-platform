export interface FormValidationIssue {
  field: string;
  message: string;
}

export type FormValidationResult =
  | { valid: true }
  | { valid: false; issues: FormValidationIssue[] };

export class FormDefinitionValidationError extends Error {
  constructor(public readonly issues: FormValidationIssue[]) {
    super('Form definition validation failed.');
    this.name = 'FormDefinitionValidationError';
  }
}

export class FormSubmissionValidationError extends Error {
  constructor(public readonly issues: FormValidationIssue[]) {
    super('Form submission validation failed.');
    this.name = 'FormSubmissionValidationError';
  }
}
