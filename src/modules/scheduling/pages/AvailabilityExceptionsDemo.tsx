import { findAvailableSlotsForDay } from '../services';
import type { AvailabilityException, TimeInterval, WorkingHours } from '../types';

const businessId = 'demo-business';
const date = '2026-07-20';

const scenarios = [
  scenario('ashley-vacation', 'Ashley', 'Vacation', 'staff-ashley', '09:00', '17:00', '09:00', '17:00', 'unavailable'),
  scenario('ashley-lunch', 'Ashley', 'Lunch', 'staff-ashley', '09:00', '17:00', '12:00', '13:00', 'unavailable'),
  scenario('ashley-training', 'Ashley', 'Training', 'staff-ashley', '09:00', '17:00', '14:00', '15:30', 'unavailable'),
  scenario('room-maintenance', 'Room 1', 'Maintenance', 'room-1', '08:00', '18:00', '10:00', '12:00', 'unavailable'),
  scenario('laser-calibration', 'Laser', 'Calibration', 'laser', '08:00', '18:00', '15:00', '16:00', 'unavailable'),
  scenario('ashley-extra', 'Ashley', 'Temporary Extra Hours', 'staff-ashley', '09:00', '17:00', '17:00', '19:00', 'available'),
] as const;

export function AvailabilityExceptionsDemo() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">Scheduling demo</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-jds-950">Availability exceptions</h1>
        <p className="mt-3 text-slate-600">
          Compare normal working hours with temporary unavailable blocks and available extensions.
          Each segment represents a 30-minute candidate slot.
        </p>
      </header>

      <section className="mt-8 overflow-hidden rounded-2xl border border-jds-100 bg-white shadow-sm">
        <div className="hidden grid-cols-[10rem_11rem_1fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <span>Resource</span><span>Exception</span><span>Before</span><span>After</span>
        </div>
        <div className="divide-y divide-slate-200">
          {scenarios.map(({ resource, label, hours, exception }) => {
            const before = available(hours, []);
            const after = available(hours, [exception]);
            return (
              <article key={exception.id} className="grid gap-4 px-4 py-5 sm:px-6 md:grid-cols-[10rem_11rem_1fr_1fr]">
                <div><p className="font-semibold text-jds-950">{resource}</p></div>
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${exception.type === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {label}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">{clock(exception.start)}–{clock(exception.end)}</p>
                </div>
                <SlotBand label="Before" slots={before} />
                <SlotBand label="After" slots={after} />
              </article>
            );
          })}
        </div>
      </section>

      <p className="mt-4 text-sm text-slate-500">Unavailable wins when exceptions overlap; archived exceptions are ignored.</p>
    </main>
  );
}

function SlotBand({ label, slots }: { label: string; slots: TimeInterval[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500 md:hidden">{label}</p>
      <div className="flex min-h-8 flex-wrap gap-1" aria-label={`${label}: ${summarize(slots)}`}>
        {slots.length ? slots.map((slot) => (
          <span key={slot.start} title={`${clock(slot.start)}–${clock(slot.end)}`} className="h-7 w-3 rounded-sm bg-jds-500" />
        )) : <span className="text-sm font-medium text-rose-700">Closed</span>}
      </div>
      <p className="mt-1 text-xs text-slate-500">{summarize(slots)}</p>
    </div>
  );
}

function available(workingHours: WorkingHours[], exceptions: AvailabilityException[]): TimeInterval[] {
  return findAvailableSlotsForDay({
    date, businessId, resourceId: workingHours[0].resourceId, requestedDurationMinutes: 30,
    slotIncrementMinutes: 30, workingHours, existingAppointments: [], availabilityExceptions: exceptions,
  });
}

function scenario(
  id: string, resource: string, label: string, resourceId: string,
  opens: string, closes: string, start: string, end: string,
  type: AvailabilityException['type'],
) {
  const hours: WorkingHours[] = [{
    id: `${id}-hours`, businessId, resourceId, dayOfWeek: 1, enabled: true,
    timeRanges: [{ startTime: opens, endTime: closes }],
  }];
  const exception: AvailabilityException = {
    id, businessId, resourceId, start: `${date}T${start}:00Z`, end: `${date}T${end}:00Z`,
    type, title: label, metadata: {}, active: true,
  };
  return { resource, label, hours, exception };
}

function clock(timestamp: string): string {
  return timestamp.slice(11, 16);
}

function summarize(slots: TimeInterval[]): string {
  if (!slots.length) return 'No availability';
  const groups: TimeInterval[] = [];
  for (const slot of slots) {
    const previous = groups.at(-1);
    if (previous?.end === slot.start) previous.end = slot.end;
    else groups.push({ ...slot });
  }
  return groups.map((group) => `${clock(group.start)}–${clock(group.end)}`).join(', ');
}

export default AvailabilityExceptionsDemo;
