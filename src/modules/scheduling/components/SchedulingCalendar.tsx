import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useMemo } from 'react';

import {
  calendarEventToFullCalendarEvent,
  fullCalendarMoveToEventChange,
  fullCalendarResizeToEventChange,
} from '../adapters/fullcalendar.adapter';
import type { CalendarEvent, CalendarEventChange, TimeRangeSelection } from '../types';

export interface SchedulingCalendarProps {
  events: CalendarEvent[];
  initialView?: 'day' | 'week';
  selectable?: boolean;
  editable?: boolean;
  onTimeRangeSelected?: (selection: TimeRangeSelection) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventMoved?: (change: CalendarEventChange) => void;
  onEventResized?: (change: CalendarEventChange) => void;
}

export function SchedulingCalendar({
  events,
  initialView = 'week',
  selectable = true,
  editable = true,
  onTimeRangeSelected,
  onEventClick,
  onEventMoved,
  onEventResized,
}: SchedulingCalendarProps) {
  const fullCalendarEvents = useMemo(() => events.map(calendarEventToFullCalendarEvent), [events]);
  const eventsById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);

  const handleSelect = (selection: DateSelectArg) => {
    onTimeRangeSelected?.({
      start: selection.start.toISOString(),
      end: selection.end.toISOString(),
      allDay: selection.allDay,
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const event = eventsById.get(arg.event.id);
    if (event) onEventClick?.(event);
  };

  const handleEventDrop = (arg: EventDropArg) => {
    const change = fullCalendarMoveToEventChange(arg);
    if (change) onEventMoved?.(change);
  };

  const handleEventResize = (arg: EventResizeDoneArg) => {
    const change = fullCalendarResizeToEventChange(arg);
    if (change) onEventResized?.(change);
  };

  return (
    <div className="calendar-demo min-w-0 overflow-x-auto" aria-label="Scheduling calendar">
      <div className="min-w-[42rem] md:min-w-0">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView === 'day' ? 'timeGridDay' : 'timeGridWeek'}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek',
          }}
          buttonText={{ day: 'Day', week: 'Week' }}
          events={fullCalendarEvents}
          nowIndicator
          editable={editable}
          eventStartEditable={editable}
          eventDurationEditable={editable}
          selectable={selectable}
          selectMirror
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          height="auto"
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
        />
      </div>
    </div>
  );
}
