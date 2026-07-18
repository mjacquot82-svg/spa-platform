import type { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';

function dateInCurrentWeek(dayOffset: number, hour: number, minute = 0) {
  const date = new Date();
  const mondayOffset = (date.getDay() + 6) % 7;

  date.setDate(date.getDate() - mondayOffset + dayOffset);
  date.setHours(hour, minute, 0, 0);

  return date;
}

const sampleAppointments: EventInput[] = [
  {
    id: 'appointment-1',
    title: 'Swedish Massage · Avery',
    start: dateInCurrentWeek(0, 9),
    end: dateInCurrentWeek(0, 10),
    color: '#315c49',
  },
  {
    id: 'appointment-2',
    title: 'Facial Consultation · Jordan',
    start: dateInCurrentWeek(1, 11, 30),
    end: dateInCurrentWeek(1, 12, 15),
    color: '#4f7664',
  },
  {
    id: 'appointment-3',
    title: 'Deep Tissue Massage · Morgan',
    start: dateInCurrentWeek(2, 14),
    end: dateInCurrentWeek(2, 15, 30),
    color: '#715a9a',
  },
  {
    id: 'appointment-4',
    title: 'Manicure · Riley',
    start: dateInCurrentWeek(3, 10),
    end: dateInCurrentWeek(3, 10, 45),
    color: '#9a5a69',
  },
  {
    id: 'appointment-5',
    title: 'Wellness Package · Casey',
    start: dateInCurrentWeek(4, 13),
    end: dateInCurrentWeek(4, 15),
    color: '#876923',
  },
];

export function CalendarDemo() {
  // Future Business integration: scope the calendar to the active business and location.
  // Future Customers integration: resolve appointment attendees and customer details.
  // Future Catalog integration: display service names, durations, resources, and colors.
  // Future Booking integration: load and persist appointment selections, moves, and resizes.
  // Future Notifications integration: trigger reminders after booking changes are persisted.
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
            Select open time slots, or drag and resize the sample appointments to evaluate
            calendar interactions.
          </p>
        </div>

        <div className="calendar-demo min-w-0 overflow-x-auto">
          <div className="min-w-[42rem] md:min-w-0">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridDay,timeGridWeek',
              }}
              buttonText={{ day: 'Day', week: 'Week' }}
              initialEvents={sampleAppointments}
              nowIndicator
              editable
              eventStartEditable
              eventDurationEditable
              selectable
              selectMirror
              allDaySlot={false}
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              height="auto"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default CalendarDemo;
