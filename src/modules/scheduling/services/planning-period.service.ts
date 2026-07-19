import { PLANNING_PERIOD_STATUSES, type CreatePlanningPeriodInput, type PlanningPeriod, type PlanningPeriodFilters, type PlanningPeriodStatus } from '../types';
import type { PlanningPeriodRepository } from './planning-period.repository';

export class PlanningPeriodService {
  constructor(private readonly repository: PlanningPeriodRepository) {}
  createPeriod(businessId: string, input: CreatePlanningPeriodInput): Promise<PlanningPeriod> {
    validatePeriod(input.year, input.month); validateStatus(input.status);
    return this.repository.create(requireId(businessId), input);
  }
  listPeriods(businessId: string, filters?: PlanningPeriodFilters): Promise<PlanningPeriod[]> { return this.repository.list(requireId(businessId), filters); }
  getPeriod(businessId: string, year: number, month: number): Promise<PlanningPeriod | null> { validatePeriod(year, month); return this.repository.getByMonth(requireId(businessId), year, month); }
  async publishPeriod(businessId: string, year: number, month: number): Promise<PlanningPeriod> {
    const period = await this.requirePeriod(businessId, year, month);
    if (period.status === 'archived') throw new Error('Archived schedules cannot be published.');
    if (period.status === 'published') return period;
    return this.repository.updateStatus(requireId(businessId), period.id, 'published');
  }
  async archivePeriod(businessId: string, year: number, month: number): Promise<PlanningPeriod> {
    const period = await this.requirePeriod(businessId, year, month);
    if (period.status === 'archived') return period;
    return this.repository.updateStatus(requireId(businessId), period.id, 'archived');
  }
  async isDatePublished(businessId: string, date: string): Promise<boolean> {
    const parsed = parseDate(date);
    return (await this.repository.getByMonth(requireId(businessId), parsed.year, parsed.month))?.status === 'published';
  }
  private async requirePeriod(businessId: string, year: number, month: number): Promise<PlanningPeriod> {
    const period = await this.getPeriod(businessId, year, month);
    if (!period) throw new Error('Planning period not found.');
    return period;
  }
}

function validatePeriod(year: number, month: number): void { if (!Number.isInteger(year) || year < 2000 || year > 9999) throw new TypeError('year must be valid.'); if (!Number.isInteger(month) || month < 1 || month > 12) throw new TypeError('month must be between 1 and 12.'); }
function validateStatus(status: PlanningPeriodStatus): void { if (!PLANNING_PERIOD_STATUSES.includes(status)) throw new TypeError('status must be draft, published, or archived.'); }
function parseDate(value: string): { year: number; month: number } { const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value); if (!match) throw new TypeError('date must be ISO formatted.'); const result = { year: Number(match[1]), month: Number(match[2]) }; validatePeriod(result.year, result.month); return result; }
function requireId(value: string): string { if (!value.trim()) throw new TypeError('businessId is required.'); return value.trim(); }
