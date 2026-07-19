import type {
  Appointment,
  AvailabilityException,
  FindAvailableSlotsForDayInput,
  TimeInterval,
  WorkingHours,
} from '../types';

const ISO_WALL_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK_TIME = /^(\d{2}):(\d{2})$/;

interface WallTimestamp {
  date: string;
  minutes: number;
  offset: string;
}

function parseWallTimestamp(value: string): WallTimestamp | null {
  const match = ISO_WALL_TIME.exec(value);
  if (!match) return null;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  if (hours > 23 || minutes > 59) return null;
  return { date: match[1], minutes: hours * 60 + minutes, offset: match[4] };
}

function parseClockTime(value: string): number | null {
  const match = CLOCK_TIME.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function validInterval(interval: TimeInterval): boolean {
  const start = Date.parse(interval.start);
  const end = Date.parse(interval.end);
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

/**
 * Tests half-open intervals [start, end). Touching boundaries do not overlap.
 * Invalid or zero-length intervals are rejected and return false.
 */
export function intervalsOverlap(first: TimeInterval, second: TimeInterval): boolean {
  if (!validInterval(first) || !validInterval(second)) return false;
  return Date.parse(first.start) < Date.parse(second.end) && Date.parse(second.start) < Date.parse(first.end);
}

/** Returns the whole-minute duration of a valid interval, or null for invalid input. */
export function intervalDurationMinutes(interval: TimeInterval): number | null {
  if (!validInterval(interval)) return null;
  const milliseconds = Date.parse(interval.end) - Date.parse(interval.start);
  return milliseconds % 60_000 === 0 ? milliseconds / 60_000 : null;
}

/**
 * Uses the calendar date and wall-clock values encoded in the ISO strings. Both
 * timestamps must carry the same explicit offset and remain on one calendar day.
 */
export function isWithinWorkingHours(
  requested: TimeInterval,
  workingHours: WorkingHours,
): boolean {
  if (!workingHours.enabled || !validInterval(requested)) return false;
  const start = parseWallTimestamp(requested.start);
  const end = parseWallTimestamp(requested.end);
  if (!start || !end) return false;
  if (start.offset !== end.offset || start.date !== end.date) return false;

  const dayOfWeek = new Date(`${start.date}T00:00:00Z`).getUTCDay();
  return workingHours.dayOfWeek === dayOfWeek && workingHours.timeRanges.some((range) => {
    const opens = parseClockTime(range.startTime);
    const closes = parseClockTime(range.endTime);
    return opens !== null && closes !== null && closes > opens &&
      start.minutes >= opens && end.minutes <= closes;
  });
}

export function hasAppointmentConflict(
  proposed: Pick<Appointment, 'start' | 'end' | 'resourceIds'>,
  existingAppointments: Appointment[],
  businessId?: string,
): boolean {
  return existingAppointments.some(
    (appointment) =>
      appointment.active &&
      (businessId === undefined || appointment.businessId === businessId) &&
      appointment.status !== 'cancelled' &&
      appointment.status !== 'no_show' &&
      appointment.resourceIds.some((id) => proposed.resourceIds.includes(id)) &&
      intervalsOverlap(proposed, appointment),
  );
}

export function hasUnavailableException(
  requested: TimeInterval,
  resourceId: string,
  availabilityExceptions: AvailabilityException[],
  businessId?: string,
): boolean {
  return availabilityExceptions.some(
    (exception) =>
      exception.active &&
      (businessId === undefined || exception.businessId === businessId) &&
      exception.resourceId === resourceId &&
      exception.type === 'unavailable' &&
      intervalsOverlap(requested, exception),
  );
}

function slotTimestamp(date: string, minutes: number, offset: string): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${date}T${hours}:${mins}:00${offset}`;
}

function dateAndOffset(value: string): { date: string; offset: string } | null {
  if (DATE_ONLY.test(value)) return { date: value, offset: 'Z' };
  const parsed = parseWallTimestamp(value);
  return parsed ? { date: parsed.date, offset: parsed.offset } : null;
}

/**
 * Generates slots in the offset encoded by `date`. A YYYY-MM-DD input is
 * explicitly treated as UTC. This initial implementation does not model DST.
 * TODO: Require a business IANA timezone before production scheduling.
 */
export function findAvailableSlotsForDay({
  date,
  businessId,
  resourceId,
  requestedDurationMinutes,
  slotIncrementMinutes,
  excludeAppointmentId,
  workingHours,
  existingAppointments,
  availabilityExceptions,
}: FindAvailableSlotsForDayInput): TimeInterval[] {
  const calendarDay = dateAndOffset(date);
  if (!calendarDay || !businessId.trim() || requestedDurationMinutes <= 0 || slotIncrementMinutes <= 0) return [];
  const weekday = new Date(`${calendarDay.date}T00:00:00Z`).getUTCDay();
  const hoursForDay = workingHours.filter(
    (hours) => hours.businessId === businessId && hours.resourceId === resourceId &&
      hours.dayOfWeek === weekday && hours.enabled,
  );
  const activeExceptions = availabilityExceptions.filter(
    (exception) => exception.businessId === businessId && exception.active && exception.resourceId === resourceId,
  );
  const blockingAppointments = excludeAppointmentId
    ? existingAppointments.filter((appointment) => appointment.id !== excludeAppointmentId)
    : existingAppointments;
  const candidateRanges: Array<{ start: number; end: number }> = [];

  for (const hours of hoursForDay) {
    for (const range of hours.timeRanges) {
      const start = parseClockTime(range.startTime);
      const end = parseClockTime(range.endTime);
      if (start !== null && end !== null && end > start) candidateRanges.push({ start, end });
    }
  }

  for (const exception of activeExceptions) {
    if (exception.type !== 'available') continue;
    const start = parseWallTimestamp(exception.start);
    const end = parseWallTimestamp(exception.end);
    if (!start || !end || start.date !== calendarDay.date || end.date !== calendarDay.date ||
        start.offset !== calendarDay.offset || end.offset !== calendarDay.offset || end.minutes <= start.minutes) continue;
    candidateRanges.push({ start: start.minutes, end: end.minutes });
  }
  const mergedRanges = mergeRanges(candidateRanges);
  const slots: TimeInterval[] = [];
  const seen = new Set<string>();

  for (const range of mergedRanges) {
      for (let startMinutes = range.start; startMinutes + requestedDurationMinutes <= range.end; startMinutes += slotIncrementMinutes) {
        const candidate = {
          start: slotTimestamp(calendarDay.date, startMinutes, calendarDay.offset),
          end: slotTimestamp(
            calendarDay.date,
            startMinutes + requestedDurationMinutes,
            calendarDay.offset,
          ),
        };
        const proposed = { ...candidate, resourceIds: [resourceId] };
        if (
          !hasAppointmentConflict(proposed, blockingAppointments, businessId) &&
          !hasUnavailableException(candidate, resourceId, activeExceptions, businessId) &&
          !seen.has(`${candidate.start}/${candidate.end}`)
        ) {
          slots.push(candidate);
          seen.add(`${candidate.start}/${candidate.end}`);
        }
      }
  }

  return slots.sort((left, right) => left.start.localeCompare(right.start));
}

function mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  const sorted = ranges.map((range) => ({ ...range })).sort((left, right) => left.start - right.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push(range);
  }
  return merged;
}
