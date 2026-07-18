import type {
  AvailabilityException,
  AvailabilityExceptionFilters,
  CreateAvailabilityExceptionInput,
  UpdateAvailabilityExceptionInput,
} from '../types';
import { AvailabilityExceptionValidationError } from '../types';
import type { AvailabilityExceptionRepository } from './availability-exception.repository';
import { validateAvailabilityException } from './availability-exception.validation';

export class AvailabilityExceptionService {
  constructor(private readonly repository: AvailabilityExceptionRepository) {}

  createException(businessId: string, input: CreateAvailabilityExceptionInput): Promise<AvailabilityException> {
    assertValid(input, false);
    return this.repository.create(requireId(businessId, 'businessId'), normalize(input) as CreateAvailabilityExceptionInput);
  }

  async updateException(businessId: string, id: string, input: UpdateAvailabilityExceptionInput): Promise<AvailabilityException> {
    assertValid(input, true);
    const scopedBusinessId = requireId(businessId, 'businessId');
    const scopedId = requireId(id, 'id');
    const existing = await this.repository.getById(scopedBusinessId, scopedId);
    if (!existing) throw new Error('Availability exception not found.');
    const normalized = normalize(input);
    assertValid({ ...existing, ...normalized }, false);
    return this.repository.update(scopedBusinessId, scopedId, normalized);
  }

  archiveException(businessId: string, id: string): Promise<AvailabilityException> {
    return this.repository.update(requireId(businessId, 'businessId'), requireId(id, 'id'), { active: false });
  }

  restoreException(businessId: string, id: string): Promise<AvailabilityException> {
    return this.repository.update(requireId(businessId, 'businessId'), requireId(id, 'id'), { active: true });
  }

  listExceptions(businessId: string, filters?: AvailabilityExceptionFilters): Promise<AvailabilityException[]> {
    const normalized = filters?.resourceId ? { ...filters, resourceId: requireId(filters.resourceId, 'resourceId') } : filters;
    return this.repository.list(requireId(businessId, 'businessId'), normalized);
  }

  listExceptionsForResource(businessId: string, resourceId: string): Promise<AvailabilityException[]> {
    return this.listExceptions(businessId, { resourceId: requireId(resourceId, 'resourceId') });
  }

  getException(businessId: string, id: string): Promise<AvailabilityException | null> {
    return this.repository.getById(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }
}

function assertValid(input: CreateAvailabilityExceptionInput | UpdateAvailabilityExceptionInput, partial: boolean): void {
  const result = validateAvailabilityException(input, partial);
  if (!result.valid) throw new AvailabilityExceptionValidationError(result.issues);
}

function requireId(value: string, field: string): string {
  if (!value.trim()) throw new TypeError(`${field} is required.`);
  return value.trim();
}

function normalize<T extends CreateAvailabilityExceptionInput | UpdateAvailabilityExceptionInput>(input: T): T {
  return {
    ...input,
    ...('resourceId' in input && input.resourceId !== undefined ? { resourceId: input.resourceId.trim() } : {}),
    ...('title' in input && input.title !== undefined ? { title: input.title.trim() } : {}),
    ...('reason' in input ? { reason: input.reason?.trim() } : {}),
    ...('color' in input ? { color: input.color?.trim() } : {}),
    ...(input.metadata !== undefined ? { metadata: { ...input.metadata } } : {}),
  };
}
