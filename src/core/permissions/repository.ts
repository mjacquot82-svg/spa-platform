import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreatePermissionInput,
  Permission,
  PermissionDatabase,
  PermissionFilters,
  PermissionRow,
  RolePermission,
  RolePermissionRow,
  UpdatePermissionInput,
} from './types';

export interface PermissionRepository {
  list(filters?: PermissionFilters): Promise<Permission[]>;
  getById(id: string): Promise<Permission | null>;
  create(input: CreatePermissionInput): Promise<Permission>;
  update(id: string, input: UpdatePermissionInput): Promise<Permission>;
  delete(id: string): Promise<void>;
  listForRole(businessId: string, roleId: string): Promise<Permission[]>;
  assignToRole(businessId: string, roleId: string, permissionId: string): Promise<RolePermission>;
  removeFromRole(businessId: string, roleId: string, permissionId: string): Promise<void>;
}

export class SupabasePermissionRepository implements PermissionRepository {
  constructor(private readonly client: SupabaseClient<PermissionDatabase>) {}

  async list(filters: PermissionFilters = {}): Promise<Permission[]> {
    let query = this.client
      .from('permissions')
      .select('*')
      .is('deleted_at', null)
      .order('key');
    if (filters.active !== undefined) query = query.eq('active', filters.active);
    if (filters.search) {
      const search = filters.search.replace(/[%_,]/g, '\\$&');
      query = query.or(`key.ilike.%${search}%,description.ilike.%${search}%`);
    }
    const offset = filters.offset ?? 0;
    if (filters.limit !== undefined) query = query.range(offset, offset + filters.limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(toPermission);
  }

  async getById(id: string): Promise<Permission | null> {
    const { data, error } = await this.client
      .from('permissions')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? toPermission(data) : null;
  }

  async create(input: CreatePermissionInput): Promise<Permission> {
    const { data, error } = await this.client
      .from('permissions')
      .insert({ key: input.key, description: input.description, active: input.active })
      .select()
      .single();
    if (error) throw error;
    return toPermission(data);
  }

  async update(id: string, input: UpdatePermissionInput): Promise<Permission> {
    const { data, error } = await this.client
      .from('permissions')
      .update(input)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();
    if (error) throw error;
    return toPermission(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('permissions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);
    if (error) throw error;
  }

  async listForRole(businessId: string, roleId: string): Promise<Permission[]> {
    const { data: mappings, error: mappingError } = await this.client
      .from('role_permissions')
      .select('permission_id')
      .eq('business_id', businessId)
      .eq('role_id', roleId);
    if (mappingError) throw mappingError;
    if (mappings.length === 0) return [];

    const { data, error } = await this.client
      .from('permissions')
      .select('*')
      .in('id', mappings.map((mapping) => mapping.permission_id))
      .is('deleted_at', null)
      .order('key');
    if (error) throw error;
    return data.map(toPermission);
  }

  async assignToRole(
    businessId: string,
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission> {
    const { data, error } = await this.client
      .from('role_permissions')
      .insert({ business_id: businessId, role_id: roleId, permission_id: permissionId })
      .select()
      .single();
    if (error) throw error;
    return toRolePermission(data);
  }

  async removeFromRole(
    businessId: string,
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    const { error } = await this.client
      .from('role_permissions')
      .delete()
      .eq('business_id', businessId)
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);
    if (error) throw error;
  }
}

function toPermission(row: PermissionRow): Permission {
  return {
    id: row.id,
    key: row.key,
    description: row.description,
    active: row.active,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRolePermission(row: RolePermissionRow): RolePermission {
  return {
    businessId: row.business_id,
    roleId: row.role_id,
    permissionId: row.permission_id,
    createdAt: row.created_at,
  };
}
