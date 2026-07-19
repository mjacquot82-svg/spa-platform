import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { CatalogItemService, InMemoryCatalogItemRepository, type CatalogItem } from '../../catalog';

import {
  AppointmentService,
  appointmentToCalendarEvent,
  AvailabilityExceptionService,
  InMemoryAppointmentRepository,
  InMemoryAvailabilityExceptionRepository,
  InMemorySchedulingResourceRepository,
  InMemoryWorkingHoursRepository,
  InMemoryPlanningPeriodRepository,
  SchedulingCalendar,
  SchedulingResourceService,
  SchedulingService,
  PlanningPeriodService,
  type Appointment,
  type SchedulingResource,
  type TimeInterval,
  WorkingHoursService,
} from '../../scheduling';

const BUSINESS_ID = 'reschedule-demo-business';
const today = new Date().toISOString().slice(0, 10);

const resourceSeed: SchedulingResource[] = [
  { id: 'resource-ashley', businessId: BUSINESS_ID, name: 'Ashley', type: 'staff', color: '#0f766e', active: true, metadata: {} },
  { id: 'resource-jordan', businessId: BUSINESS_ID, name: 'Jordan', type: 'staff', color: '#7c3aed', active: true, metadata: {} },
];
const catalogSeed: CatalogItem[] = [
  treatment('treatment-massage', 'Signature Massage', 60),
  treatment('treatment-facial', 'Restorative Facial', 45),
  treatment('treatment-ritual', 'Wellness Ritual', 90),
];
const appointmentSeed: Appointment[] = [
  createSeedAppointment('appointment-ava', 'customer-ava', 'treatment-massage', 'resource-ashley', '09:00', '10:00', 'Signature Massage · Ava Morgan'),
  createSeedAppointment('appointment-noah', 'customer-noah', 'treatment-facial', 'resource-jordan', '11:00', '11:45', 'Restorative Facial · Noah Williams'),
  createSeedAppointment('appointment-mia', 'customer-mia', 'treatment-ritual', 'resource-ashley', '14:00', '15:30', 'Wellness Ritual · Mia Thompson'),
];

const catalogService = new CatalogItemService(new InMemoryCatalogItemRepository(catalogSeed));
const resourceService = new SchedulingResourceService(new InMemorySchedulingResourceRepository(resourceSeed));
const workingHoursService = new WorkingHoursService(new InMemoryWorkingHoursRepository(
  resourceSeed.flatMap((resource) => Array.from({ length: 7 }, (_, dayOfWeek) => ({
    id: `hours-${resource.id}-${dayOfWeek}`,
    businessId: BUSINESS_ID,
    resourceId: resource.id,
    dayOfWeek,
    enabled: true,
    timeRanges: [{ startTime: '09:00', endTime: '17:00' }],
  }))),
));
const exceptionService = new AvailabilityExceptionService(new InMemoryAvailabilityExceptionRepository());
const appointmentService = new AppointmentService(new InMemoryAppointmentRepository(appointmentSeed));
const planningPeriodService = new PlanningPeriodService(new InMemoryPlanningPeriodRepository(publishedPeriods()));
const schedulingService = new SchedulingService(catalogService, resourceService, workingHoursService, exceptionService, appointmentService, planningPeriodService);

export default function RescheduleDemo() {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [resources, setResources] = useState<SchedulingResource[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<TimeInterval[]>([]);
  const [suggestedDuration, setSuggestedDuration] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeInterval | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [appointmentSearch, setAppointmentSearch] = useState('');

  useEffect(() => {
    void Promise.all([
      appointmentService.listAppointments(BUSINESS_ID, { active: true }),
      resourceService.listResources(BUSINESS_ID, { active: true }),
    ]).then(([nextAppointments, nextResources]) => {
      setAppointments(nextAppointments);
      setResources(nextResources);
      const requestedId = searchParams.get('appointment');
      const requested = nextAppointments.find((item) => item.id === requestedId);
      if (requested) {
        setSelectedAppointmentId(requested.id);
        setDate(requested.start.slice(0, 10));
      }
    });
  }, [searchParams]);

  const refreshAvailability = useCallback(async () => {
    if (!selectedAppointmentId || !date) {
      setSlots([]);
      return;
    }
    const appointment = await appointmentService.getAppointment(BUSINESS_ID, selectedAppointmentId);
    const resourceId = appointment?.resourceIds[0];
    if (!appointment || !resourceId) {
      setSlots([]);
      return;
    }
    const [nextSuggestions, allAppointments] = await Promise.all([
      schedulingService.findNextAvailableAppointments({ businessId: BUSINESS_ID, catalogItemId: appointment.catalogItemId, preferredResourceId: resourceId, preferredDate: date, numberOfSuggestions: 16 }),
      appointmentService.listAppointments(BUSINESS_ID, { active: true }),
    ]);
    setAppointments(allAppointments);
    setSuggestedDuration(nextSuggestions[0]?.duration ?? null);
    setSlots(nextSuggestions.map(({ start, end }) => ({ start, end })));
  }, [date, selectedAppointmentId]);

  useEffect(() => {
    void refreshAvailability();
  }, [refreshAvailability]);

  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId);
  const resource = resources.find((item) => selectedAppointment?.resourceIds.includes(item.id));
  const calendarEvents = useMemo(() => appointments.map(appointmentToCalendarEvent), [appointments]);
  const matchingAppointments = appointments.filter((item) => `${String(item.metadata.title)} ${item.status}`.toLowerCase().includes(appointmentSearch.toLowerCase()));

  const selectAppointment = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    setDate(appointment.start.slice(0, 10));
    setSelectedSlot(null);
    setSuccess('');
    setError('');
  };

  const reschedule = async () => {
    if (!selectedAppointment || !selectedSlot) return;
    setSaving(true);
    setError('');
    try {
      await appointmentService.updateAppointment(BUSINESS_ID, selectedAppointment.id, {
        start: selectedSlot.start,
        end: selectedSlot.end,
      });
      setSelectedSlot(null);
      setSuccess('Appointment rescheduled successfully.');
      await refreshAvailability();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to reschedule appointment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">Front desk</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Reschedule appointment</h1>
          <p className="mt-2 text-slate-600">Choose a new available time and confirm the change.</p>
        </header>

        {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-800">{success}</p>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}

        <section className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Find appointment</h2>
            <input type="search" value={appointmentSearch} onChange={(event) => setAppointmentSearch(event.target.value)} placeholder="Search guest or service…" aria-label="Search appointments" className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <div className="mt-4 space-y-2">
              {matchingAppointments.map((appointment) => (
                <button key={appointment.id} type="button" onClick={() => selectAppointment(appointment)}
                  className={`w-full rounded-xl border p-3 text-left ${selectedAppointmentId === appointment.id ? 'border-jds-600 bg-jds-50' : 'border-slate-200 hover:border-jds-400'}`}>
                  <span className="block font-medium">{String(appointment.metadata.title)}</span>
                  <span className="mt-1 block text-xs text-slate-500">{formatDateTime(appointment.start)}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Current appointment</h2>
              {selectedAppointment ? (
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <Detail label="Appointment" value={String(selectedAppointment.metadata.title)} />
                  <Detail label="Resource" value={resource?.name ?? selectedAppointment.resourceIds.join(', ')} />
                  <Detail label="Current date and time" value={formatDateTime(selectedAppointment.start)} />
                  <Detail label="Duration" value={suggestedDuration ? `${suggestedDuration} minutes` : 'Unavailable'} />
                  <Detail label="Status" value={selectedAppointment.status} />
                  <Detail label="Guest" value={String(selectedAppointment.metadata.title).split('·').at(-1)?.trim() ?? selectedAppointment.customerId} />
                </dl>
              ) : <p className="mt-3 text-sm text-slate-500">Choose an appointment to begin.</p>}
            </section>

            <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${selectedAppointment ? '' : 'opacity-50'}`}>
              <h2 className="text-lg font-semibold">Choose a new time</h2>
              <label className="mt-4 block text-sm font-medium">New date
                <input type="date" disabled={!selectedAppointment} value={date} onChange={(event) => { setDate(event.target.value); setSelectedSlot(null); setSuccess(''); }}
                  className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2" />
              </label>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button key={slot.start} type="button" onClick={() => { setSelectedSlot(slot); setSuccess(''); }}
                    className={`rounded-lg border px-3 py-2 text-sm ${selectedSlot?.start === slot.start ? 'border-jds-600 bg-jds-50 text-jds-900' : 'border-slate-200 hover:border-jds-400'}`}>
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>
              {selectedAppointment && slots.length === 0 && <p className="mt-3 text-sm text-slate-500">No replacement slots are available for this date.</p>}
              {selectedAppointment && selectedSlot && <div className="mt-5 rounded-xl bg-jds-50 p-4 text-sm"><p className="font-semibold text-jds-950">Confirm the change</p><p className="mt-2 text-slate-600">From <strong>{formatDateTime(selectedAppointment.start)}</strong></p><p className="mt-1 text-slate-600">To <strong>{formatDateTime(selectedSlot.start)}</strong> with <strong>{resource?.name ?? 'current provider'}</strong></p></div>}
              <button type="button" disabled={!selectedSlot || saving} onClick={() => void reschedule()}
                className="mt-5 rounded-lg bg-jds-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? 'Rescheduling…' : 'Confirm reschedule'}
              </button>
              <Link to="/dashboard" className="ml-4 inline-block text-sm font-medium text-jds-700">Back to Today</Link>
            </section>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-4 text-xl font-semibold">Appointment calendar</h2>
          <SchedulingCalendar events={calendarEvents} editable={false} selectable={false}
            onEventClick={(event) => {
              const appointment = appointments.find((item) => item.id === event.id);
              if (appointment) selectAppointment(appointment);
            }} />
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-medium capitalize">{value}</dd></div>;
}

function createSeedAppointment(id: string, customerId: string, catalogItemId: string, resourceId: string, start: string, end: string, title: string): Appointment {
  return { id, businessId: BUSINESS_ID, customerId, catalogItemId, resourceIds: [resourceId], start: `${today}T${start}:00Z`, end: `${today}T${end}:00Z`, status: 'confirmed', notes: '', metadata: { title }, active: true };
}

function treatment(id: string, name: string, durationMinutes: number): CatalogItem {
  return { id, businessId: BUSINESS_ID, type: 'Service', name, description: '', category: 'Spa', image: null, active: true, durationMinutes, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, resourceTypesRequired: ['staff'], createdAt: today, updatedAt: today, deletedAt: null };
}
function publishedPeriods() { return Array.from({ length: 14 }, (_, index) => { const date = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + index, 1)); return { id: `published-${index}`, businessId: BUSINESS_ID, year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, status: 'published' as const }; }); }

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value));
}
