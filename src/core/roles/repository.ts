import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateRoleInput,
  Role,
  RoleDatabase,
  RoleFilters,
  RoleInsert,
  RoleRow,
  RoleUpdate,
  UpdateRoleInput,
} from './types';

export interface RoleRepository {
  list(businessId: string, filters?: RoleFilters): Promise<Role[]>;
  getById(businessId: string, id: string): Promise<Role | null>;
  create(businessId: string, input: CreateRoleInput): Promise<Role>;
  update(businessId: string, id: string, input: UpdateRoleInput): Promise<Role>;
  delete(businessId: string, id: string): Promise<void>;
}

export class SupabaseRoleRepository implements RoleRepository {
  constructor(private readonly client: SupabaseClient<RoleDatabase>) {}

  async list(businessId: string, filters: RoleFilters = {}): Promise<Role[]> {
    let query = this.client
      .from('roles')
      .select('*')
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .order('name');
    if (filters.active !== undefined) query = query.eq('active', filters.active);
    if (filters.search) {
      const search = filters.search.replace(/[%_,]/g, '\\$&');
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    const offset = filters.offset ?? 0;
    if (filters.limit !== undefined) query = query.range(offset, offset + filters.limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(toRole);
  }

  async getById(businessId: string, id: string): Promise<Role | null> {
    const { data, error } = await this.client
      .from('roles')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? toRole(data) : null;
  }

  async create(businessId: string, input: CreateRoleInput): Promise<Role> {
    const { data, error } = await this.client
      .from('roles')
      .insert(toRoleInsert(businessId, input))
      .select()
      .single();
    if (error) throw error;
    return toRole(data);
  }

  async update(businessId: string, id: string, input: UpdateRoleInput): Promise<Role> {
    const { data, error } = await this.client
      .from('roles')
      .update(toRoleUpdate(input))
      .eq('business_id', businessId)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();
    if (error) throw error;
    return toRole(data);
  }

  async delete(businessId: string, id: string): Promise<void> {
    const { error } = await this.client.rpc('soft_delete_role', {
      target_business_id: businessId,
      target_id: id,
    });
    if (error) throw error;
  }
}

function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    description: row.description,
    systemRole: row.system_role,
    active: row.active,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRoleInsert(businessId: string, input: CreateRoleInput): RoleInsert {
  return {
    business_id: businessId,
    name: input.name,
    description: input.description,
    system_role: input.systemRole,
    active: input.active,
  };
}

function toRoleUpdate(input: UpdateRoleInput): RoleUpdate {
  return {
    ...('name' in input ? { name: input.name } : {}),
    ...('description' in input ? { description: input.description } : {}),
    ...('systemRole' in input ? { system_role: input.systemRole } : {}),
    ...('active' in input ? { active: input.active } : {}),
  };
}
