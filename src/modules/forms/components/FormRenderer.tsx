import { useEffect, useState, type FormEvent } from 'react';

import { validateFormValues } from '../services';
import type { Form, FormField, FormValidationIssue, FormValue, FormValues } from '../types';

export interface FormRendererProps {
  form: Form;
  onSubmit: (values: FormValues) => Promise<void> | void;
  submitLabel?: string;
  submitting?: boolean;
}

export function FormRenderer({ form, onSubmit, submitLabel = 'Submit form', submitting = false }: FormRendererProps) {
  const [values, setValues] = useState<FormValues>(() => initialValues(form));
  const [issues, setIssues] = useState<FormValidationIssue[]>([]);

  useEffect(() => { setValues(initialValues(form)); setIssues([]); }, [form]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateFormValues(form, values);
    if (!result.valid) { setIssues(result.issues); return; }
    setIssues([]);
    await onSubmit(values);
  };

  const update = (fieldId: string, value: FormValue) => {
    setValues((current) => ({ ...current, [fieldId]: value }));
    setIssues((current) => current.filter((issue) => issue.field !== fieldId));
  };

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
      {[...form.fields].sort((left, right) => left.order - right.order).map((field) => (
        <RenderedField key={field.id} field={field} value={values[field.id]} issues={issues.filter((issue) => issue.field === field.id)} onChange={(value) => update(field.id, value)} />
      ))}
      <button type="submit" disabled={submitting} className="rounded-lg bg-jds-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Submitting…' : submitLabel}</button>
    </form>
  );
}

function RenderedField({ field, value, issues, onChange }: { field: FormField; value: FormValue | undefined; issues: FormValidationIssue[]; onChange: (value: FormValue) => void }) {
  if (field.type === 'heading') return <h2 className="border-b border-slate-200 pb-2 pt-3 text-xl font-semibold text-jds-950">{field.label}</h2>;
  if (field.type === 'paragraph') return <p className="text-sm leading-6 text-slate-600">{field.label}</p>;
  const describedBy = [field.helpText ? `${field.id}-help` : '', issues.length ? `${field.id}-error` : ''].filter(Boolean).join(' ') || undefined;
  const common = { id: field.id, name: field.id, required: field.required, 'aria-invalid': issues.length > 0, 'aria-describedby': describedBy, className: 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-jds-700 focus:ring-2 focus:ring-jds-100' };

  return <div>
    {field.type !== 'checkbox' && <label htmlFor={field.id} className="block text-sm font-medium text-slate-800">{field.label}{field.required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}</label>}
    {field.type === 'textarea' && <textarea {...common} rows={4} placeholder={field.placeholder} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} />}
    {['text', 'email', 'phone', 'date'].includes(field.type) && <input {...common} type={field.type === 'phone' ? 'tel' : field.type} placeholder={field.placeholder} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} />}
    {field.type === 'number' && <input {...common} type="number" placeholder={field.placeholder} value={typeof value === 'number' ? value : ''} onChange={(event) => onChange(event.target.value === '' ? null : event.target.valueAsNumber)} />}
    {field.type === 'checkbox' && <label className="flex items-start gap-3 text-sm text-slate-800"><input id={field.id} name={field.id} type="checkbox" required={field.required} checked={value === true} onChange={(event) => onChange(event.target.checked)} aria-invalid={issues.length > 0} aria-describedby={describedBy} className="mt-0.5 size-4 rounded border-slate-300 text-jds-700" /><span>{field.label}{field.required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}</span></label>}
    {field.type === 'radio' && <fieldset><legend className="text-sm font-medium text-slate-800">{field.label}{field.required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}</legend><div className="mt-2 flex flex-wrap gap-4">{field.options?.map((option) => <label key={option.value} className="flex items-center gap-2 text-sm"><input type="radio" name={field.id} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />{option.label}</label>)}</div></fieldset>}
    {field.type === 'select' && <select {...common} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)}><option value="">Select an option</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
    {field.type === 'multiselect' && <select {...common} multiple value={Array.isArray(value) ? value : []} onChange={(event) => onChange([...event.target.selectedOptions].map((option) => option.value))}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
    {field.type === 'signature' && <input {...common} type="text" placeholder={field.placeholder ?? 'Type full legal name'} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} />}
    {field.type === 'file' && <input {...common} type="file" value={undefined} onChange={(event) => onChange(event.target.files?.[0]?.name ?? null)} />}
    {field.helpText && <p id={`${field.id}-help`} className="mt-1 text-xs text-slate-500">{field.helpText}</p>}
    {issues.length > 0 && <ul id={`${field.id}-error`} className="mt-1 text-sm text-rose-700" role="alert">{issues.map((issue, index) => <li key={`${issue.message}-${index}`}>{issue.message}</li>)}</ul>}
  </div>;
}

function initialValues(form: Form): FormValues {
  return Object.fromEntries(form.fields.filter((field) => field.type !== 'heading' && field.type !== 'paragraph').map((field) => [field.id, field.defaultValue ?? (field.type === 'checkbox' ? false : field.type === 'multiselect' ? [] : '')]));
}
