import { useEffect, useMemo, useState } from 'react';
import { useApplicationServices } from '../../../app/useApplicationServices';
import { appointmentToCalendarEvent } from '../adapters';
import { SchedulingCalendar } from '../components';
import type { Appointment } from '../types';

export default function CalendarPage() {
  const { businessId, appointments: appointmentService } = useApplicationServices();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  useEffect(() => { void appointmentService.listAppointments(businessId, { active: true }).then(setAppointments); }, [appointmentService, businessId]);
  const events = useMemo(() => appointments.map(appointmentToCalendarEvent), [appointments]);
  return <main className="mx-auto min-h-screen w-full max-w-7xl px-3 py-6 sm:px-6 lg:px-8"><section className="rounded-2xl border border-jds-100 bg-white p-3 shadow-sm sm:p-6"><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-jds-700">Schedule</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-jds-950 sm:text-3xl">Appointment calendar</h1><p className="mt-2 text-slate-600">Review booked appointments and refine the schedule when needed.</p></div><SchedulingCalendar events={events} editable={false} selectable={false} /></section></main>;
}
