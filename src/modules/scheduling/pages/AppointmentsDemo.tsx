import { useMemo, useState } from 'react';

import { findAvailableSlotsForDay } from '../services';
import type {
  Appointment,
  AvailabilityException,
  SchedulingResource,
  TimeInterval,
  WorkingHours,
} from '../types';

const businessId = 'demo-business';
const date = '2026-07-20';
const resources: SchedulingResource[] = [
  { id: 'ashley', businessId, name: 'Ashley', type: 'staff', color: '#315c49', active: true, metadata: {} },
  { id: 'room-1', businessId, name: 'Room 1', type: 'room', color: '#715a9a', active: true, metadata: {} },
  { id: 'laser', businessId, name: 'Laser', type: 'equipment', color: '#876923', active: true, metadata: {} },
];
const workingHours: WorkingHours[] = resources.map((resource, index) => ({
  id: `hours-${resource.id}`, businessId, resourceId: resource.id, dayOfWeek: 1, enabled: true,
  timeRanges: [{ startTime: index === 0 ? '09:00' : '08:00', endTime: '18:00' }],
}));
const exceptions: AvailabilityException[] = [
  exception('lunch', 'ashley', 'Lunch break', '12:00', '13:00'),
  exception('maintenance', 'room-1', 'Maintenance', '10:00', '11:30'),
  exception('vacation', 'ashley', 'Vacation (archived example)', '09:00', '18:00', false),
];
const appointments: Appointment[] = [
  appointment('confirmed', 'customer-ashley', ['ashley'], '09:30', '10:30', 'confirmed', 'Massage · Ashley'),
  appointment('tentative', 'customer-room', ['room-1', 'laser'], '13:00', '14:00', 'tentative', 'Laser service · Room 1'),
  appointment('cancelled', 'customer-cancelled', ['ashley'], '14:00', '15:00', 'cancelled', 'Cancelled consultation'),
];

export function AppointmentsDemo() {
  const [view, setView] = useState<'day' | 'resource'>('day');
  const [resourceId, setResourceId] = useState(resources[0].id);
  const visibleResources = view === 'day' ? resources : resources.filter((resource) => resource.id === resourceId);
  const slotMap = useMemo(() => new Map(resources.map((resource) => [
    resource.id,
    findAvailableSlotsForDay({
      date, businessId, resourceId: resource.id, requestedDurationMinutes: 30,
      slotIncrementMinutes: 30, workingHours, availabilityExceptions: exceptions,
      existingAppointments: appointments,
    }),
  ])), []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">Scheduling demo</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-jds-950">Appointments and availability</h1>
        <p className="mt-3 text-slate-600">Working hours plus exceptions, minus active appointments with blocking statuses.</p>
      </header>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="inline-flex rounded-xl bg-slate-100 p-1" aria-label="Demo view">
          {(['day', 'resource'] as const).map((option) => (
            <button key={option} type="button" onClick={() => setView(option)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${view === option ? 'bg-white text-jds-950 shadow-sm' : 'text-slate-600'}`}>
              {option} view
            </button>
          ))}
        </div>
        {view === 'resource' && (
          <label className="text-sm font-medium text-slate-700">
            Resource
            <select value={resourceId} onChange={(event) => setResourceId(event.target.value)}
              className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900">
              {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
            </select>
          </label>
        )}
      </div>

      <section className="mt-8 grid gap-5 lg:grid-cols-3" aria-label="Resource availability">
        {visibleResources.map((resource) => {
          const resourceAppointments = appointments.filter((item) => item.resourceIds.includes(resource.id));
          const resourceExceptions = exceptions.filter((item) => item.resourceId === resource.id);
          return (
            <article key={resource.id} className="rounded-2xl border border-jds-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full" style={{ backgroundColor: resource.color }} aria-hidden="true" />
                <h2 className="text-lg font-semibold text-jds-950">{resource.name}</h2>
                <span className="ml-auto text-xs capitalize text-slate-500">{resource.type}</span>
              </div>
              <Detail title="Working hours">
                {workingHours.find((hours) => hours.resourceId === resource.id)?.timeRanges.map((range) => `${range.startTime}–${range.endTime}`).join(', ')}
              </Detail>
              <Detail title="Exceptions">
                {resourceExceptions.length ? resourceExceptions.map((item) => (
                  <Badge key={item.id} tone={item.active ? 'rose' : 'slate'}>{item.title} · {clock(item.start)}–{clock(item.end)}{!item.active ? ' · archived' : ''}</Badge>
                )) : 'None'}
              </Detail>
              <Detail title="Appointments">
                {resourceAppointments.length ? resourceAppointments.map((item) => (
                  <Badge key={item.id} tone={item.status === 'cancelled' ? 'slate' : item.status === 'tentative' ? 'amber' : 'green'}>
                    {String(item.metadata.title)} · {clock(item.start)}–{clock(item.end)} · {item.status}
                  </Badge>
                )) : 'None'}
              </Detail>
              <Detail title="Calculated 30-minute slots">
                <SlotSummary slots={slotMap.get(resource.id) ?? []} />
              </Detail>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-5"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3><div className="mt-2 flex flex-wrap gap-1.5 text-sm text-slate-700">{children}</div></section>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'rose' | 'slate' | 'amber' | 'green' }) {
  const colors = { rose: 'bg-rose-100 text-rose-800', slate: 'bg-slate-100 text-slate-600', amber: 'bg-amber-100 text-amber-800', green: 'bg-emerald-100 text-emerald-800' };
  return <span className={`rounded-lg px-2 py-1 text-xs ${colors[tone]}`}>{children}</span>;
}

function SlotSummary({ slots }: { slots: TimeInterval[] }) {
  const ranges: TimeInterval[] = [];
  for (const slot of slots) {
    const previous = ranges.at(-1);
    if (previous?.end === slot.start) previous.end = slot.end;
    else ranges.push({ ...slot });
  }
  return <>{ranges.length ? ranges.map((range) => <span key={range.start} className="rounded-lg bg-jds-100 px-2 py-1 text-xs font-medium text-jds-900">{clock(range.start)}–{clock(range.end)}</span>) : 'No availability'}</>;
}

function appointment(id: string, customerId: string, resourceIds: string[], start: string, end: string, status: Appointment['status'], title: string): Appointment {
  return { id, businessId, customerId, catalogItemId: 'demo-service', resourceIds, start: `${date}T${start}:00Z`, end: `${date}T${end}:00Z`, status, notes: '', metadata: { title }, active: true };
}

function exception(id: string, resourceId: string, title: string, start: string, end: string, active = true): AvailabilityException {
  return { id, businessId, resourceId, start: `${date}T${start}:00Z`, end: `${date}T${end}:00Z`, type: 'unavailable', title, metadata: {}, active };
}

function clock(timestamp: string): string { return timestamp.slice(11, 16); }

export default AppointmentsDemo;
