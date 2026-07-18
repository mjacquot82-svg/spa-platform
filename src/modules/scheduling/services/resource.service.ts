import type {
  CreateSchedulingResourceInput,
  SchedulingResource,
  SchedulingResourceFilters,
  SchedulingResourceType,
  UpdateSchedulingResourceInput,
} from '../types';
import { SchedulingResourceValidationError } from '../types';
import type { SchedulingResourceRepository } from './resource.repository';
import { validateSchedulingResource } from './resource.validation';

export class SchedulingResourceService {
  constructor(private readonly repository: SchedulingResourceRepository) {}

  createResource(
    businessId: string,
    input: CreateSchedulingResourceInput,
  ): Promise<SchedulingResource> {
    assertValid(input, false);
    return this.repository.create(requireId(businessId, 'businessId'), normalizeCreate(input));
  }

  updateResource(
    businessId: string,
    id: string,
    input: UpdateSchedulingResourceInput,
  ): Promise<SchedulingResource> {
    assertValid(input, true);
    return this.repository.update(
      requireId(businessId, 'businessId'),
      requireId(id, 'id'),
      normalizeUpdate(input),
    );
  }

  archiveResource(businessId: string, id: string): Promise<SchedulingResource> {
    return this.repository.update(
      requireId(businessId, 'businessId'), requireId(id, 'id'), { active: false },
    );
  }

  restoreResource(businessId: string, id: string): Promise<SchedulingResource> {
    return this.repository.update(
      requireId(businessId, 'businessId'), requireId(id, 'id'), { active: true },
    );
  }

  listResources(
    businessId: string,
    filters?: SchedulingResourceFilters,
  ): Promise<SchedulingResource[]> {
    return this.repository.list(requireId(businessId, 'businessId'), filters);
  }

  listResourcesByType(
    businessId: string,
    type: SchedulingResourceType,
    filters: Omit<SchedulingResourceFilters, 'type'> = {},
  ): Promise<SchedulingResource[]> {
    assertType(type);
    return this.repository.list(requireId(businessId, 'businessId'), { ...filters, type });
  }

  getResource(businessId: string, id: string): Promise<SchedulingResource | null> {
    return this.repository.getById(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }
}

function assertValid(
  input: CreateSchedulingResourceInput | UpdateSchedulingResourceInput,
  partial: boolean,
): void {
  const result = validateSchedulingResource(input, partial);
  if (!result.valid) throw new SchedulingResourceValidationError(result.issues);
}

function assertType(type: SchedulingResourceType): void {
  const result = validateSchedulingResource({ type }, true);
  if (!result.valid) throw new SchedulingResourceValidationError(result.issues);
}

function requireId(value: string, field: string): string {
  if (!value.trim()) throw new TypeError(`${field} is required.`);
  return value.trim();
}

function normalizeCreate(input: CreateSchedulingResourceInput): CreateSchedulingResourceInput {
  return {
    ...input,
    name: input.name.trim(),
    ...(input.description ? { description: input.description.trim() } : {}),
    ...(input.color ? { color: input.color.trim() } : {}),
    metadata: { ...input.metadata },
  };
}

function normalizeUpdate(input: UpdateSchedulingResourceInput): UpdateSchedulingResourceInput {
  return {
    ...input,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...('description' in input ? { description: input.description?.trim() } : {}),
    ...('color' in input ? { color: input.color?.trim() } : {}),
    ...(input.metadata !== undefined ? { metadata: { ...input.metadata } } : {}),
  };
}
