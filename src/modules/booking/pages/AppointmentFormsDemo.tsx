import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FormService, InMemoryFormRepository, type Form } from '../../forms';
import { AppointmentService, InMemoryAppointmentRepository, type Appointment } from '../../scheduling';
import { useAppointmentFormAssignments, useAssignAppointmentForm } from '../hooks';
import { AppointmentFormAssignmentService, InMemoryAppointmentFormAssignmentRepository } from '../services';
import type { AppointmentFormAssignment } from '../types';

const businessId = 'assignment-demo-business';
const appointments: Appointment[] = [
  appointment('appointment-ava', 'customer-ava', '2026-07-20T09:00:00Z', '2026-07-20T10:00:00Z', 'Signature Massage · Ava Morgan'),
  appointment('appointment-noah', 'customer-noah', '2026-07-20T11:00:00Z', '2026-07-20T11:45:00Z', 'Restorative Facial · Noah Williams'),
  appointment('appointment-mia', 'customer-mia', '2026-07-20T14:00:00Z', '2026-07-20T15:30:00Z', 'Wellness Ritual · Mia Thompson'),
];
const forms: Form[] = [
  form('intake', 'Spa Intake Form'), form('consent', 'Treatment Consent'), form('aftercare', 'Aftercare Acknowledgement'),
];
const assignmentSeed: AppointmentFormAssignment[] = [
  { id: 'pending-1', businessId, appointmentId: 'appointment-ava', formId: 'intake', status: 'pending', assignedAt: '2026-07-18T09:00:00Z', completedAt: null },
  { id: 'completed-1', businessId, appointmentId: 'appointment-ava', formId: 'consent', status: 'completed', assignedAt: '2026-07-18T09:00:00Z', completedAt: '2026-07-19T14:00:00Z' },
  { id: 'pending-2', businessId, appointmentId: 'appointment-noah', formId: 'consent', status: 'pending', assignedAt: '2026-07-18T10:00:00Z', completedAt: null },
];
const appointmentService = new AppointmentService(new InMemoryAppointmentRepository(appointments));
const formService = new FormService(new InMemoryFormRepository(forms));
const assignmentService = new AppointmentFormAssignmentService(new InMemoryAppointmentFormAssignmentRepository(assignmentSeed), appointmentService, formService);

export default function AppointmentFormsDemo() {
  const [searchParams] = useSearchParams();
  const selectedAppointment = appointments.find((item) => item.id === searchParams.get('appointment')) ?? appointments[0];
  const assignments = useAppointmentFormAssignments(assignmentService, businessId, selectedAppointment.id);
  const assign = useAssignAppointmentForm(assignmentService, businessId);
  const [formId, setFormId] = useState('aftercare');
  const [message, setMessage] = useState('');
  const available = forms.filter((item) => !assignments.data.some((assignment) => assignment.formId === item.id));
  const assignSelected = async () => {
    if (!formId) return;
    await assign.mutate({ appointmentId: selectedAppointment.id, formId });
    await assignments.refetch();
    setFormId('');
    setMessage('Form assigned as pending.');
  };

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6"><div className="mx-auto max-w-5xl">
    <header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">Appointment forms</p><h1 className="mt-2 text-3xl font-semibold">Customer forms</h1><p className="mt-2 text-slate-600">Review and complete the forms assigned to this appointment.</p></header>
    {message && <p role="status" className="mt-6 rounded-lg bg-emerald-50 p-3 text-emerald-800">{message}</p>}
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">{String(selectedAppointment.metadata.title)}</h2><p className="mt-1 text-sm text-slate-500">{new Date(selectedAppointment.start).toLocaleString()} · {selectedAppointment.status.replace('_', ' ')}</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><select value={formId} onChange={(event) => setFormId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2"><option value="">Select published form</option>{available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" disabled={!formId || assign.loading} onClick={() => void assignSelected()} className="rounded-lg bg-jds-700 px-4 py-2 font-semibold text-white disabled:opacity-40">Assign form</button></div></section>
    <section className="mt-6 grid gap-5 md:grid-cols-2"><StatusColumn title="Pending Forms" assignments={assignments.data.filter((item) => item.status === 'pending')} /><StatusColumn title="Completed Forms" assignments={assignments.data.filter((item) => item.status === 'completed')} /></section>
  </div></main>;
}

function StatusColumn({ title, assignments }: { title: string; assignments: AppointmentFormAssignment[] }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><div className="mt-4 space-y-2">{assignments.map((assignment) => <div key={assignment.id} className="rounded-xl bg-slate-50 p-3"><p className="font-medium">{forms.find((item) => item.id === assignment.formId)?.name}</p><p className="mt-1 text-xs text-slate-500">Assigned {new Date(assignment.assignedAt).toLocaleDateString()}</p></div>)}{assignments.length === 0 && <p className="text-sm text-slate-500">None.</p>}</div></article>;
}

function form(id: string, name: string): Form { return { id, businessId, name, description: '', version: 1, published: true, archived: false, metadata: {}, fields: [] }; }
function appointment(id: string, customerId: string, start: string, end: string, title: string): Appointment { return { id, businessId, customerId, catalogItemId: 'treatment-1', resourceIds: ['provider-1'], start, end, status: 'confirmed', notes: '', metadata: { title }, active: true }; }
