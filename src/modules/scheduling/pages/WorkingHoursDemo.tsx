import { useState } from 'react';

import { useWorkingHours } from '../hooks';
import { InMemoryWorkingHoursRepository, WorkingHoursService } from '../services';
import type { WorkingHours } from '../types';

const businessId = 'demo-business';
const resources = [
  { id: 'staff-avery', name: 'Avery Chen' },
  { id: 'room-serenity', name: 'Serenity Room' },
] as const;
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const seed: WorkingHours[] = [
  day('avery-sun', 'staff-avery', 0, false, []),
  day('avery-mon', 'staff-avery', 1, true, [['09:00', '12:00'], ['13:00', '17:00']]),
  day('avery-tue', 'staff-avery', 2, true, [['09:00', '12:00'], ['13:00', '17:00']]),
  day('avery-wed', 'staff-avery', 3, false, []),
  day('avery-thu', 'staff-avery', 4, true, [['10:00', '14:00'], ['15:00', '18:00']]),
  day('avery-fri', 'staff-avery', 5, true, [['09:00', '15:00']]),
  day('avery-sat', 'staff-avery', 6, false, []),
  day('room-sun', 'room-serenity', 0, false, []),
  day('room-mon', 'room-serenity', 1, true, [['08:00', '18:00']]),
  day('room-tue', 'room-serenity', 2, true, [['08:00', '18:00']]),
  day('room-wed', 'room-serenity', 3, true, [['08:00', '18:00']]),
  day('room-thu', 'room-serenity', 4, true, [['08:00', '18:00']]),
  day('room-fri', 'room-serenity', 5, true, [['08:00', '18:00']]),
  day('room-sat', 'room-serenity', 6, true, [['10:00', '16:00']]),
];

const workingHoursService = new WorkingHoursService(new InMemoryWorkingHoursRepository(seed));

export function WorkingHoursDemo() {
  const [resourceId, setResourceId] = useState(resources[0].id as string);
  const { data, loading, error } = useWorkingHours(workingHoursService, businessId, { resourceId });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">Provider hours</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-jds-950">Weekly working hours</h1>
        <p className="mt-3 text-slate-600">Recurring weekly schedules with split time ranges and disabled days.</p>
      </header>

      <section className="mt-8 rounded-2xl border border-jds-100 bg-white p-4 shadow-sm sm:p-6">
        <label className="block text-sm font-medium text-slate-700" htmlFor="working-hours-resource">Resource</label>
        <select
          id="working-hours-resource"
          value={resourceId}
          onChange={(event) => setResourceId(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 sm:max-w-sm"
        >
          {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
        </select>

        {loading && <p className="mt-6 text-sm text-slate-600" role="status">Loading schedule…</p>}
        {error && <p className="mt-6 text-sm text-red-700" role="alert">{error.message}</p>}
        {!loading && !error && (
          <ol className="mt-6 divide-y divide-slate-200">
            {data.map((schedule) => (
              <li key={schedule.id} className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr] sm:items-start">
                <div>
                  <p className="font-medium text-slate-900">{dayNames[schedule.dayOfWeek]}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${schedule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {schedule.enabled ? 'Enabled' : 'Closed'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {schedule.enabled && schedule.timeRanges.map((range) => (
                    <span key={`${range.startTime}-${range.endTime}`} className="rounded-lg bg-jds-100 px-3 py-2 text-sm font-medium text-jds-900">
                      {formatTime(range.startTime)}–{formatTime(range.endTime)}
                    </span>
                  ))}
                  {!schedule.enabled && <span className="py-2 text-sm text-slate-500">No working ranges</span>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function day(
  id: string,
  resourceId: string,
  dayOfWeek: number,
  enabled: boolean,
  ranges: Array<[string, string]>,
): WorkingHours {
  return {
    id, businessId, resourceId, dayOfWeek, enabled,
    timeRanges: ranges.map(([startTime, endTime]) => ({ startTime, endTime })),
  };
}

function formatTime(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export default WorkingHoursDemo;
