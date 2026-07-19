import { describe, expect, it } from 'vitest';

import type { CreateFormInput, Form } from '../types';
import { FormDefinitionValidationError, FormSubmissionValidationError } from '../types';
import { InMemoryFormRepository } from './form.repository';
import { FormService } from './form.service';
import { validateFormValues } from './form.validation';

const definition: CreateFormInput = {
  name: 'Health Form', description: 'Example', version: 1, published: true, archived: false, metadata: {},
  fields: [
    { id: 'name', type: 'text', label: 'Name', required: true, validation: { minLength: 2 }, order: 0 },
    { id: 'email', type: 'email', label: 'Email', required: true, order: 1 },
    { id: 'phone', type: 'phone', label: 'Phone', required: true, order: 2 },
    { id: 'visitDate', type: 'date', label: 'Visit date', required: true, order: 3 },
    { id: 'age', type: 'number', label: 'Age', required: false, validation: { minValue: 18, maxValue: 120 }, order: 4 },
    { id: 'consent', type: 'checkbox', label: 'Consent', required: true, order: 5 },
  ],
};

describe('Forms Engine', () => {
  it('creates, versions, and business-scopes form definitions', async () => {
    const service = new FormService(new InMemoryFormRepository());
    const created = await service.createForm('business-1', definition);
    const updated = await service.updateForm('business-1', created.id, { name: 'Updated Health Form' });
    expect(updated.version).toBe(2);
    expect(await service.listForms('business-2')).toEqual([]);
  });

  it('rejects duplicate field IDs and invalid option fields', () => {
    const service = new FormService(new InMemoryFormRepository());
    expect(() => service.createForm('business-1', {
      ...definition,
      fields: [
        { id: 'choice', type: 'select', label: 'Choice', required: true, order: 0, options: [] },
        { id: 'choice', type: 'text', label: 'Duplicate', required: false, order: 1 },
      ],
    })).toThrow(FormDefinitionValidationError);
  });

  it('validates required, length, numeric, email, phone, and date rules', () => {
    const form: Form = { ...definition, id: 'form-1', businessId: 'business-1' };
    const result = validateFormValues(form, {
      name: 'A', email: 'invalid', phone: '12', visitDate: '2026-02-30', age: 17, consent: false,
    });
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(new Set(result.issues.map((issue) => issue.field))).toEqual(new Set(['name', 'email', 'phone', 'visitDate', 'age', 'consent']));
  });

  it('stores valid published-form submissions in memory', async () => {
    const repository = new InMemoryFormRepository();
    const service = new FormService(repository);
    const form = await service.createForm('business-1', definition);
    await service.submitForm('business-1', {
      formId: form.id,
      values: { name: 'Ava', email: 'ava@example.com', phone: '+1 555 0100', visitDate: '2026-07-20', age: 34, consent: true },
      metadata: {},
    });
    expect(await service.listSubmissions('business-1', form.id)).toHaveLength(1);
  });

  it('rejects invalid submissions through the service', async () => {
    const service = new FormService(new InMemoryFormRepository());
    const form = await service.createForm('business-1', definition);
    await expect(service.submitForm('business-1', { formId: form.id, values: {}, metadata: {} }))
      .rejects.toBeInstanceOf(FormSubmissionValidationError);
  });
});
