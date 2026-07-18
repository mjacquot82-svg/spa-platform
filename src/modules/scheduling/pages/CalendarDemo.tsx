import { useState } from 'react';

import { appointmentToCalendarEvent } from '../adapters';
import { SchedulingCalendar } from '../components';
import { useSchedulingCalendar } from '../hooks';
import type { Appointment, CalendarEventChange } from '../types';

function dateInCurrentWeek(dayOffset: number, hour: number, minute = 0): string {
  const date = new Date();
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset + dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

const sampleAppointments: Appointment[] = [
  {
    id: 'appointment-1', businessId: 'demo-business', customerId: 'customer-1',
    catalogItemId: 'swedish-massage', resourceIds: ['avery'], start: dateInCurrentWeek(0, 9),
    end: dateInCurrentWeek(0, 10), status: 'confirmed', notes: '', active: true,
    metadata: { title: 'Swedish Massage · Avery' },
  },
  {
    id: 'appointment-2', businessId: 'demo-business', customerId: 'customer-2',
    catalogItemId: 'facial-consultation', resourceIds: ['jordan'], start: dateInCurrentWeek(1, 11, 30),
    end: dateInCurrentWeek(1, 12, 15), status: 'tentative', notes: '', active: true,
    metadata: { title: 'Facial Consultation · Jordan' },
  },
  {
    id: 'appointment-3', businessId: 'demo-business', customerId: 'customer-3',
    catalogItemId: 'deep-tissue', resourceIds: ['morgan'], start: dateInCurrentWeek(2, 14),
    end: dateInCurrentWeek(2, 15, 30), status: 'confirmed', notes: '', active: true,
    metadata: { title: 'Deep Tissue Massage · Morgan' },
  },
  {
    id: 'appointment-4', businessId: 'demo-business', customerId: 'customer-4',
    catalogItemId: 'manicure', resourceIds: ['riley'], start: dateInCurrentWeek(3, 10),
    end: dateInCurrentWeek(3, 10, 45), status: 'checked_in', notes: '', active: true,
    metadata: { title: 'Manicure · Riley' },
  },
  {
    id: 'appointment-5', businessId: 'demo-business', customerId: 'customer-5',
    catalogItemId: 'wellness-package', resourceIds: ['casey'], start: dateInCurrentWeek(4, 13),
    end: dateInCurrentWeek(4, 15), status: 'confirmed', notes: '', active: true,
    metadata: { title: 'Wellness Package · Casey' },
  },
];

function DebugValue({ value }: { value: unknown }) {
  return (
    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs text-slate-600">
      {value ? JSON.stringify(value, null, 2) : 'None yet'}
    </pre>
  );
}

export function CalendarDemo() {
  const [events, setEvents] = useState(() => sampleAppointments.map(appointmentToCalendarEvent));
  const calendar = useSchedulingCalendar();

  const updateEvent = (change: CalendarEventChange) => {
    setEvents((current) => current.map((event) => event.id === change.eventId
      ? { ...event, start: change.newStart, end: change.newEnd }
      : event));
  };

  const handleMove = (change: CalendarEventChange) => {
    updateEvent(change);
    calendar.recordMove(change);
  };

  const handleResize = (change: CalendarEventChange) => {
    updateEvent(change);
    calendar.recordResize(change);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-3 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-jds-100 bg-white p-3 shadow-sm sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">
            Scheduling demo
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-jds-950 sm:text-3xl">
            Appointment calendar
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Select open time slots, or drag, resize, and click the five sample appointments.
          </p>
        </div>

        <SchedulingCalendar
          events={events}
          onTimeRangeSelected={calendar.selectTimeRange}
          onEventClick={calendar.selectEvent}
          onEventMoved={handleMove}
          onEventResized={handleResize}
        />

        <section className="mt-6" aria-labelledby="calendar-debug-heading">
          <h2 id="calendar-debug-heading" className="text-sm font-semibold text-jds-950">
            Neutral callback data
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              ['Selected time range', calendar.selectedTimeRange],
              ['Clicked event', calendar.selectedEvent],
              ['Moved event', calendar.mostRecentMove],
              ['Resized event', calendar.mostRecentResize],
            ].map(([label, value]) => (
              <article key={label as string} className="min-w-0 rounded-xl bg-slate-50 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">{label as string}</h3>
                <DebugValue value={value} />
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default CalendarDemo;
