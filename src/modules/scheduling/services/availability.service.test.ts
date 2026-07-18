import { describe, expect, it } from 'vitest';

import type { Appointment, AvailabilityException, WorkingHours } from '../types';
import {
  findAvailableSlotsForDay,
  hasAppointmentConflict,
  hasUnavailableException,
  intervalsOverlap,
  isWithinWorkingHours,
} from './availability.service';

const mondayHours: WorkingHours = {
  id: 'monday', businessId: 'business-1', resourceId: 'staff-1', dayOfWeek: 1,
  enabled: true, timeRanges: [{ startTime: '09:00', endTime: '12:00' }],
};

function appointment(
  start: string,
  end: string,
  resourceIds = ['staff-1'],
  status: Appointment['status'] = 'confirmed',
): Appointment {
  return {
    id: `${start}-${resourceIds.join()}`, businessId: 'business-1', customerId: 'customer-1',
    catalogItemId: 'service-1', resourceIds, start, end, status, notes: '', metadata: {}, active: true,
  };
}

describe('intervalsOverlap', () => {
  it('detects overlapping appointments', () => {
    expect(intervalsOverlap(
      { start: '2026-07-20T09:00:00Z', end: '2026-07-20T10:00:00Z' },
      { start: '2026-07-20T09:30:00Z', end: '2026-07-20T10:30:00Z' },
    )).toBe(true);
  });

  it('allows back-to-back appointments', () => {
    expect(intervalsOverlap(
      { start: '2026-07-20T09:00:00Z', end: '2026-07-20T10:00:00Z' },
      { start: '2026-07-20T10:00:00Z', end: '2026-07-20T11:00:00Z' },
    )).toBe(false);
  });

  it('rejects zero-length and backwards intervals', () => {
    const valid = { start: '2026-07-20T10:00:00Z', end: '2026-07-20T11:00:00Z' };
    expect(intervalsOverlap({ start: valid.start, end: valid.start }, valid)).toBe(false);
    expect(intervalsOverlap({ start: valid.end, end: valid.start }, valid)).toBe(false);
  });
});

describe('isWithinWorkingHours', () => {
  it('accepts exact opening and closing boundaries', () => {
    expect(isWithinWorkingHours(
      { start: '2026-07-20T09:00:00Z', end: '2026-07-20T12:00:00Z' }, mondayHours,
    )).toBe(true);
  });

  it('rejects a disabled working day', () => {
    expect(isWithinWorkingHours(
      { start: '2026-07-20T09:00:00Z', end: '2026-07-20T10:00:00Z' },
      { ...mondayHours, enabled: false },
    )).toBe(false);
  });
});

describe('availability blockers', () => {
  const proposed = appointment('2026-07-20T09:00:00Z', '2026-07-20T10:00:00Z');

  it('conflicts only for shared resources', () => {
    expect(hasAppointmentConflict(proposed, [appointment('2026-07-20T09:30:00Z', '2026-07-20T10:30:00Z', ['room-1'])])).toBe(false);
    expect(hasAppointmentConflict(proposed, [appointment('2026-07-20T09:30:00Z', '2026-07-20T10:30:00Z')])).toBe(true);
  });

  it('does not let cancelled appointments block availability', () => {
    expect(hasAppointmentConflict(proposed, [appointment('2026-07-20T09:30:00Z', '2026-07-20T10:30:00Z', ['staff-1'], 'cancelled')])).toBe(false);
  });

  it('detects overlapping unavailable exceptions for the resource', () => {
    const exceptions: AvailabilityException[] = [{
      id: 'break', businessId: 'business-1', resourceId: 'staff-1', start: '2026-07-20T09:30:00Z',
      end: '2026-07-20T10:30:00Z', type: 'unavailable', title: 'Break', metadata: {}, active: true,
    }];
    expect(hasUnavailableException(proposed, 'staff-1', exceptions)).toBe(true);
    expect(hasUnavailableException(proposed, 'staff-2', exceptions)).toBe(false);
  });
});

describe('findAvailableSlotsForDay', () => {
  function find(duration: number, increment = 30, endTime = '12:00') {
    return findAvailableSlotsForDay({
      date: '2026-07-20T00:00:00Z', businessId: 'business-1', resourceId: 'staff-1',
      requestedDurationMinutes: duration, slotIncrementMinutes: increment,
      workingHours: [{ ...mondayHours, timeRanges: [{ startTime: '09:00', endTime }] }], existingAppointments: [], availabilityExceptions: [],
    });
  }

  it('finds 30-minute slots', () => {
    expect(find(30)).toHaveLength(6);
  });

  it('finds 45-minute slots without crossing closing time', () => {
    const slots = find(45);
    expect(slots).toHaveLength(5);
    expect(slots.at(-1)?.end).toBe('2026-07-20T11:45:00Z');
  });

  it('finds 90-minute slots', () => {
    expect(find(90).map((slot) => slot.start)).toEqual([
      '2026-07-20T09:00:00Z', '2026-07-20T09:30:00Z',
      '2026-07-20T10:00:00Z', '2026-07-20T10:30:00Z',
    ]);
  });

  it('supports 15-minute increments', () => {
    expect(find(30, 15, '10:00')).toHaveLength(3);
  });

  it('excludes appointments and unavailable exceptions while allowing touching boundaries', () => {
    const slots = findAvailableSlotsForDay({
      date: '2026-07-20', businessId: 'business-1', resourceId: 'staff-1', requestedDurationMinutes: 30,
      slotIncrementMinutes: 30, workingHours: [{ ...mondayHours, timeRanges: [{ startTime: '09:00', endTime: '11:00' }] }],
      existingAppointments: [appointment('2026-07-20T09:30:00Z', '2026-07-20T10:00:00Z')],
      availabilityExceptions: [{ id: 'break', businessId: 'business-1', resourceId: 'staff-1', start: '2026-07-20T10:30:00Z', end: '2026-07-20T11:00:00Z', type: 'unavailable', title: 'Break', metadata: {}, active: true }],
    });
    expect(slots).toEqual([
      { start: '2026-07-20T09:00:00Z', end: '2026-07-20T09:30:00Z' },
      { start: '2026-07-20T10:00:00Z', end: '2026-07-20T10:30:00Z' },
    ]);
  });
});
