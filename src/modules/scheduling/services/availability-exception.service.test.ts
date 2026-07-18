import { describe, expect, it } from 'vitest';

import type { AvailabilityException, CreateAvailabilityExceptionInput, WorkingHours } from '../types';
import { AvailabilityExceptionValidationError } from '../types';
import { InMemoryAvailabilityExceptionRepository } from './availability-exception.repository';
import { AvailabilityExceptionService } from './availability-exception.service';
import { findAvailableSlotsForDay } from './availability.service';

const businessId = 'business-1';
const mondayHours: WorkingHours[] = [{
  id: 'hours', businessId, resourceId: 'ashley', dayOfWeek: 1, enabled: true,
  timeRanges: [{ startTime: '09:00', endTime: '12:00' }],
}];

function exception(
  id: string,
  start: string,
  end: string,
  type: AvailabilityException['type'],
  active = true,
  resourceId = 'ashley',
): AvailabilityException {
  return { id, businessId, resourceId, start, end, type, title: id, metadata: {}, active };
}

function slots(exceptions: AvailabilityException[]) {
  return findAvailableSlotsForDay({
    date: '2026-07-20', businessId, resourceId: 'ashley', requestedDurationMinutes: 30,
    slotIncrementMinutes: 30, workingHours: mondayHours, existingAppointments: [],
    availabilityExceptions: exceptions,
  });
}

describe('availability exception engine integration', () => {
  it('lets unavailable exceptions override working hours', () => {
    expect(slots([exception('lunch', '2026-07-20T10:00:00Z', '2026-07-20T11:00:00Z', 'unavailable')]))
      .toHaveLength(4);
  });

  it('lets available exceptions extend working hours', () => {
    const result = slots([exception('extra', '2026-07-20T12:00:00Z', '2026-07-20T13:00:00Z', 'available')]);
    expect(result).toHaveLength(8);
    expect(result.at(-1)?.end).toBe('2026-07-20T13:00:00Z');
  });

  it('gives overlapping unavailable exceptions precedence and does not duplicate slots', () => {
    const result = slots([
      exception('extra', '2026-07-20T11:30:00Z', '2026-07-20T13:00:00Z', 'available'),
      exception('closure', '2026-07-20T12:00:00Z', '2026-07-20T12:30:00Z', 'unavailable'),
    ]);
    expect(result.filter((slot) => slot.start === '2026-07-20T11:30:00Z')).toHaveLength(1);
    expect(result.some((slot) => slot.start === '2026-07-20T12:00:00Z')).toBe(false);
  });

  it('ignores archived exceptions', () => {
    expect(slots([exception('archived', '2026-07-20T09:00:00Z', '2026-07-20T12:00:00Z', 'unavailable', false)]))
      .toHaveLength(6);
  });

  it('ignores exceptions and working hours from other businesses', () => {
    const otherBusinessException = {
      ...exception('other-business', '2026-07-20T09:00:00Z', '2026-07-20T12:00:00Z', 'unavailable'),
      businessId: 'business-2',
    };
    expect(slots([otherBusinessException])).toHaveLength(6);
  });
});

describe('AvailabilityExceptionService', () => {
  const input: CreateAvailabilityExceptionInput = {
    resourceId: 'ashley', start: '2026-07-20T09:00:00Z', end: '2026-07-20T10:00:00Z',
    type: 'unavailable', title: 'Training', metadata: {}, active: true,
  };

  it('rejects invalid intervals', () => {
    const service = new AvailabilityExceptionService(new InMemoryAvailabilityExceptionRepository());
    expect(() => service.createException(businessId, { ...input, end: input.start }))
      .toThrow(AvailabilityExceptionValidationError);
  });

  it('requires a business scope', () => {
    const service = new AvailabilityExceptionService(new InMemoryAvailabilityExceptionRepository());
    expect(() => service.createException(' ', input)).toThrow('businessId is required');
  });

  it('scopes every read and write by business', async () => {
    const seeded = exception('shared-id', input.start, input.end, 'unavailable');
    const service = new AvailabilityExceptionService(new InMemoryAvailabilityExceptionRepository([seeded]));
    expect(await service.getException('business-2', seeded.id)).toBeNull();
    expect(await service.listExceptions('business-2')).toEqual([]);
    await expect(service.updateException('business-2', seeded.id, { title: 'Changed' })).rejects.toThrow('not found');
  });

  it('supports multiple exceptions for one resource and archive/restore', async () => {
    const service = new AvailabilityExceptionService(new InMemoryAvailabilityExceptionRepository());
    const first = await service.createException(businessId, input);
    await service.createException(businessId, { ...input, title: 'Vacation', start: '2026-07-21T09:00:00Z', end: '2026-07-21T17:00:00Z' });
    expect(await service.listExceptionsForResource(businessId, 'ashley')).toHaveLength(2);
    expect((await service.archiveException(businessId, first.id)).active).toBe(false);
    expect((await service.restoreException(businessId, first.id)).active).toBe(true);
  });
});
