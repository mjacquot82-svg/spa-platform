import { describe, expect, it } from 'vitest';

import { CatalogItemService, InMemoryCatalogItemRepository, type CatalogItem } from '../../catalog';
import { AppointmentService } from './appointment.service';
import { InMemoryAppointmentRepository } from './appointment.repository';
import { AvailabilityExceptionService } from './availability-exception.service';
import { InMemoryAvailabilityExceptionRepository } from './availability-exception.repository';
import { SchedulingResourceService } from './resource.service';
import { InMemorySchedulingResourceRepository } from './resource.repository';
import { SchedulingService } from './scheduling.service';
import { WorkingHoursService } from './working-hours.service';
import { InMemoryWorkingHoursRepository } from './working-hours.repository';

const businessId = 'business-1';
const monday = '2026-07-20';
const base = { businessId, description: '', category: 'Wellness', image: null, active: true, createdAt: monday, updatedAt: monday, deletedAt: null };

function treatment(id: string, durationMinutes: number, bufferBeforeMinutes = 0, bufferAfterMinutes = 0): CatalogItem {
  return { ...base, id, type: 'Service', name: `${durationMinutes} minute treatment`, durationMinutes, bufferBeforeMinutes, bufferAfterMinutes, resourceTypesRequired: ['staff'] };
}

function createScheduling(items: CatalogItem[]) {
  return new SchedulingService(
    new CatalogItemService(new InMemoryCatalogItemRepository(items)),
    new SchedulingResourceService(new InMemorySchedulingResourceRepository([
      { id: 'ashley', businessId, name: 'Ashley', type: 'staff', active: true, metadata: {} },
      { id: 'jordan', businessId, name: 'Jordan', type: 'staff', active: true, metadata: {} },
      { id: 'room', businessId, name: 'Room One', type: 'room', active: true, metadata: {} },
    ])),
    new WorkingHoursService(new InMemoryWorkingHoursRepository([
      { id: 'ashley-hours', businessId, resourceId: 'ashley', dayOfWeek: 1, enabled: true, timeRanges: [{ startTime: '09:00', endTime: '12:00' }] },
      { id: 'jordan-hours', businessId, resourceId: 'jordan', dayOfWeek: 1, enabled: true, timeRanges: [{ startTime: '08:00', endTime: '12:00' }] },
      { id: 'tuesday-hours', businessId, resourceId: 'ashley', dayOfWeek: 2, enabled: true, timeRanges: [{ startTime: '10:00', endTime: '12:00' }] },
    ])),
    new AvailabilityExceptionService(new InMemoryAvailabilityExceptionRepository()),
    new AppointmentService(new InMemoryAppointmentRepository()),
  );
}

describe('SchedulingService.findNextAvailableAppointments', () => {
  it.each([30, 45, 60, 90])('returns suggestions using the catalog duration of %i minutes', async (duration) => {
    const scheduling = createScheduling([treatment(`treatment-${duration}`, duration)]);
    const suggestions = await scheduling.findNextAvailableAppointments({ businessId, catalogItemId: `treatment-${duration}`, preferredDate: monday, numberOfSuggestions: 2 });
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].duration).toBe(duration);
    expect((Date.parse(suggestions[0].end) - Date.parse(suggestions[0].start)) / 60_000).toBe(duration);
  });

  it('searches all eligible providers and returns the earliest first', async () => {
    const scheduling = createScheduling([treatment('massage', 60)]);
    const suggestions = await scheduling.findNextAvailableAppointments({ businessId, catalogItemId: 'massage', preferredDate: monday, numberOfSuggestions: 2 });
    expect(suggestions[0]).toMatchObject({ resource: { id: 'jordan' }, friendlyTime: '8:00 AM', reason: 'Earliest Available' });
    expect(suggestions.every((item) => item.resource.type === 'staff')).toBe(true);
  });

  it('limits searching to the preferred provider', async () => {
    const scheduling = createScheduling([treatment('massage', 60)]);
    const suggestions = await scheduling.findNextAvailableAppointments({ businessId, catalogItemId: 'massage', preferredResourceId: 'ashley', preferredDate: monday, numberOfSuggestions: 2 });
    expect(suggestions.every((item) => item.resource.id === 'ashley')).toBe(true);
    expect(suggestions.every((item) => item.reason === 'Preferred Provider')).toBe(true);
  });

  it('accounts for treatment buffers while returning the treatment interval', async () => {
    const scheduling = createScheduling([treatment('buffered', 60, 15, 15)]);
    const [suggestion] = await scheduling.findNextAvailableAppointments({ businessId, catalogItemId: 'buffered', preferredResourceId: 'ashley', preferredDate: monday, numberOfSuggestions: 1 });
    expect(suggestion.start).toBe('2026-07-20T09:15:00.000Z');
    expect(suggestion.end).toBe('2026-07-20T10:15:00.000Z');
  });

  it('continues into later days instead of stopping at an empty day', async () => {
    const scheduling = createScheduling([treatment('ritual', 90)]);
    const suggestions = await scheduling.findNextAvailableAppointments({ businessId, catalogItemId: 'ritual', preferredResourceId: 'ashley', preferredDate: '2026-07-19', numberOfSuggestions: 1 });
    expect(suggestions[0].dayLabel).toBe('Tomorrow');
    expect(suggestions[0].friendlyDate).toContain('Mon');
  });
});
