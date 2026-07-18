import type {
  CreateWorkingHoursInput,
  UpdateWorkingHoursInput,
  WorkingHours,
  WorkingHoursFilters,
} from '../types';

export interface WorkingHoursRepository {
  create(businessId: string, input: CreateWorkingHoursInput): Promise<WorkingHours>;
  update(businessId: string, id: string, input: UpdateWorkingHoursInput): Promise<WorkingHours>;
  delete(businessId: string, id: string): Promise<void>;
  list(businessId: string, filters?: WorkingHoursFilters): Promise<WorkingHours[]>;
  getById(businessId: string, id: string): Promise<WorkingHours | null>;
}

/** Volatile, business-scoped repository for demos and tests. */
export class InMemoryWorkingHoursRepository implements WorkingHoursRepository {
  private readonly schedules = new Map<string, WorkingHours>();

  constructor(seed: WorkingHours[] = []) {
    for (const schedule of seed) this.schedules.set(this.key(schedule.businessId, schedule.id), clone(schedule));
  }

  async create(businessId: string, input: CreateWorkingHoursInput): Promise<WorkingHours> {
    const duplicate = [...this.schedules.values()].some((schedule) =>
      schedule.businessId === businessId &&
      schedule.resourceId === input.resourceId &&
      schedule.dayOfWeek === input.dayOfWeek,
    );
    if (duplicate) throw new Error('Working hours already exist for this resource and weekday.');
    const schedule: WorkingHours = {
      ...cloneInput(input),
      id: crypto.randomUUID(),
      businessId,
    };
    this.schedules.set(this.key(businessId, schedule.id), schedule);
    return clone(schedule);
  }

  async update(
    businessId: string,
    id: string,
    input: UpdateWorkingHoursInput,
  ): Promise<WorkingHours> {
    const key = this.key(businessId, id);
    const existing = this.schedules.get(key);
    if (!existing) throw new Error('Working hours not found.');
    const updated = { ...existing, ...cloneInput(input) };
    this.schedules.set(key, updated);
    return clone(updated);
  }

  async delete(businessId: string, id: string): Promise<void> {
    if (!this.schedules.delete(this.key(businessId, id))) throw new Error('Working hours not found.');
  }

  async list(businessId: string, filters: WorkingHoursFilters = {}): Promise<WorkingHours[]> {
    return [...this.schedules.values()]
      .filter((schedule) => schedule.businessId === businessId)
      .filter((schedule) => filters.resourceId === undefined || schedule.resourceId === filters.resourceId)
      .filter((schedule) => filters.enabled === undefined || schedule.enabled === filters.enabled)
      .sort((left, right) => left.dayOfWeek - right.dayOfWeek)
      .map(clone);
  }

  async getById(businessId: string, id: string): Promise<WorkingHours | null> {
    const schedule = this.schedules.get(this.key(businessId, id));
    return schedule ? clone(schedule) : null;
  }

  private key(businessId: string, id: string): string {
    return `${businessId}:${id}`;
  }
}

function clone(schedule: WorkingHours): WorkingHours {
  return { ...schedule, timeRanges: schedule.timeRanges.map((range) => ({ ...range })) };
}

function cloneInput<T extends CreateWorkingHoursInput | UpdateWorkingHoursInput>(input: T): T {
  return { ...input, ...(input.timeRanges ? { timeRanges: input.timeRanges.map((range) => ({ ...range })) } : {}) };
}
