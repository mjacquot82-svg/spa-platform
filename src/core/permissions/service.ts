import type { PermissionRepository } from './repository';
import type {
  CreatePermissionInput,
  Permission,
  PermissionFilters,
  RolePermission,
  UpdatePermissionInput,
} from './types';
import {
  PermissionValidationError,
  validatePermission,
  validatePermissionFilters,
} from './validation';

export class PermissionService {
  constructor(private readonly repository: PermissionRepository) {}

  list(filters?: PermissionFilters): Promise<Permission[]> {
    validatePermissionFilters(filters);
    return this.repository.list(normalizeFilters(filters));
  }

  getById(id: string): Promise<Permission | null> {
    return this.repository.getById(requireId(id, 'id'));
  }

  create(input: CreatePermissionInput): Promise<Permission> {
    assertValid(input, false);
    return this.repository.create({
      ...input,
      key: input.key.trim().toLowerCase(),
      description: input.description.trim(),
    });
  }

  update(id: string, input: UpdatePermissionInput): Promise<Permission> {
    assertValid(input, true);
    return this.repository.update(requireId(id, 'id'), {
      ...input,
      ...(input.description !== undefined
        ? { description: input.description.trim() }
        : {}),
    });
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(requireId(id, 'id'));
  }

  listForRole(businessId: string, roleId: string): Promise<Permission[]> {
    return this.repository.listForRole(
      requireId(businessId, 'businessId'),
      requireId(roleId, 'roleId'),
    );
  }

  assignToRole(
    businessId: string,
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission> {
    return this.repository.assignToRole(
      requireId(businessId, 'businessId'),
      requireId(roleId, 'roleId'),
      requireId(permissionId, 'permissionId'),
    );
  }

  removeFromRole(businessId: string, roleId: string, permissionId: string): Promise<void> {
    return this.repository.removeFromRole(
      requireId(businessId, 'businessId'),
      requireId(roleId, 'roleId'),
      requireId(permissionId, 'permissionId'),
    );
  }
}

function assertValid(
  input: CreatePermissionInput | UpdatePermissionInput,
  partial: boolean,
): void {
  const result = validatePermission(input, partial);
  if (!result.valid) throw new PermissionValidationError(result.issues);
}

function requireId(value: string, field: string): string {
  if (!value.trim()) throw new TypeError(`${field} is required.`);
  return value.trim();
}

function normalizeFilters(filters?: PermissionFilters): PermissionFilters | undefined {
  if (!filters) return undefined;
  return { ...filters, ...(filters.search ? { search: filters.search.trim() } : {}) };
}
