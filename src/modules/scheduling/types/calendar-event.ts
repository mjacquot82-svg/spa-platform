export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  resourceIds?: string[];
  editable?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TimeRangeSelection {
  start: string;
  end: string;
  allDay: boolean;
}

export interface CalendarEventChange {
  eventId: string;
  oldStart: string;
  oldEnd: string;
  newStart: string;
  newEnd: string;
}
