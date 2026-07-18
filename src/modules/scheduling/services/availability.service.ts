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
  const opens = parseClockTime(workingHours.startTime);
  const closes = parseClockTime(workingHours.endTime);
  if (!start || !end || opens === null || closes === null || closes <= opens) return false;
  if (start.offset !== end.offset || start.date !== end.date) return false;

  const dayOfWeek = new Date(`${start.date}T00:00:00Z`).getUTCDay();
  return workingHours.dayOfWeek === dayOfWeek && start.minutes >= opens && end.minutes <= closes;
}

export function hasAppointmentConflict(
  proposed: Pick<Appointment, 'start' | 'end' | 'resourceIds'>,
  existingAppointments: Appointment[],
): boolean {
  return existingAppointments.some(
    (appointment) =>
      appointment.status !== 'cancelled' &&
      appointment.resourceIds.some((id) => proposed.resourceIds.includes(id)) &&
      intervalsOverlap(proposed, appointment),
  );
}

export function hasUnavailableException(
  requested: TimeInterval,
  resourceId: string,
  availabilityExceptions: AvailabilityException[],
): boolean {
  return availabilityExceptions.some(
    (exception) =>
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
  resourceId,
  requestedDurationMinutes,
  slotIncrementMinutes,
  workingHours,
  existingAppointments,
  availabilityExceptions,
}: FindAvailableSlotsForDayInput): TimeInterval[] {
  const calendarDay = dateAndOffset(date);
  if (!calendarDay || requestedDurationMinutes <= 0 || slotIncrementMinutes <= 0) return [];
  const weekday = new Date(`${calendarDay.date}T00:00:00Z`).getUTCDay();
  const hoursForDay = workingHours.filter(
    (hours) => hours.resourceId === resourceId && hours.dayOfWeek === weekday && hours.enabled,
  );
  const slots: TimeInterval[] = [];

  for (const hours of hoursForDay) {
    const opens = parseClockTime(hours.startTime);
    const closes = parseClockTime(hours.endTime);
    if (opens === null || closes === null || closes <= opens) continue;

    for (let startMinutes = opens; startMinutes + requestedDurationMinutes <= closes; startMinutes += slotIncrementMinutes) {
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
        !hasAppointmentConflict(proposed, existingAppointments) &&
        !hasUnavailableException(candidate, resourceId, availabilityExceptions)
      ) {
        slots.push(candidate);
      }
    }
  }

  return slots;
}
