import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useApplicationServices } from '../../../app/useApplicationServices';
import type { Form } from '../../forms';
import type { Appointment } from '../../scheduling';
import { useAppointmentFormAssignments, useAssignAppointmentForm } from '../hooks';
import type { AppointmentFormAssignment } from '../types';

export function AppointmentFormsWorkflow() {
  const { businessId, appointments: appointmentService, forms: formService, appointmentForms: assignmentService } = useApplicationServices();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  useEffect(() => { void Promise.all([appointmentService.listAppointments(businessId, { active: true }), formService.listForms(businessId, { published: true, archived: false })]).then(([nextAppointments, nextForms]) => { setAppointments(nextAppointments); setForms(nextForms); }); }, [appointmentService, businessId, formService]);
  const selectedAppointment = appointments.find((item) => item.id === searchParams.get('appointment')) ?? appointments[0];
  const assignments = useAppointmentFormAssignments(assignmentService, businessId, selectedAppointment?.id ?? null);
  const assign = useAssignAppointmentForm(assignmentService, businessId);
  const [formId, setFormId] = useState('aftercare');
  const [message, setMessage] = useState('');
  const available = forms.filter((item) => !assignments.data.some((assignment) => assignment.formId === item.id));
  const assignSelected = async () => {
    if (!formId || !selectedAppointment) return;
    await assign.mutate({ appointmentId: selectedAppointment.id, formId });
    await assignments.refetch();
    setFormId('');
    setMessage('Form assigned as pending.');
  };

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6"><div className="mx-auto max-w-5xl">
    <header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">Appointment forms</p><h1 className="mt-2 text-3xl font-semibold">Customer forms</h1><p className="mt-2 text-slate-600">Review and complete the forms assigned to this appointment.</p></header>
    {message && <p role="status" className="mt-6 rounded-lg bg-emerald-50 p-3 text-emerald-800">{message}</p>}
    {selectedAppointment ? <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">{String(selectedAppointment.metadata.title)}</h2><p className="mt-1 text-sm text-slate-500">{new Date(selectedAppointment.start).toLocaleString()} · {selectedAppointment.status.replace('_', ' ')}</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><select value={formId} onChange={(event) => setFormId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2"><option value="">Select published form</option>{available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" disabled={!formId || assign.loading} onClick={() => void assignSelected()} className="rounded-lg bg-jds-700 px-4 py-2 font-semibold text-white disabled:opacity-40">Assign form</button></div></section> : <p className="mt-6 rounded-xl bg-white p-6 text-slate-500">No appointment selected.</p>}
    <section className="mt-6 grid gap-5 md:grid-cols-2"><StatusColumn title="Pending Forms" assignments={assignments.data.filter((item) => item.status === 'pending')} forms={forms} /><StatusColumn title="Completed Forms" assignments={assignments.data.filter((item) => item.status === 'completed')} forms={forms} /></section>
  </div></main>;
}


function StatusColumn({ title, assignments, forms }: { title: string; assignments: AppointmentFormAssignment[]; forms: Form[] }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-4 space-y-2">{assignments.map((assignment) => <div key={assignment.id} className="rounded-xl bg-slate-50 p-3"><p className="font-medium">{forms.find((item) => item.id === assignment.formId)?.name}</p><p className="mt-1 text-xs text-slate-500">Assigned {new Date(assignment.assignedAt).toLocaleDateString()}</p></div>)}{assignments.length === 0 && <p className="text-sm text-slate-500">None.</p>}</div></article>;
}
