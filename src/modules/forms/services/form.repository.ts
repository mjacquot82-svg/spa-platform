import type {
  CreateFormInput,
  CreateFormSubmissionInput,
  Form,
  FormFilters,
  FormSubmission,
  UpdateFormInput,
} from '../types';

export interface FormRepository {
  createForm(businessId: string, input: CreateFormInput): Promise<Form>;
  updateForm(businessId: string, id: string, input: UpdateFormInput & { version?: number }): Promise<Form>;
  listForms(businessId: string, filters?: FormFilters): Promise<Form[]>;
  getForm(businessId: string, id: string): Promise<Form | null>;
  createSubmission(businessId: string, input: CreateFormSubmissionInput): Promise<FormSubmission>;
  listSubmissions(businessId: string, formId?: string): Promise<FormSubmission[]>;
}

/** Volatile, business-scoped Forms storage for demos and tests. */
export class InMemoryFormRepository implements FormRepository {
  private readonly forms = new Map<string, Form>();
  private readonly submissions = new Map<string, FormSubmission>();

  constructor(forms: Form[] = [], submissions: FormSubmission[] = []) {
    for (const form of forms) this.forms.set(this.key(form.businessId, form.id), cloneForm(form));
    for (const submission of submissions) this.submissions.set(this.key(submission.businessId, submission.id), cloneSubmission(submission));
  }

  async createForm(businessId: string, input: CreateFormInput): Promise<Form> {
    const form = { ...cloneFormInput(input), id: crypto.randomUUID(), businessId };
    this.forms.set(this.key(businessId, form.id), form);
    return cloneForm(form);
  }

  async updateForm(businessId: string, id: string, input: UpdateFormInput & { version?: number }): Promise<Form> {
    const key = this.key(businessId, id);
    const existing = this.forms.get(key);
    if (!existing) throw new Error('Form not found.');
    const updated = { ...existing, ...cloneFormInput(input) };
    this.forms.set(key, updated);
    return cloneForm(updated);
  }

  async listForms(businessId: string, filters: FormFilters = {}): Promise<Form[]> {
    return [...this.forms.values()]
      .filter((form) => form.businessId === businessId)
      .filter((form) => filters.published === undefined || form.published === filters.published)
      .filter((form) => filters.archived === undefined || form.archived === filters.archived)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(cloneForm);
  }

  async getForm(businessId: string, id: string): Promise<Form | null> {
    const form = this.forms.get(this.key(businessId, id));
    return form ? cloneForm(form) : null;
  }

  async createSubmission(businessId: string, input: CreateFormSubmissionInput): Promise<FormSubmission> {
    const submission: FormSubmission = {
      ...cloneSubmissionInput(input), id: crypto.randomUUID(), businessId, submittedAt: new Date().toISOString(),
    };
    this.submissions.set(this.key(businessId, submission.id), submission);
    return cloneSubmission(submission);
  }

  async listSubmissions(businessId: string, formId?: string): Promise<FormSubmission[]> {
    return [...this.submissions.values()]
      .filter((submission) => submission.businessId === businessId)
      .filter((submission) => formId === undefined || submission.formId === formId)
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
      .map(cloneSubmission);
  }

  private key(businessId: string, id: string): string { return `${businessId}:${id}`; }
}

function cloneForm(form: Form): Form { return { ...form, metadata: { ...form.metadata }, fields: form.fields.map(cloneField) }; }
function cloneFormInput<T extends Partial<CreateFormInput>>(input: T): T { return { ...input, ...(input.metadata ? { metadata: { ...input.metadata } } : {}), ...(input.fields ? { fields: input.fields.map(cloneField) } : {}) }; }
function cloneField<T extends Form['fields'][number]>(field: T): T { return { ...field, ...(field.options ? { options: field.options.map((option) => ({ ...option })) } : {}), ...(field.validation ? { validation: { ...field.validation } } : {}), ...(Array.isArray(field.defaultValue) ? { defaultValue: [...field.defaultValue] } : {}) }; }
function cloneSubmission(submission: FormSubmission): FormSubmission { return { ...submission, values: cloneValues(submission.values), metadata: { ...submission.metadata } }; }
function cloneSubmissionInput(input: CreateFormSubmissionInput): CreateFormSubmissionInput { return { ...input, values: cloneValues(input.values), metadata: { ...input.metadata } }; }
function cloneValues(values: FormSubmission['values']): FormSubmission['values'] { return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value])); }
