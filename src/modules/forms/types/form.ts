export const FORM_FIELD_TYPES = [
  'text', 'textarea', 'number', 'email', 'phone', 'date', 'checkbox', 'radio',
  'select', 'multiselect', 'signature', 'file', 'heading', 'paragraph',
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];
export type FormValue = string | number | boolean | string[] | null;
export type FormValues = Record<string, FormValue>;

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  email?: boolean;
  phone?: boolean;
  date?: boolean;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  defaultValue?: FormValue;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  order: number;
}

export interface Form {
  id: string;
  businessId: string;
  name: string;
  description: string;
  version: number;
  published: boolean;
  archived: boolean;
  metadata: Record<string, unknown>;
  fields: FormField[];
}

export type CreateFormInput = Omit<Form, 'id' | 'businessId'>;
export type UpdateFormInput = Partial<Omit<CreateFormInput, 'version'>>;

export interface FormFilters {
  published?: boolean;
  archived?: boolean;
}

export interface FormSubmission {
  id: string;
  formId: string;
  businessId: string;
  submittedAt: string;
  submittedBy?: string;
  values: FormValues;
  metadata: Record<string, unknown>;
}

export interface CreateFormSubmissionInput {
  formId: string;
  submittedBy?: string;
  values: FormValues;
  metadata: Record<string, unknown>;
}
