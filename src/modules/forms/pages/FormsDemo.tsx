import { useState } from 'react';

import { FormRenderer } from '../components';
import { useForm, useFormSubmissions, useSubmitForm } from '../hooks';
import { FormService, InMemoryFormRepository } from '../services';
import type { Form, FormValues } from '../types';

const BUSINESS_ID = 'forms-demo-business';
const FORM_ID = 'spa-intake-form';
const spaIntakeForm: Form = {
  id: FORM_ID,
  businessId: BUSINESS_ID,
  name: 'Spa Intake Form',
  description: 'Health, emergency contact, allergy, and consent information.',
  version: 1,
  published: true,
  archived: false,
  metadata: { demo: true },
  fields: [
    { id: 'intro', type: 'heading', label: 'Guest information', required: false, order: 0 },
    { id: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Full name', validation: { minLength: 2, maxLength: 120 }, order: 1 },
    { id: 'phone', type: 'phone', label: 'Phone', required: true, placeholder: '+1 555 0100', validation: { phone: true }, order: 2 },
    { id: 'email', type: 'email', label: 'Email', required: true, placeholder: 'name@example.com', validation: { email: true }, order: 3 },
    { id: 'emergencyContact', type: 'text', label: 'Emergency Contact', required: true, helpText: 'Include their name and phone number.', validation: { minLength: 5, maxLength: 200 }, order: 4 },
    { id: 'healthHeading', type: 'heading', label: 'Health information', required: false, order: 5 },
    { id: 'medicalConditions', type: 'textarea', label: 'Medical Conditions', required: false, placeholder: 'List relevant conditions or enter None', validation: { maxLength: 1000 }, order: 6 },
    { id: 'pregnancy', type: 'radio', label: 'Pregnancy', required: true, options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }, { label: 'Prefer not to say', value: 'undisclosed' }], order: 7 },
    { id: 'allergies', type: 'textarea', label: 'Allergies', required: false, placeholder: 'List allergies or enter None', validation: { maxLength: 1000 }, order: 8 },
    { id: 'consent', type: 'checkbox', label: 'I confirm this information is accurate and consent to the selected service.', required: true, order: 9 },
    { id: 'signature', type: 'signature', label: 'Signature', required: true, helpText: 'For this demo, type your full legal name.', validation: { minLength: 2, maxLength: 120 }, order: 10 },
  ],
};

const formService = new FormService(new InMemoryFormRepository([spaIntakeForm]));

export default function FormsDemo() {
  const form = useForm(formService, BUSINESS_ID, FORM_ID);
  const submissions = useFormSubmissions(formService, BUSINESS_ID, FORM_ID);
  const submit = useSubmitForm(formService, BUSINESS_ID);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (values: FormValues) => {
    setSuccess('');
    await submit.mutate({ formId: FORM_ID, values, metadata: { source: 'forms-demo' } });
    await submissions.refetch();
    setSuccess('Spa Intake Form submitted and stored in memory.');
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">Customer forms</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-jds-950">Dynamic Spa Intake Form</h1>
          <p className="mt-3 text-slate-600">Complete the information below before the appointment.</p>
        </header>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {success && <p role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{success}</p>}
            {submit.error && <p role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{submit.error.message}</p>}
            {form.loading && <p role="status" className="text-sm text-slate-500">Loading form…</p>}
            {form.error && <p role="alert" className="text-sm text-rose-700">{form.error.message}</p>}
            {form.data && <><div className="mb-6"><h2 className="text-2xl font-semibold text-jds-950">{form.data.name}</h2><p className="mt-2 text-sm text-slate-600">{form.data.description}</p><p className="mt-1 text-xs text-slate-400">Version {form.data.version}</p></div><FormRenderer form={form.data} onSubmit={handleSubmit} submitting={submit.loading} /></>}
          </section>
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-jds-950">In-memory submissions</h2>
            <p className="mt-1 text-sm text-slate-500">{submissions.data.length} received this session</p>
            <div className="mt-4 space-y-3">{submissions.data.map((submission) => <article key={submission.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-medium">{String(submission.values.name || 'Anonymous')}</p><p className="mt-1 text-xs text-slate-500">{new Date(submission.submittedAt).toLocaleString()}</p><p className="mt-2 text-xs text-slate-500">{Object.keys(submission.values).length} values captured</p></article>)}</div>
            {!submissions.loading && submissions.data.length === 0 && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Completed forms will appear here.</p>}
          </aside>
        </div>
      </div>
    </main>
  );
}
