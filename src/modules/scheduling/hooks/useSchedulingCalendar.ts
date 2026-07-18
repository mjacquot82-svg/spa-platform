import { useCallback, useState } from 'react';

import type { CalendarEvent, CalendarEventChange, TimeRangeSelection } from '../types';

export function useSchedulingCalendar() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeSelection | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [mostRecentMove, setMostRecentMove] = useState<CalendarEventChange | null>(null);
  const [mostRecentResize, setMostRecentResize] = useState<CalendarEventChange | null>(null);

  const selectTimeRange = useCallback((selection: TimeRangeSelection) => setSelectedTimeRange(selection), []);
  const selectEvent = useCallback((event: CalendarEvent) => setSelectedEvent(event), []);
  const recordMove = useCallback((change: CalendarEventChange) => setMostRecentMove(change), []);
  const recordResize = useCallback((change: CalendarEventChange) => setMostRecentResize(change), []);

  return {
    selectedTimeRange,
    selectedEvent,
    mostRecentMove,
    mostRecentResize,
    selectTimeRange,
    selectEvent,
    recordMove,
    recordResize,
  };
}
