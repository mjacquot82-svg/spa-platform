import type { CreateFormInput, CreateFormSubmissionInput, Form, FormFilters, FormSubmission, UpdateFormInput } from '../types';
import { FormDefinitionValidationError, FormSubmissionValidationError } from '../types';
import type { FormRepository } from './form.repository';
import { validateFormDefinition, validateFormValues } from './form.validation';

export class FormService {
  constructor(private readonly repository: FormRepository) {}

  createForm(businessId: string, input: CreateFormInput): Promise<Form> {
    assertDefinition(input, false);
    return this.repository.createForm(requireId(businessId, 'businessId'), normalizeForm(input));
  }

  async updateForm(businessId: string, id: string, input: UpdateFormInput): Promise<Form> {
    assertDefinition(input, true);
    const scopedBusinessId = requireId(businessId, 'businessId');
    const scopedId = requireId(id, 'id');
    const existing = await this.repository.getForm(scopedBusinessId, scopedId);
    if (!existing) throw new Error('Form not found.');
    const normalized = normalizeForm(input);
    const merged = { ...existing, ...normalized, version: existing.version + 1 };
    assertDefinition(merged, false);
    return this.repository.updateForm(scopedBusinessId, scopedId, { ...normalized, version: merged.version });
  }

  publishForm(businessId: string, id: string): Promise<Form> { return this.updateForm(businessId, id, { published: true }); }
  archiveForm(businessId: string, id: string): Promise<Form> { return this.updateForm(businessId, id, { archived: true }); }
  restoreForm(businessId: string, id: string): Promise<Form> { return this.updateForm(businessId, id, { archived: false }); }
  listForms(businessId: string, filters?: FormFilters): Promise<Form[]> { return this.repository.listForms(requireId(businessId, 'businessId'), filters); }
  getForm(businessId: string, id: string): Promise<Form | null> { return this.repository.getForm(requireId(businessId, 'businessId'), requireId(id, 'id')); }

  async submitForm(businessId: string, input: CreateFormSubmissionInput): Promise<FormSubmission> {
    const scopedBusinessId = requireId(businessId, 'businessId');
    const form = await this.repository.getForm(scopedBusinessId, requireId(input.formId, 'formId'));
    if (!form) throw new Error('Form not found.');
    if (!form.published || form.archived) throw new Error('Form is not available for submission.');
    const result = validateFormValues(form, input.values);
    if (!result.valid) throw new FormSubmissionValidationError(result.issues);
    return this.repository.createSubmission(scopedBusinessId, normalizeSubmission(input));
  }

  listSubmissions(businessId: string, formId?: string): Promise<FormSubmission[]> {
    return this.repository.listSubmissions(requireId(businessId, 'businessId'), formId ? requireId(formId, 'formId') : undefined);
  }
}

function assertDefinition(input: CreateFormInput | UpdateFormInput, partial: boolean): void {
  const result = validateFormDefinition(input, partial);
  if (!result.valid) throw new FormDefinitionValidationError(result.issues);
}
function requireId(value: string, field: string): string { if (!value.trim()) throw new TypeError(`${field} is required.`); return value.trim(); }
function normalizeForm<T extends CreateFormInput | UpdateFormInput>(input: T): T { return { ...input, ...('name' in input && input.name !== undefined ? { name: input.name.trim() } : {}), ...('description' in input && input.description !== undefined ? { description: input.description.trim() } : {}), ...(input.metadata ? { metadata: { ...input.metadata } } : {}), ...(input.fields ? { fields: [...input.fields].sort((left, right) => left.order - right.order) } : {}) } as T; }
function normalizeSubmission(input: CreateFormSubmissionInput): CreateFormSubmissionInput { return { ...input, formId: input.formId.trim(), ...(input.submittedBy ? { submittedBy: input.submittedBy.trim() } : {}), metadata: { ...input.metadata } }; }
