import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateMembershipInput,
  Membership,
  MembershipRow,
  UpdateMembershipInput,
} from './types';

export interface MembershipRepository {
  listByUser(userId: string): Promise<Membership[]>;
  listByBusiness(businessId: string): Promise<Membership[]>;
  getById(id: string): Promise<Membership | null>;
  getByUserAndBusiness(userId: string, businessId: string): Promise<Membership | null>;
  create(input: CreateMembershipInput): Promise<Membership>;
  update(id: string, input: UpdateMembershipInput): Promise<Membership>;
  delete(id: string): Promise<void>;
}

function toMembership(row: MembershipRow): Membership {
  return {
    id: row.id,
    userId: row.user_id,
    businessId: row.business_id,
    status: row.status,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseMembershipRepository implements MembershipRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listByUser(userId: string): Promise<Membership[]> {
    const { data, error } = await this.supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });
    if (error) throw error;
    return (data as MembershipRow[]).map(toMembership);
  }

  async listByBusiness(businessId: string): Promise<Membership[]> {
    const { data, error } = await this.supabase
      .from('memberships')
      .select('*')
      .eq('business_id', businessId)
      .order('joined_at', { ascending: false });
    if (error) throw error;
    return (data as MembershipRow[]).map(toMembership);
  }

  async getById(id: string): Promise<Membership | null> {
    const { data, error } = await this.supabase
      .from('memberships')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toMembership(data as MembershipRow) : null;
  }

  async getByUserAndBusiness(userId: string, businessId: string): Promise<Membership | null> {
    const { data, error } = await this.supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .maybeSingle();
    if (error) throw error;
    return data ? toMembership(data as MembershipRow) : null;
  }

  async create(input: CreateMembershipInput): Promise<Membership> {
    const { data, error } = await this.supabase
      .from('memberships')
      .insert({
        user_id: input.userId,
        business_id: input.businessId,
        ...(input.status !== undefined ? { status: input.status } : {}),
      })
      .select('*')
      .single();
    if (error) throw error;
    return toMembership(data as MembershipRow);
  }

  async update(id: string, input: UpdateMembershipInput): Promise<Membership> {
    const { data, error } = await this.supabase
      .from('memberships')
      .update({ status: input.status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return toMembership(data as MembershipRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('memberships').delete().eq('id', id);
    if (error) throw error;
  }
}
