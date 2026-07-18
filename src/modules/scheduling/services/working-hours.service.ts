import type {
  CreateWorkingHoursInput,
  UpdateWorkingHoursInput,
  WorkingHours,
  WorkingHoursFilters,
  WorkingHoursTimeRange,
} from '../types';
import { WorkingHoursValidationError } from '../types';
import type { WorkingHoursRepository } from './working-hours.repository';
import { validateWorkingHours } from './working-hours.validation';

export class WorkingHoursService {
  constructor(private readonly repository: WorkingHoursRepository) {}

  createWorkingHours(businessId: string, input: CreateWorkingHoursInput): Promise<WorkingHours> {
    assertValid(input, false);
    return this.repository.create(requireId(businessId, 'businessId'), normalizeCreate(input));
  }

  async updateWorkingHours(
    businessId: string,
    id: string,
    input: UpdateWorkingHoursInput,
  ): Promise<WorkingHours> {
    assertValid(input, true);
    const scopedBusinessId = requireId(businessId, 'businessId');
    const scopedId = requireId(id, 'id');
    const existing = await this.repository.getById(scopedBusinessId, scopedId);
    if (!existing) throw new Error('Working hours not found.');
    const normalized = normalizeUpdate(input);
    assertValid({
      resourceId: existing.resourceId,
      dayOfWeek: existing.dayOfWeek,
      enabled: normalized.enabled ?? existing.enabled,
      timeRanges: normalized.timeRanges ?? existing.timeRanges,
    }, false);
    return this.repository.update(scopedBusinessId, scopedId, normalized);
  }

  removeWorkingHours(businessId: string, id: string): Promise<void> {
    return this.repository.delete(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }

  listWorkingHours(businessId: string, filters?: WorkingHoursFilters): Promise<WorkingHours[]> {
    const normalizedFilters = filters?.resourceId
      ? { ...filters, resourceId: requireId(filters.resourceId, 'resourceId') }
      : filters;
    return this.repository.list(requireId(businessId, 'businessId'), normalizedFilters);
  }

  listWorkingHoursForResource(businessId: string, resourceId: string): Promise<WorkingHours[]> {
    return this.listWorkingHours(businessId, { resourceId: requireId(resourceId, 'resourceId') });
  }

  getWorkingHours(businessId: string, id: string): Promise<WorkingHours | null> {
    return this.repository.getById(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }
}

function assertValid(input: CreateWorkingHoursInput | UpdateWorkingHoursInput, partial: boolean): void {
  const result = validateWorkingHours(input, partial);
  if (!result.valid) throw new WorkingHoursValidationError(result.issues);
}

function requireId(value: string, field: string): string {
  if (!value.trim()) throw new TypeError(`${field} is required.`);
  return value.trim();
}

function normalizeCreate(input: CreateWorkingHoursInput): CreateWorkingHoursInput {
  return { ...input, resourceId: input.resourceId.trim(), timeRanges: normalizeRanges(input.timeRanges) };
}

function normalizeUpdate(input: UpdateWorkingHoursInput): UpdateWorkingHoursInput {
  return { ...input, ...(input.timeRanges ? { timeRanges: normalizeRanges(input.timeRanges) } : {}) };
}

function normalizeRanges(ranges: WorkingHoursTimeRange[]): WorkingHoursTimeRange[] {
  return ranges.map((range) => ({ ...range })).sort((left, right) => left.startTime.localeCompare(right.startTime));
}
