import type {
  AvailabilityException,
  AvailabilityExceptionFilters,
  CreateAvailabilityExceptionInput,
  UpdateAvailabilityExceptionInput,
} from '../types';

export interface AvailabilityExceptionRepository {
  create(businessId: string, input: CreateAvailabilityExceptionInput): Promise<AvailabilityException>;
  update(businessId: string, id: string, input: UpdateAvailabilityExceptionInput): Promise<AvailabilityException>;
  list(businessId: string, filters?: AvailabilityExceptionFilters): Promise<AvailabilityException[]>;
  getById(businessId: string, id: string): Promise<AvailabilityException | null>;
}

/** Volatile, business-scoped storage for demos, tests, and local composition. */
export class InMemoryAvailabilityExceptionRepository implements AvailabilityExceptionRepository {
  private readonly exceptions = new Map<string, AvailabilityException>();

  constructor(seed: AvailabilityException[] = []) {
    for (const exception of seed) this.exceptions.set(this.key(exception.businessId, exception.id), clone(exception));
  }

  async create(businessId: string, input: CreateAvailabilityExceptionInput): Promise<AvailabilityException> {
    const exception = { ...cloneInput(input), id: crypto.randomUUID(), businessId };
    this.exceptions.set(this.key(businessId, exception.id), exception);
    return clone(exception);
  }

  async update(businessId: string, id: string, input: UpdateAvailabilityExceptionInput): Promise<AvailabilityException> {
    const key = this.key(businessId, id);
    const existing = this.exceptions.get(key);
    if (!existing) throw new Error('Availability exception not found.');
    const updated = { ...existing, ...cloneInput(input) };
    this.exceptions.set(key, updated);
    return clone(updated);
  }

  async list(businessId: string, filters: AvailabilityExceptionFilters = {}): Promise<AvailabilityException[]> {
    return [...this.exceptions.values()]
      .filter((exception) => exception.businessId === businessId)
      .filter((exception) => filters.resourceId === undefined || exception.resourceId === filters.resourceId)
      .filter((exception) => filters.type === undefined || exception.type === filters.type)
      .filter((exception) => filters.active === undefined || exception.active === filters.active)
      .filter((exception) => filters.endsAfter === undefined || Date.parse(exception.end) > Date.parse(filters.endsAfter))
      .filter((exception) => filters.startsBefore === undefined || Date.parse(exception.start) < Date.parse(filters.startsBefore))
      .sort((left, right) => left.start.localeCompare(right.start))
      .map(clone);
  }

  async getById(businessId: string, id: string): Promise<AvailabilityException | null> {
    const exception = this.exceptions.get(this.key(businessId, id));
    return exception ? clone(exception) : null;
  }

  private key(businessId: string, id: string): string {
    return `${businessId}:${id}`;
  }
}

function clone(exception: AvailabilityException): AvailabilityException {
  return { ...exception, metadata: { ...exception.metadata } };
}

function cloneInput<T extends CreateAvailabilityExceptionInput | UpdateAvailabilityExceptionInput>(input: T): T {
  return { ...input, ...(input.metadata ? { metadata: { ...input.metadata } } : {}) };
}
