import type { RoleRepository } from './repository';
import type { CreateRoleInput, Role, RoleFilters, UpdateRoleInput } from './types';
import { RoleValidationError, validateRole, validateRoleFilters } from './validation';

export class RoleService {
  constructor(private readonly repository: RoleRepository) {}

  list(businessId: string, filters?: RoleFilters): Promise<Role[]> {
    validateRoleFilters(filters);
    return this.repository.list(requireId(businessId, 'businessId'), normalizeFilters(filters));
  }

  getById(businessId: string, id: string): Promise<Role | null> {
    return this.repository.getById(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }

  create(businessId: string, input: CreateRoleInput): Promise<Role> {
    assertValid(input, false);
    return this.repository.create(requireId(businessId, 'businessId'), normalizeCreate(input));
  }

  update(businessId: string, id: string, input: UpdateRoleInput): Promise<Role> {
    assertValid(input, true);
    return this.repository.update(
      requireId(businessId, 'businessId'),
      requireId(id, 'id'),
      normalizeUpdate(input),
    );
  }

  delete(businessId: string, id: string): Promise<void> {
    return this.repository.delete(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }
}

function assertValid(input: CreateRoleInput | UpdateRoleInput, partial: boolean): void {
  const result = validateRole(input, partial);
  if (!result.valid) throw new RoleValidationError(result.issues);
}

function requireId(value: string, field: string): string {
  if (!value.trim()) throw new TypeError(`${field} is required.`);
  return value.trim();
}

function normalizeFilters(filters?: RoleFilters): RoleFilters | undefined {
  if (!filters) return undefined;
  return { ...filters, ...(filters.search ? { search: filters.search.trim() } : {}) };
}

function normalizeCreate(input: CreateRoleInput): CreateRoleInput {
  return { ...input, name: input.name.trim(), description: input.description.trim() };
}

function normalizeUpdate(input: UpdateRoleInput): UpdateRoleInput {
  return {
    ...input,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
  };
}
