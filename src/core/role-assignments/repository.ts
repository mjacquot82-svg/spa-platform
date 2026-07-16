import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateRoleAssignmentInput,
  RoleAssignment,
  RoleAssignmentDatabase,
  RoleAssignmentRow,
} from './types';

export interface RoleAssignmentRepository {
  listByMembership(businessId: string, membershipId: string): Promise<RoleAssignment[]>;
  listByRole(businessId: string, roleId: string): Promise<RoleAssignment[]>;
  getById(businessId: string, id: string): Promise<RoleAssignment | null>;
  create(businessId: string, input: CreateRoleAssignmentInput): Promise<RoleAssignment>;
  delete(businessId: string, id: string): Promise<void>;
}

export class SupabaseRoleAssignmentRepository implements RoleAssignmentRepository {
  constructor(private readonly client: SupabaseClient<RoleAssignmentDatabase>) {}

  async listByMembership(
    businessId: string,
    membershipId: string,
  ): Promise<RoleAssignment[]> {
    const { data, error } = await this.client
      .from('role_assignments')
      .select('*')
      .eq('business_id', businessId)
      .eq('membership_id', membershipId)
      .order('created_at');
    if (error) throw error;
    return data.map(toRoleAssignment);
  }

  async listByRole(businessId: string, roleId: string): Promise<RoleAssignment[]> {
    const { data, error } = await this.client
      .from('role_assignments')
      .select('*')
      .eq('business_id', businessId)
      .eq('role_id', roleId)
      .order('created_at');
    if (error) throw error;
    return data.map(toRoleAssignment);
  }

  async getById(businessId: string, id: string): Promise<RoleAssignment | null> {
    const { data, error } = await this.client
      .from('role_assignments')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toRoleAssignment(data) : null;
  }

  async create(
    businessId: string,
    input: CreateRoleAssignmentInput,
  ): Promise<RoleAssignment> {
    const { data, error } = await this.client
      .from('role_assignments')
      .insert({
        business_id: businessId,
        membership_id: input.membershipId,
        role_id: input.roleId,
      })
      .select()
      .single();
    if (error) throw error;
    return toRoleAssignment(data);
  }

  async delete(businessId: string, id: string): Promise<void> {
    const { error } = await this.client
      .from('role_assignments')
      .delete()
      .eq('business_id', businessId)
      .eq('id', id);
    if (error) throw error;
  }
}

function toRoleAssignment(row: RoleAssignmentRow): RoleAssignment {
  return {
    id: row.id,
    membershipId: row.membership_id,
    roleId: row.role_id,
    businessId: row.business_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
