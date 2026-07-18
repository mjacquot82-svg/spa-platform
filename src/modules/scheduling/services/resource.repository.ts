import type {
  CreateSchedulingResourceInput,
  SchedulingResource,
  SchedulingResourceFilters,
  UpdateSchedulingResourceInput,
} from '../types';

export interface SchedulingResourceRepository {
  create(businessId: string, input: CreateSchedulingResourceInput): Promise<SchedulingResource>;
  update(
    businessId: string,
    id: string,
    input: UpdateSchedulingResourceInput,
  ): Promise<SchedulingResource>;
  list(businessId: string, filters?: SchedulingResourceFilters): Promise<SchedulingResource[]>;
  getById(businessId: string, id: string): Promise<SchedulingResource | null>;
}

/**
 * Volatile adapter for demos, tests, and consumers that do not yet have persistence.
 * Data is scoped by business and is lost when this instance is discarded.
 */
export class InMemorySchedulingResourceRepository implements SchedulingResourceRepository {
  private readonly resources = new Map<string, SchedulingResource>();

  constructor(seed: SchedulingResource[] = []) {
    for (const resource of seed) this.resources.set(this.key(resource.businessId, resource.id), clone(resource));
  }

  async create(
    businessId: string,
    input: CreateSchedulingResourceInput,
  ): Promise<SchedulingResource> {
    const resource: SchedulingResource = { ...cloneInput(input), id: crypto.randomUUID(), businessId };
    this.resources.set(this.key(businessId, resource.id), resource);
    return clone(resource);
  }

  async update(
    businessId: string,
    id: string,
    input: UpdateSchedulingResourceInput,
  ): Promise<SchedulingResource> {
    const key = this.key(businessId, id);
    const existing = this.resources.get(key);
    if (!existing) throw new Error('Scheduling resource not found.');
    const updated = { ...existing, ...cloneInput(input) };
    this.resources.set(key, updated);
    return clone(updated);
  }

  async list(
    businessId: string,
    filters: SchedulingResourceFilters = {},
  ): Promise<SchedulingResource[]> {
    return [...this.resources.values()]
      .filter((resource) => resource.businessId === businessId)
      .filter((resource) => filters.active === undefined || resource.active === filters.active)
      .filter((resource) => filters.type === undefined || resource.type === filters.type)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(clone);
  }

  async getById(businessId: string, id: string): Promise<SchedulingResource | null> {
    const resource = this.resources.get(this.key(businessId, id));
    return resource ? clone(resource) : null;
  }

  private key(businessId: string, id: string): string {
    return `${businessId}:${id}`;
  }
}

function clone(resource: SchedulingResource): SchedulingResource {
  return { ...resource, metadata: { ...resource.metadata } };
}

function cloneInput<T extends CreateSchedulingResourceInput | UpdateSchedulingResourceInput>(input: T): T {
  return { ...input, ...(input.metadata ? { metadata: { ...input.metadata } } : {}) };
}
