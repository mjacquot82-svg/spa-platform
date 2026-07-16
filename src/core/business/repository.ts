import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Business,
  BusinessRow,
  CreateBusinessInput,
  UpdateBusinessInput,
} from './types';

export interface BusinessRepository {
  list(): Promise<Business[]>;
  getById(id: string): Promise<Business | null>;
  create(input: CreateBusinessInput): Promise<Business>;
  update(id: string, input: UpdateBusinessInput): Promise<Business>;
}

function toBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    ...(row.legal_name ? { legalName: row.legal_name } : {}),
    email: row.email,
    phone: row.phone,
    website: row.website,
    logo: row.logo,
    address: row.address,
    timezone: row.timezone,
    currency: row.currency,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: CreateBusinessInput | UpdateBusinessInput) {
  return {
    ...('name' in input ? { name: input.name } : {}),
    ...('legalName' in input ? { legal_name: input.legalName ?? null } : {}),
    ...('email' in input ? { email: input.email } : {}),
    ...('phone' in input ? { phone: input.phone } : {}),
    ...('website' in input ? { website: input.website } : {}),
    ...('logo' in input ? { logo: input.logo } : {}),
    ...('address' in input ? { address: input.address } : {}),
    ...('timezone' in input ? { timezone: input.timezone } : {}),
    ...('currency' in input ? { currency: input.currency } : {}),
    ...('active' in input ? { active: input.active } : {}),
  };
}

export class SupabaseBusinessRepository implements BusinessRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async list(): Promise<Business[]> {
    const { data, error } = await this.supabase
      .from('businesses')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data as BusinessRow[]).map(toBusiness);
  }

  async getById(id: string): Promise<Business | null> {
    const { data, error } = await this.supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toBusiness(data as BusinessRow) : null;
  }

  async create(input: CreateBusinessInput): Promise<Business> {
    const { data, error } = await this.supabase
      .from('businesses')
      .insert(toRow(input))
      .select('*')
      .single();
    if (error) throw error;
    return toBusiness(data as BusinessRow);
  }

  async update(id: string, input: UpdateBusinessInput): Promise<Business> {
    const { data, error } = await this.supabase
      .from('businesses')
      .update(toRow(input))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return toBusiness(data as BusinessRow);
  }
}
