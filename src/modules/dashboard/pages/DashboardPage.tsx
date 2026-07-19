import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { PageContainer, PageHeader } from '../../../core/layouts';
import { AppointmentFormAssignmentService, InMemoryAppointmentFormAssignmentRepository, type AppointmentFormAssignment } from '../../booking';
import { CustomerService, InMemoryCustomerRepository, type Customer } from '../../customers';
import { FormService, InMemoryFormRepository, type Form } from '../../forms';
import { AppointmentService, InMemoryAppointmentRepository, type Appointment, type AppointmentStatus } from '../../scheduling';

const businessId = 'spa-dashboard-business';
const today = new Date().toISOString().slice(0, 10);
const now = new Date().toISOString();
const customerSeed: Customer[] = [
  customer('customer-ava', 'Ava', 'Morgan', '555-0101', '2026-07-18T09:00:00Z'),
  customer('customer-noah', 'Noah', 'Williams', '555-0102', '2026-07-17T14:00:00Z'),
  customer('customer-mia', 'Mia', 'Thompson', '555-0103', '2026-07-16T11:00:00Z'),
];
const appointmentSeed: Appointment[] = [
  appointment('appointment-ava', 'customer-ava', '09:00', '10:00', 'confirmed', 'Signature Massage', 'Ashley'),
  appointment('appointment-noah', 'customer-noah', '11:00', '11:45', 'confirmed', 'Restorative Facial', 'Jordan'),
  appointment('appointment-mia', 'customer-mia', '14:00', '15:30', 'checked_in', 'Wellness Ritual', 'Ashley'),
];
const formSeed: Form[] = [form('form-intake', 'Spa Intake Form'), form('form-consent', 'Treatment Consent')];
const assignmentSeed: AppointmentFormAssignment[] = [assignment('assignment-1', 'appointment-ava', 'form-intake'), assignment('assignment-2', 'appointment-noah', 'form-consent')];
const customerService = new CustomerService(new InMemoryCustomerRepository(customerSeed));
const appointmentService = new AppointmentService(new InMemoryAppointmentRepository(appointmentSeed));
const formService = new FormService(new InMemoryFormRepository(formSeed));
const assignmentService = new AppointmentFormAssignmentService(new InMemoryAppointmentFormAssignmentRepository(assignmentSeed), appointmentService, formService);
type ListFilter = 'all' | 'forms' | 'checked_in';

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingForms, setPendingForms] = useState<AppointmentFormAssignment[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListFilter>('all');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [nextAppointments, nextAssignments, nextForms, nextCustomers] = await Promise.all([
        appointmentService.listAppointmentsForDay(businessId, today),
        assignmentService.listAssignments(businessId, { status: 'pending' }),
        formService.listForms(businessId, { published: true, archived: false }),
        customerService.listRecent(businessId, 5),
      ]);
      setAppointments(nextAppointments); setPendingForms(nextAssignments); setForms(nextForms); setCustomers(nextCustomers);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load today’s appointments.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const requested = searchParams.get('appointment'); if (requested) setSelectedAppointmentId(requested); }, [searchParams]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedAppointmentId(null); };
    document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close);
  }, []);

  const selectedAppointment = appointments.find((item) => item.id === selectedAppointmentId) ?? null;
  const visibleAppointments = useMemo(() => appointments.filter((item) => filter === 'all' || (filter === 'forms' ? pendingForms.some((formItem) => formItem.appointmentId === item.id) : item.status === 'checked_in')), [appointments, filter, pendingForms]);
  const closeDrawer = () => { setSelectedAppointmentId(null); if (searchParams.has('appointment')) { searchParams.delete('appointment'); setSearchParams(searchParams, { replace: true }); } };
  const updateStatus = async (appointmentId: string, status: 'checked_in' | 'cancelled') => {
    setNotice(''); setError('');
    try {
      if (status === 'checked_in') await appointmentService.checkInAppointment(businessId, appointmentId);
      else await appointmentService.updateAppointment(businessId, appointmentId, { status: 'cancelled' });
      setNotice(status === 'checked_in' ? 'Customer checked in.' : 'Appointment cancelled.');
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update this appointment.'); }
  };

  return <PageContainer>
    <PageHeader title="Today" description="Manage arrivals and appointments from one place." actions={<Link to="/booking" className="rounded-lg bg-jds-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-jds-950">New appointment</Link>} />
    {notice && <Toast tone="success" title="Done" message={notice} onClose={() => setNotice('')} />}
    {error && <Toast tone="error" title="Something went wrong" message={error} onClose={() => setError('')} />}

    <section className="grid gap-4 sm:grid-cols-3" aria-label="Reception overview">
      <Metric label="Appointments" value={appointments.length} detail="Scheduled today" active={filter === 'all'} loading={loading} onClick={() => setFilter('all')} tone="blue" />
      <Metric label="Forms to complete" value={pendingForms.length} detail="Needs attention" active={filter === 'forms'} loading={loading} onClick={() => setFilter('forms')} tone="orange" />
      <Metric label="Checked in" value={appointments.filter((item) => item.status === 'checked_in').length} detail="Currently arrived" active={filter === 'checked_in'} loading={loading} onClick={() => setFilter('checked_in')} tone="green" />
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--jds-shadow-sm)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-jds-950">Arrivals</h2><p className="mt-0.5 text-xs text-slate-500">{filter === 'forms' ? 'Appointments with forms to complete' : filter === 'checked_in' ? 'Checked-in customers' : 'Today in appointment order'}</p></div><Link to="/calendar" className="rounded-lg px-3 py-2 text-sm font-semibold text-jds-700 hover:bg-jds-100">Open schedule →</Link></div>
        <div className="hidden grid-cols-[5.25rem_minmax(9rem,1.2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_7rem_7rem_minmax(6rem,.7fr)] gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 md:grid"><span>Time</span><span>Customer</span><span>Phone</span><span>Treatment</span><span>Status</span><span>Forms</span><span>Provider</span></div>
        <div className="divide-y divide-slate-100">{loading && Array.from({ length: 3 }, (_, index) => <AppointmentSkeleton key={index} />)}{!loading && visibleAppointments.map((item) => {
          const customerRecord = customers.find((record) => record.id === item.customerId);
          const pendingCount = pendingForms.filter((record) => record.appointmentId === item.id).length;
          return <button key={item.id} type="button" onClick={() => setSelectedAppointmentId(item.id)} className="group grid w-full gap-3 px-5 py-4 text-left transition hover:bg-jds-100/60 focus-visible:relative md:grid-cols-[5.25rem_minmax(9rem,1.2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_7rem_7rem_minmax(6rem,.7fr)] md:items-center">
            <span><span className="block font-semibold tabular-nums text-jds-950">{formatTime(item.start)}</span><span className="text-xs text-slate-400">{durationMinutes(item)} min</span></span>
            <span className="min-w-0"><span className="block truncate font-semibold text-slate-900">{customerRecord ? `${customerRecord.firstName} ${customerRecord.lastName}` : item.customerId}</span><span className="text-xs text-slate-400 md:hidden">{customerRecord?.phone}</span></span>
            <span className="hidden text-sm tabular-nums text-slate-600 md:block">{customerRecord?.phone ?? '—'}</span>
            <span className="text-sm text-slate-700"><span className="mr-1 text-xs font-semibold text-slate-400 md:hidden">Treatment</span>{String(item.metadata.service)}</span>
            <StatusChip status={item.status} />
            <span className={`text-xs font-semibold ${pendingCount ? 'text-amber-700' : 'text-emerald-700'}`}>{pendingCount ? `${pendingCount} due` : 'Ready'}</span>
            <span className="text-sm text-slate-600"><span className="mr-1 text-xs font-semibold text-slate-400 md:hidden">Provider</span>{String(item.metadata.provider)}</span>
          </button>;
        })}{!loading && visibleAppointments.length === 0 && <EmptyState filtered={filter !== 'all'} />}</div>
      </article>

      <div className="space-y-6">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--jds-shadow-sm)]"><div className="flex items-center justify-between"><h2 className="font-semibold text-jds-950">Forms to complete</h2>{pendingForms.length > 0 && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">{pendingForms.length}</span>}</div><div className="mt-4 space-y-2">{pendingForms.map((item) => <button type="button" onClick={() => setSelectedAppointmentId(item.appointmentId)} key={item.id} className="group block w-full rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-left hover:border-amber-200 hover:bg-amber-50"><p className="text-sm font-semibold text-amber-950">{forms.find((record) => record.id === item.formId)?.name ?? item.formId}</p><p className="mt-1 flex justify-between gap-2 text-xs text-amber-700"><span className="truncate">{appointmentName(item.appointmentId, appointments, customers)}</span><span>→</span></p></button>)}{pendingForms.length === 0 && <p className="rounded-xl bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-800">All forms are complete</p>}</div></article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--jds-shadow-sm)]"><h2 className="font-semibold text-jds-950">Recent customers</h2><ul className="mt-3 divide-y divide-slate-100">{customers.map((item) => <li key={item.id}><Link to={`/customers?customer=${item.id}`} className="flex items-center gap-3 rounded-lg py-3 hover:bg-slate-50"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-jds-100 text-xs font-bold text-jds-700">{item.firstName[0]}{item.lastName[0]}</span><span><span className="block text-sm font-semibold text-slate-800">{item.firstName} {item.lastName}</span><span className="block text-xs text-slate-500">{item.phone}</span></span></Link></li>)}</ul></article>
      </div>
    </section>

    {selectedAppointment && <AppointmentDrawer appointment={selectedAppointment} customer={customers.find((item) => item.id === selectedAppointment.customerId)} pendingForms={pendingForms.filter((item) => item.appointmentId === selectedAppointment.id)} forms={forms} onClose={closeDrawer} onCheckIn={() => void updateStatus(selectedAppointment.id, 'checked_in')} onCancel={() => void updateStatus(selectedAppointment.id, 'cancelled')} />}
  </PageContainer>;
}

function AppointmentDrawer({ appointment, customer, pendingForms, forms, onClose, onCheckIn, onCancel }: { appointment: Appointment; customer?: Customer; pendingForms: AppointmentFormAssignment[]; forms: Form[]; onClose: () => void; onCheckIn: () => void; onCancel: () => void }) {
  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="appointment-drawer-title"><button type="button" className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]" onClick={onClose} aria-label="Close appointment" /><section className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl">
    <header className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-jds-700">Appointment workspace</p><h2 id="appointment-drawer-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{customer ? `${customer.firstName} ${customer.lastName}` : appointment.customerId}</h2><p className="mt-1 text-sm text-slate-500">{formatTime(appointment.start)}–{formatTime(appointment.end)} · {String(appointment.metadata.service)}</p></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-lg text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close appointment">×</button></header>
    <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6"><div className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><span className="text-sm font-semibold text-slate-600">Status</span><StatusChip status={appointment.status} /></div>
      <dl className="mt-6 grid gap-x-5 gap-y-4 sm:grid-cols-2"><Detail label="Customer" value={customer ? `${customer.firstName} ${customer.lastName}` : appointment.customerId} /><Detail label="Phone" value={customer?.phone ?? 'Not provided'} /><Detail label="Treatment" value={String(appointment.metadata.service)} /><Detail label="Provider" value={String(appointment.metadata.provider)} /><Detail label="Duration" value={`${durationMinutes(appointment)} minutes`} /><Detail label="Email" value={customer?.email ?? 'Not provided'} /></dl>
      <section className="mt-7"><h3 className="text-sm font-semibold text-slate-900">Forms</h3><div className="mt-2 space-y-2">{pendingForms.length ? pendingForms.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm"><span className="font-medium text-amber-950">{forms.find((formItem) => formItem.id === item.formId)?.name}</span><span className="text-xs font-bold text-amber-700">Due</span></div>) : <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">All forms ready</p>}</div></section>
      <section className="mt-7"><h3 className="text-sm font-semibold text-slate-900">Notes</h3><p className="mt-2 min-h-16 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">{appointment.notes || customer?.notes || 'No notes added.'}</p></section>
      <section className="mt-7"><h3 className="text-sm font-semibold text-slate-900">History</h3><p className="mt-2 rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-400">Appointment activity will appear here.</p></section>
      <div className="mt-7 grid grid-cols-2 gap-2"><Link to={`/customers?customer=${appointment.customerId}`} className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">View customer</Link><Link to={`/appointment-forms?appointment=${appointment.id}`} className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">View forms</Link></div>
    </div>
    <footer className="border-t border-slate-100 bg-slate-50/90 p-4 sm:p-5"><div className="grid gap-2 sm:grid-cols-2">{appointment.status === 'confirmed' && <button type="button" onClick={onCheckIn} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">Check in</button>}<Link to={`/reschedule?appointment=${appointment.id}`} className="rounded-lg bg-jds-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-jds-950">Reschedule</Link></div>{appointment.status !== 'cancelled' && appointment.status !== 'completed' && <button type="button" onClick={onCancel} className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Cancel appointment</button>}</footer>
  </section></div>;
}

const statusStyle: Record<AppointmentStatus, string> = { tentative: 'bg-amber-50 text-amber-700', confirmed: 'bg-blue-50 text-blue-700', checked_in: 'bg-emerald-50 text-emerald-700', completed: 'bg-slate-100 text-slate-600', cancelled: 'bg-rose-50 text-rose-700', no_show: 'bg-orange-50 text-orange-700' };
function StatusChip({ status }: { status: AppointmentStatus }) { return <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[status]}`}><span className="size-1.5 rounded-full bg-current opacity-70" />{status.replace('_', ' ')}</span>; }
function Metric({ label, value, detail, loading, active, onClick, tone }: { label: string; value: number; detail: string; loading: boolean; active: boolean; onClick: () => void; tone: 'blue' | 'orange' | 'green' }) { const tones = { blue: 'bg-blue-50 text-blue-700', orange: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700' }; return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-2xl border bg-white p-5 text-left shadow-[var(--jds-shadow-sm)] hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-jds-700 ring-2 ring-jds-700/10' : 'border-slate-200/80'}`}><div className="flex items-start justify-between"><p className="text-sm font-semibold text-slate-600">{label}</p><span className={`grid size-9 place-items-center rounded-xl text-lg font-bold ${tones[tone]}`}>↘</span></div>{loading ? <div className="mt-4 h-8 w-12 animate-pulse rounded bg-slate-100" /> : <p className="mt-3 text-3xl font-semibold tracking-tight text-jds-950">{value}</p>}<p className="mt-2 text-xs text-slate-400">{detail}</p></button>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd></div>; }
function Toast({ tone, title, message, onClose }: { tone: 'success' | 'error'; title: string; message: string; onClose: () => void }) { return <div className={`fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl border bg-white p-4 text-sm shadow-xl ${tone === 'success' ? 'border-emerald-200' : 'border-rose-200'}`} role={tone === 'success' ? 'status' : 'alert'}><div className="flex gap-4"><div><p className="font-semibold text-slate-900">{title}</p><p className="mt-0.5 text-slate-600">{message}</p></div><button type="button" onClick={onClose} aria-label="Dismiss" className="text-slate-400">×</button></div></div>; }
function AppointmentSkeleton() { return <div className="flex animate-pulse gap-5 px-5 py-5"><div className="h-8 w-16 rounded bg-slate-100" /><div className="h-8 flex-1 rounded bg-slate-100" /></div>; }
function EmptyState({ filtered }: { filtered: boolean }) { return <div className="px-6 py-14 text-center"><p className="font-semibold text-slate-800">{filtered ? 'No matching appointments' : 'No appointments today'}</p><p className="mt-1 text-sm text-slate-500">{filtered ? 'Choose another overview card to change the list.' : 'New appointments will appear here.'}</p></div>; }
function formatTime(value: string): string { return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value)); }
function durationMinutes(item: Appointment): number { return Math.round((Date.parse(item.end) - Date.parse(item.start)) / 60000); }
function appointmentName(id: string, appointments: Appointment[], customers: Customer[]): string { const item = appointments.find((record) => record.id === id); const customerRecord = customers.find((record) => record.id === item?.customerId); return customerRecord ? `${customerRecord.firstName} ${customerRecord.lastName}` : id; }
function customer(id: string, firstName: string, lastName: string, phone: string, createdAt: string): Customer { return { id, businessId, firstName, lastName, email: `${firstName.toLowerCase()}@example.test`, phone, address: { line1: '12 Cedar Way', country: 'US' }, notes: '', active: true, createdAt, updatedAt: createdAt, deletedAt: null }; }
function appointment(id: string, customerId: string, start: string, end: string, status: Appointment['status'], service: string, provider: string): Appointment { return { id, businessId, customerId, catalogItemId: `treatment-${id}`, resourceIds: [`provider-${provider.toLowerCase()}`], start: `${today}T${start}:00Z`, end: `${today}T${end}:00Z`, status, notes: '', metadata: { title: `${service}`, service, provider }, active: true }; }
function form(id: string, name: string): Form { return { id, businessId, name, description: '', version: 1, published: true, archived: false, metadata: {}, fields: [] }; }
function assignment(id: string, appointmentId: string, formId: string): AppointmentFormAssignment { return { id, businessId, appointmentId, formId, status: 'pending', assignedAt: now, completedAt: null }; }
