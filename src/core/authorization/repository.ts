import type { SupabaseClient } from '@supabase/supabase-js';

import type { PermissionKey } from './types';

export interface PermissionResolutionRepository {
  resolveForMembership(membershipId: string): Promise<PermissionKey[]>;
}

interface PermissionKeyRow {
  permission_key: string;
}

export class SupabasePermissionResolutionRepository
  implements PermissionResolutionRepository
{
  constructor(private readonly client: SupabaseClient) {}

  async resolveForMembership(membershipId: string): Promise<PermissionKey[]> {
    const { data, error } = await this.client.rpc('resolve_membership_permission_keys', {
      target_membership_id: membershipId,
    });
    if (error) throw error;
    return ((data ?? []) as PermissionKeyRow[]).map((row) => row.permission_key);
  }
}
