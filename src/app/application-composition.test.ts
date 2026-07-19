import { describe, expect, it } from 'vitest';
import { createApplicationServices, type ApplicationSeed } from './application-composition';

const businessId = 'composition-test';
function seed(status: 'draft' | 'published' | 'archived'): ApplicationSeed {
  return {
    catalogItems: [{ id: 'massage', businessId, type: 'Service', name: 'Massage', description: '', category: '', image: null, active: true, durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, resourceTypesRequired: ['staff'], createdAt: '2026-09-01', updatedAt: '2026-09-01', deletedAt: null }],
    resources: [{ id: 'michelle', businessId, name: 'Michelle', type: 'staff', active: true, metadata: {} }],
    workingHours: Array.from({ length: 7 }, (_, dayOfWeek) => ({ id: `hours-${dayOfWeek}`, businessId, resourceId: 'michelle', dayOfWeek, enabled: true, timeRanges: [{ startTime: '09:00', endTime: '12:00' }] })),
    planningPeriods: [{ id: 'september', businessId, year: 2026, month: 9, status }],
  };
}

describe('application composition publication integration', () => {
  it('shares publication state so Booking suggestions appear immediately after publish', async () => {
    const application = createApplicationServices(businessId, seed('draft'));
    const request = { businessId, catalogItemId: 'massage', preferredDate: '2026-09-01', numberOfSuggestions: 1 };
    expect(await application.scheduling.findNextAvailableAppointments(request)).toEqual([]);
    await application.planningPeriods.publishPeriod(businessId, 2026, 9);
    expect(await application.scheduling.findNextAvailableAppointments(request)).toHaveLength(1);
  });

  it('never exposes suggestions from an archived period', async () => {
    const application = createApplicationServices(businessId, seed('archived'));
    expect(await application.scheduling.findNextAvailableAppointments({ businessId, catalogItemId: 'massage', preferredDate: '2026-09-01', numberOfSuggestions: 1 })).toEqual([]);
  });
});
