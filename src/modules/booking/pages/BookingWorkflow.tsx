import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { CatalogItem } from '../../catalog';
import type { Customer } from '../../customers';
import type { Form } from '../../forms';
import { useApplicationServices } from '../../../app/useApplicationServices';
import { appointmentToCalendarEvent } from '../../scheduling/adapters';
import { SchedulingCalendar } from '../../scheduling/components';
import type { Appointment, AppointmentSuggestion, CalendarEvent, SchedulingResource } from '../../scheduling/types';
import { useAppointmentFormAssignments, useAssignAppointmentForm } from '../hooks';

const today = new Date().toISOString().slice(0, 10);

export function BookingWorkflow() {
  const { businessId, customers: customerService, catalogItems: catalogService, resources: resourceService, appointments: appointmentService, forms: formService, appointmentForms: assignmentService, scheduling: schedulingService } = useApplicationServices();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [resources, setResources] = useState<SchedulingResource[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [catalogItemId, setCatalogItemId] = useState('');
  const [preferredResourceId, setPreferredResourceId] = useState('');
  const [preferredDate, setPreferredDate] = useState(today);
  const [suggestions, setSuggestions] = useState<AppointmentSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AppointmentSuggestion | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const assignments = useAppointmentFormAssignments(assignmentService, businessId, createdAppointmentId);
  const assignForm = useAssignAppointmentForm(assignmentService, businessId);

  useEffect(() => { void Promise.all([
    customerService.list(businessId, { active: true }), catalogService.list(businessId, { type: 'Service', active: true }),
    resourceService.listResources(businessId, { active: true }), appointmentService.listAppointments(businessId, { active: true }),
    formService.listForms(businessId, { published: true, archived: false }),
  ]).then(([nextCustomers, nextItems, nextResources, nextAppointments, nextForms]) => { setCustomers(nextCustomers); setCatalogItems(nextItems); setResources(nextResources); setAppointments(nextAppointments); setForms(nextForms); }); }, [appointmentService, businessId, catalogService, customerService, formService, resourceService]);

  useEffect(() => {
    if (!catalogItemId) { setSuggestions([]); setSelectedSuggestion(null); return; }
    let current = true; setLoadingSuggestions(true); setError(''); setSelectedSuggestion(null);
    void schedulingService.findNextAvailableAppointments({ businessId, catalogItemId, preferredResourceId: preferredResourceId || undefined, preferredDate, numberOfSuggestions: 40 })
      .then((items) => { if (current) setSuggestions(items); })
      .catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : 'Unable to find appointment times.'); })
      .finally(() => { if (current) setLoadingSuggestions(false); });
    return () => { current = false; };
  }, [businessId, catalogItemId, preferredDate, preferredResourceId, schedulingService]);

  const customer = customers.find((item) => item.id === customerId);
  const catalogItem = catalogItems.find((item) => item.id === catalogItemId);
  const matchingCustomers = customers.filter((item) => `${item.firstName} ${item.lastName} ${item.phone} ${item.email}`.toLowerCase().includes(customerSearch.toLowerCase())).slice(0, 6);
  const matchingTreatments = catalogItems.filter((item) => `${item.name} ${item.category ?? ''}`.toLowerCase().includes(treatmentSearch.toLowerCase()));
  const featuredSuggestions = useMemo(() => selectFeaturedSuggestions(suggestions), [suggestions]);
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const existing = appointments.map(appointmentToCalendarEvent);
    return selectedSuggestion ? [...existing, { id: 'selected-suggestion', title: `Selected · ${catalogItem?.name ?? 'Appointment'}`, start: selectedSuggestion.start, end: selectedSuggestion.end, resourceIds: [selectedSuggestion.resource.id], editable: false }] : existing;
  }, [appointments, catalogItem, selectedSuggestion]);

  const createAppointment = async () => {
    if (!customer || !catalogItem || !selectedSuggestion) return;
    setSaving(true); setError('');
    try {
      const created = await appointmentService.createAppointment(businessId, { customerId: customer.id, catalogItemId: catalogItem.id, resourceIds: [selectedSuggestion.resource.id], start: selectedSuggestion.start, end: selectedSuggestion.end, status: 'confirmed', notes: '', metadata: { title: `${catalogItem.name} · ${customer.firstName} ${customer.lastName}` }, active: true });
      setAppointments(await appointmentService.listAppointments(businessId, { active: true })); setCreatedAppointmentId(created.id); setSelectedFormIds([]); setSuccess(`Appointment booked for ${customer.firstName} ${customer.lastName}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to book this appointment.'); }
    finally { setSaving(false); }
  };
  const assignSelectedForms = async () => {
    if (!createdAppointmentId) return;
    try { for (const formId of selectedFormIds) await assignForm.mutate({ appointmentId: createdAppointmentId, formId }); setSelectedFormIds([]); await assignments.refetch(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to assign forms.'); }
  };
  const reset = () => { setCreatedAppointmentId(null); setCustomerId(''); setCustomerSearch(''); setCatalogItemId(''); setTreatmentSearch(''); setPreferredResourceId(''); setSelectedSuggestion(null); setSuccess(''); };

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">Front desk</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">New appointment</h1><p className="mt-2 text-slate-600">Choose the customer and treatment. We’ll find the best times.</p></header>
    <ol className="grid grid-cols-4 gap-2" aria-label="Booking progress">{['Customer', 'Treatment', 'Suggested times', 'Book'].map((step, index) => <li key={step} className={`rounded-lg border px-2 py-2 text-center text-xs font-semibold ${index <= (selectedSuggestion ? 3 : catalogItemId ? 2 : customerId ? 1 : 0) ? 'border-jds-700 bg-jds-100 text-jds-950' : 'border-slate-200 bg-white text-slate-400'}`}><span className="mr-1 text-[10px]">{index + 1}</span>{step}</li>)}</ol>
    {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-800">{success}</p>}{error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</p>}

    {!createdAppointmentId && <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <fieldset><legend className="mb-3 font-semibold"><Step number={1} />Customer</legend><input autoFocus type="search" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Search name, phone or email…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />{customerId && customer ? <button type="button" onClick={() => { setCustomerId(''); setCustomerSearch(''); }} className="mt-2 flex w-full justify-between rounded-lg border border-jds-700 bg-jds-100 px-3 py-2 text-left text-sm"><strong>{customer.firstName} {customer.lastName}</strong><span>Change</span></button> : customerSearch && <div className="mt-2 divide-y rounded-lg border border-slate-200">{matchingCustomers.map((item) => <button key={item.id} type="button" onClick={() => { setCustomerId(item.id); setCustomerSearch(`${item.firstName} ${item.lastName}`); }} className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"><strong>{item.firstName} {item.lastName}</strong><span className="text-slate-500">{item.phone}</span></button>)}</div>}</fieldset>
        <fieldset disabled={!customerId} className={!customerId ? 'opacity-40' : ''}><legend className="mb-3 font-semibold"><Step number={2} />Treatment</legend><input type="search" value={treatmentSearch} onChange={(event) => setTreatmentSearch(event.target.value)} placeholder="Search treatments…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /><div className="mt-2 grid gap-2 sm:grid-cols-2">{matchingTreatments.map((item) => <button key={item.id} type="button" onClick={() => setCatalogItemId(item.id)} className={`rounded-xl border p-3 text-left ${catalogItemId === item.id ? 'border-jds-700 bg-jds-100' : 'border-slate-200 hover:border-jds-700'}`}><strong className="block text-sm">{item.name}</strong><span className="mt-1 block text-xs text-slate-500">{item.type === 'Service' ? `${item.durationMinutes} minutes` : ''}</span></button>)}</div></fieldset>
        <fieldset disabled={!catalogItemId} className={!catalogItemId ? 'opacity-40' : ''}><legend className="mb-3 font-semibold"><Step number={3} />Suggested appointments</legend>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Provider preference<select value={preferredResourceId} onChange={(event) => setPreferredResourceId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Any available</option>{resources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm font-medium">Start searching from<input type="date" value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div>
          {loadingSuggestions ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{featuredSuggestions.map(({ label, suggestion }) => <button key={`${label}-${suggestion.start}-${suggestion.resource.id}`} type="button" onClick={() => setSelectedSuggestion(suggestion)} className={`rounded-xl border p-4 text-left hover:border-jds-700 hover:shadow-sm ${selectedSuggestion?.start === suggestion.start && selectedSuggestion.resource.id === suggestion.resource.id ? 'border-jds-700 bg-jds-100 ring-2 ring-jds-700/10' : 'border-slate-200 bg-white'}`}><span className="text-xs font-bold uppercase tracking-wide text-jds-700">{label}</span><span className="mt-1 block text-lg font-semibold">{suggestion.dayLabel} · {suggestion.friendlyTime}</span><span className="mt-1 block text-sm text-slate-600">{suggestion.resource.name} · {suggestion.duration} min</span><span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{suggestion.reason}</span></button>)}</div>}
          {!loadingSuggestions && catalogItemId && suggestions.length === 0 && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No nearby opening was found. Try another provider or a later starting date.</p>}
          <button type="button" onClick={() => setShowCalendar((value) => !value)} className="mt-4 text-sm font-semibold text-jds-700 hover:underline">{showCalendar ? 'Hide calendar' : 'Show calendar'}</button>
        </fieldset>
      </div>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Ready to book</h2><dl className="mt-4 space-y-3 text-sm"><Review label="Customer" value={customer ? `${customer.firstName} ${customer.lastName}` : '—'} /><Review label="Treatment" value={catalogItem?.name ?? '—'} /><Review label="Provider" value={selectedSuggestion?.resource.name ?? 'Any available'} /><Review label="Date" value={selectedSuggestion?.friendlyDate ?? '—'} /><Review label="Time" value={selectedSuggestion?.friendlyTime ?? '—'} /><Review label="Duration" value={selectedSuggestion ? `${selectedSuggestion.duration} minutes` : '—'} /></dl><button type="button" disabled={!selectedSuggestion || saving} onClick={() => void createAppointment()} className="mt-6 w-full rounded-lg bg-jds-700 px-4 py-3 font-semibold text-white shadow-sm hover:bg-jds-950 disabled:opacity-40">{saving ? 'Booking…' : 'Book appointment'}</button></aside>
    </section>}

    {showCalendar && !createdAppointmentId && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Optional</p><h2 className="text-xl font-semibold">Calendar refinement</h2><p className="text-sm text-slate-500">The selected suggestion appears here automatically.</p></div><SchedulingCalendar events={calendarEvents} editable={false} selectable={false} /></section>}
    {createdAppointmentId && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-semibold">Appointment booked</h2><p className="mt-1 text-sm text-slate-500">Assign forms now, or continue with the next customer.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{forms.map((form) => <label key={form.id} className="flex gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={selectedFormIds.includes(form.id)} onChange={(event) => setSelectedFormIds((items) => event.target.checked ? [...items, form.id] : items.filter((id) => id !== form.id))} /><span><strong className="block">{form.name}</strong><span className="text-sm text-slate-500">{form.description}</span></span></label>)}</div><div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={!selectedFormIds.length || assignForm.loading} onClick={() => void assignSelectedForms()} className="rounded-lg bg-jds-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Assign selected forms</button><button type="button" onClick={reset} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold">Book another</button><Link to="/dashboard" className="px-4 py-2.5 text-sm font-semibold text-jds-700">Back to Today</Link></div></section>}
  </div></main>;
}


function selectFeaturedSuggestions(suggestions: AppointmentSuggestion[]): Array<{ label: string; suggestion: AppointmentSuggestion }> {
  if (!suggestions.length) return [];
  const candidates: Array<[string, AppointmentSuggestion | undefined]> = [
    ['⭐ Earliest available', suggestions[0]],
    ["Today's earliest", suggestions.find((item) => item.dayLabel === 'Today' && item !== suggestions[0])],
    ['Tomorrow morning', suggestions.find((item) => item.dayLabel === 'Tomorrow' && new Date(item.start).getUTCHours() < 12)],
    ['Tomorrow afternoon', suggestions.find((item) => item.dayLabel === 'Tomorrow' && new Date(item.start).getUTCHours() >= 12)],
    ['Next available this week', suggestions.find((item) => item.dayLabel !== 'Today' && item.dayLabel !== 'Tomorrow')],
  ];
  const seen = new Set<string>();
  return candidates.flatMap(([label, suggestion]) => { if (!suggestion) return []; const key = `${suggestion.resource.id}-${suggestion.start}`; if (seen.has(key)) return []; seen.add(key); return [{ label, suggestion }]; });
}
function Step({ number }: { number: number }) { return <span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-jds-100 text-xs text-jds-700">{number}</span>; }
function Review({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium">{value}</dd></div>; }
