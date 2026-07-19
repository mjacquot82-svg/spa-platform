export const PLANNING_PERIOD_STATUSES = ['draft', 'published', 'archived'] as const;
export type PlanningPeriodStatus = (typeof PLANNING_PERIOD_STATUSES)[number];

export interface PlanningPeriod {
  id: string;
  businessId: string;
  month: number;
  year: number;
  status: PlanningPeriodStatus;
}

export type CreatePlanningPeriodInput = Omit<PlanningPeriod, 'id' | 'businessId'>;
export interface PlanningPeriodFilters { year?: number; status?: PlanningPeriodStatus }
