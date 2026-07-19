import type { CreatePlanningPeriodInput, PlanningPeriod, PlanningPeriodFilters } from '../types';

export interface PlanningPeriodRepository {
  create(businessId: string, input: CreatePlanningPeriodInput): Promise<PlanningPeriod>;
  updateStatus(businessId: string, id: string, status: PlanningPeriod['status']): Promise<PlanningPeriod>;
  list(businessId: string, filters?: PlanningPeriodFilters): Promise<PlanningPeriod[]>;
  getByMonth(businessId: string, year: number, month: number): Promise<PlanningPeriod | null>;
}

export class InMemoryPlanningPeriodRepository implements PlanningPeriodRepository {
  private readonly periods = new Map<string, PlanningPeriod>();
  constructor(seed: PlanningPeriod[] = []) { for (const period of seed) this.periods.set(this.key(period.businessId, period.year, period.month), { ...period }); }
  async create(businessId: string, input: CreatePlanningPeriodInput): Promise<PlanningPeriod> {
    const key = this.key(businessId, input.year, input.month);
    if (this.periods.has(key)) throw new Error('A planning period already exists for this month.');
    const period = { ...input, id: crypto.randomUUID(), businessId };
    this.periods.set(key, period);
    return { ...period };
  }
  async updateStatus(businessId: string, id: string, status: PlanningPeriod['status']): Promise<PlanningPeriod> {
    const period = [...this.periods.values()].find((item) => item.businessId === businessId && item.id === id);
    if (!period) throw new Error('Planning period not found.');
    const updated = { ...period, status };
    this.periods.set(this.key(businessId, period.year, period.month), updated);
    return { ...updated };
  }
  async list(businessId: string, filters: PlanningPeriodFilters = {}): Promise<PlanningPeriod[]> {
    return [...this.periods.values()].filter((item) => item.businessId === businessId)
      .filter((item) => filters.year === undefined || item.year === filters.year)
      .filter((item) => filters.status === undefined || item.status === filters.status)
      .sort((left, right) => left.year - right.year || left.month - right.month).map((item) => ({ ...item }));
  }
  async getByMonth(businessId: string, year: number, month: number): Promise<PlanningPeriod | null> {
    const period = this.periods.get(this.key(businessId, year, month));
    return period ? { ...period } : null;
  }
  private key(businessId: string, year: number, month: number): string { return `${businessId}:${year}-${month}`; }
}
