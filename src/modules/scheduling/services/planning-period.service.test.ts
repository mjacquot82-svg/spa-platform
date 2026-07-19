import { describe, expect, it } from 'vitest';
import { InMemoryPlanningPeriodRepository } from './planning-period.repository';
import { PlanningPeriodService } from './planning-period.service';

describe('PlanningPeriodService', () => {
  it('publishes a draft period and exposes its dates as bookable', async () => {
    const service = new PlanningPeriodService(new InMemoryPlanningPeriodRepository([
      { id: 'september', businessId: 'business-1', year: 2026, month: 9, status: 'draft' },
    ]));
    expect(await service.isDatePublished('business-1', '2026-09-15')).toBe(false);
    await service.publishPeriod('business-1', 2026, 9);
    expect(await service.isDatePublished('business-1', '2026-09-15')).toBe(true);
  });

  it('does not allow archived schedules to be republished', async () => {
    const service = new PlanningPeriodService(new InMemoryPlanningPeriodRepository([
      { id: 'july', businessId: 'business-1', year: 2026, month: 7, status: 'archived' },
    ]));
    await expect(service.publishPeriod('business-1', 2026, 7)).rejects.toThrow('Archived');
  });
});
