import type { EventDropArg } from '@fullcalendar/core';
import type { EventInput } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';

import type { Appointment, CalendarEvent, CalendarEventChange } from '../types';

export function appointmentToCalendarEvent(appointment: Appointment): CalendarEvent {
  return {
    id: appointment.id,
    title: appointment.title,
    start: appointment.start,
    end: appointment.end,
    resourceIds: appointment.resourceIds,
    editable: appointment.status !== 'cancelled' && appointment.status !== 'completed',
    metadata: { appointmentStatus: appointment.status },
  };
}

export function calendarEventToFullCalendarEvent(event: CalendarEvent): EventInput {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    editable: event.editable,
    extendedProps: {
      resourceIds: event.resourceIds,
      metadata: event.metadata,
    },
  };
}

function toEventChange(
  oldEvent: EventDropArg['oldEvent'],
  event: EventDropArg['event'],
): CalendarEventChange | null {
  if (!oldEvent.start || !oldEvent.end || !event.start || !event.end) return null;

  return {
    eventId: event.id,
    oldStart: oldEvent.start.toISOString(),
    oldEnd: oldEvent.end.toISOString(),
    newStart: event.start.toISOString(),
    newEnd: event.end.toISOString(),
  };
}

export function fullCalendarMoveToEventChange(arg: EventDropArg): CalendarEventChange | null {
  return toEventChange(arg.oldEvent, arg.event);
}

export function fullCalendarResizeToEventChange(
  arg: EventResizeDoneArg,
): CalendarEventChange | null {
  return toEventChange(arg.oldEvent, arg.event);
}
