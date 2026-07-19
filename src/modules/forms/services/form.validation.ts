import {
  FORM_FIELD_TYPES,
  type CreateFormInput,
  type Form,
  type FormField,
  type FormValidationIssue,
  type FormValidationResult,
  type FormValue,
  type FormValues,
  type UpdateFormInput,
} from '../types';

const optionFieldTypes = new Set<FormField['type']>(['radio', 'select', 'multiselect']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+]?[-().\s\d]{7,25}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function validateFormDefinition(
  input: CreateFormInput | UpdateFormInput,
  partial = false,
): FormValidationResult {
  const issues: FormValidationIssue[] = [];
  if (!partial || 'name' in input) requiredText(input.name, 'name', 200, issues);
  if (!partial || 'description' in input) requiredText(input.description, 'description', 2000, issues, true);
  if (!partial || 'version' in input) {
    const version = 'version' in input ? input.version : undefined;
    if (!Number.isInteger(version) || (version ?? 0) < 1) issues.push({ field: 'version', message: 'Version must be a positive integer.' });
  }
  if (!partial || 'published' in input) booleanValue(input.published, 'published', issues);
  if (!partial || 'archived' in input) booleanValue(input.archived, 'archived', issues);
  if (!partial || 'metadata' in input) objectValue(input.metadata, 'metadata', issues);
  if (!partial || 'fields' in input) validateFields(input.fields, issues);
  if (partial && Object.keys(input).length === 0) issues.push({ field: 'form', message: 'At least one field is required.' });
  return issues.length ? { valid: false, issues } : { valid: true };
}

export function validateFormValues(form: Form, values: FormValues): FormValidationResult {
  const issues: FormValidationIssue[] = [];
  for (const field of form.fields) {
    if (field.type === 'heading' || field.type === 'paragraph') continue;
    validateFieldValue(field, values[field.id], issues);
  }
  return issues.length ? { valid: false, issues } : { valid: true };
}

function validateFields(fields: FormField[] | undefined, issues: FormValidationIssue[]): void {
  if (!Array.isArray(fields)) {
    issues.push({ field: 'fields', message: 'Fields must be an array.' });
    return;
  }
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const [index, field] of fields.entries()) {
    const prefix = `fields.${index}`;
    requiredText(field.id, `${prefix}.id`, 100, issues);
    requiredText(field.label, `${prefix}.label`, 500, issues);
    if (ids.has(field.id)) issues.push({ field: `${prefix}.id`, message: 'Field IDs must be unique.' });
    ids.add(field.id);
    if (!FORM_FIELD_TYPES.includes(field.type)) issues.push({ field: `${prefix}.type`, message: 'Unsupported field type.' });
    booleanValue(field.required, `${prefix}.required`, issues);
    if (!Number.isInteger(field.order) || field.order < 0) issues.push({ field: `${prefix}.order`, message: 'Order must be a non-negative integer.' });
    if (orders.has(field.order)) issues.push({ field: `${prefix}.order`, message: 'Field order must be unique.' });
    orders.add(field.order);
    if (field.helpText !== undefined) requiredText(field.helpText, `${prefix}.helpText`, 1000, issues);
    if (field.placeholder !== undefined) requiredText(field.placeholder, `${prefix}.placeholder`, 500, issues);
    if (optionFieldTypes.has(field.type)) validateOptions(field, prefix, issues);
    if (field.validation) validateRules(field, prefix, issues);
    if (field.defaultValue !== undefined) validateFieldValue(field, field.defaultValue, issues, `${prefix}.defaultValue`);
  }
}

function validateOptions(field: FormField, prefix: string, issues: FormValidationIssue[]): void {
  if (!field.options?.length) {
    issues.push({ field: `${prefix}.options`, message: 'At least one option is required.' });
    return;
  }
  const values = new Set<string>();
  for (const option of field.options) {
    if (!option.label.trim() || !option.value.trim()) issues.push({ field: `${prefix}.options`, message: 'Option labels and values are required.' });
    if (values.has(option.value)) issues.push({ field: `${prefix}.options`, message: 'Option values must be unique.' });
    values.add(option.value);
  }
}

function validateRules(field: FormField, prefix: string, issues: FormValidationIssue[]): void {
  const rules = field.validation;
  if (!rules) return;
  for (const key of ['minLength', 'maxLength'] as const) {
    const value = rules[key];
    if (value !== undefined && (!Number.isInteger(value) || value < 0)) issues.push({ field: `${prefix}.validation.${key}`, message: 'Must be a non-negative integer.' });
  }
  if (rules.minLength !== undefined && rules.maxLength !== undefined && rules.minLength > rules.maxLength) issues.push({ field: `${prefix}.validation`, message: 'Minimum length cannot exceed maximum length.' });
  if (rules.minValue !== undefined && !Number.isFinite(rules.minValue)) issues.push({ field: `${prefix}.validation.minValue`, message: 'Must be a finite number.' });
  if (rules.maxValue !== undefined && !Number.isFinite(rules.maxValue)) issues.push({ field: `${prefix}.validation.maxValue`, message: 'Must be a finite number.' });
  if (rules.minValue !== undefined && rules.maxValue !== undefined && rules.minValue > rules.maxValue) issues.push({ field: `${prefix}.validation`, message: 'Minimum value cannot exceed maximum value.' });
  if (rules.pattern !== undefined) {
    try { new RegExp(rules.pattern); } catch { issues.push({ field: `${prefix}.validation.pattern`, message: 'Pattern must be a valid regular expression.' }); }
  }
}

function validateFieldValue(field: FormField, value: FormValue | undefined, issues: FormValidationIssue[], issueField = field.id): void {
  const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0) || (field.type === 'checkbox' && value !== true);
  if (field.required && empty) {
    issues.push({ field: issueField, message: `${field.label} is required.` });
    return;
  }
  if (empty) return;
  const rules = field.validation ?? {};
  if (field.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) issues.push({ field: issueField, message: `${field.label} must be a number.` });
    else {
      if (rules.minValue !== undefined && value < rules.minValue) issues.push({ field: issueField, message: `${field.label} must be at least ${rules.minValue}.` });
      if (rules.maxValue !== undefined && value > rules.maxValue) issues.push({ field: issueField, message: `${field.label} must be at most ${rules.maxValue}.` });
    }
    return;
  }
  if (field.type === 'multiselect') {
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string') ||
        value.some((item) => !field.options?.some((option) => option.value === item))) {
      issues.push({ field: issueField, message: `${field.label} must contain valid selected options.` });
    }
    return;
  }
  if (field.type === 'checkbox') {
    if (typeof value !== 'boolean') issues.push({ field: issueField, message: `${field.label} must be checked or unchecked.` });
    return;
  }
  if (typeof value !== 'string') {
    issues.push({ field: issueField, message: `${field.label} must be text.` });
    return;
  }
  if ((field.type === 'radio' || field.type === 'select') &&
      !field.options?.some((option) => option.value === value)) {
    issues.push({ field: issueField, message: `${field.label} must be a valid option.` });
  }
  if (rules.minLength !== undefined && value.length < rules.minLength) issues.push({ field: issueField, message: `${field.label} must contain at least ${rules.minLength} characters.` });
  if (rules.maxLength !== undefined && value.length > rules.maxLength) issues.push({ field: issueField, message: `${field.label} must contain at most ${rules.maxLength} characters.` });
  if (rules.pattern && !new RegExp(rules.pattern).test(value)) issues.push({ field: issueField, message: `${field.label} has an invalid format.` });
  if ((field.type === 'email' || rules.email) && !emailPattern.test(value)) issues.push({ field: issueField, message: `${field.label} must be a valid email address.` });
  if ((field.type === 'phone' || rules.phone) && !phonePattern.test(value)) issues.push({ field: issueField, message: `${field.label} must be a valid phone number.` });
  if ((field.type === 'date' || rules.date) && !validDate(value)) issues.push({ field: issueField, message: `${field.label} must be a valid date.` });
}

function requiredText(value: unknown, field: string, max: number, issues: FormValidationIssue[], allowEmpty = false): void {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) issues.push({ field, message: 'Required.' });
  else if (value.length > max) issues.push({ field, message: `Must be ${max} characters or fewer.` });
}

function booleanValue(value: unknown, field: string, issues: FormValidationIssue[]): void {
  if (typeof value !== 'boolean') issues.push({ field, message: 'Must be a boolean.' });
}

function objectValue(value: unknown, field: string, issues: FormValidationIssue[]): void {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) issues.push({ field, message: 'Must be an object.' });
}

function validDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
