import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateCustomerInput,
  Customer,
  CustomerDatabase,
  CustomerFilters,
  UpdateCustomerInput,
} from '../types';
import { toCustomer, toCustomerInsert, toCustomerUpdate } from './customer.mapper';

export interface CustomerRepository {
  list(businessId: string, filters?: CustomerFilters): Promise<Customer[]>;
  getById(businessId: string, id: string): Promise<Customer | null>;
  create(businessId: string, input: CreateCustomerInput): Promise<Customer>;
  update(businessId: string, id: string, input: UpdateCustomerInput): Promise<Customer>;
  delete(businessId: string, id: string): Promise<void>;
}

export class SupabaseCustomerRepository implements CustomerRepository {
  constructor(private readonly client: SupabaseClient<CustomerDatabase>) {}

  async list(businessId: string, filters: CustomerFilters = {}): Promise<Customer[]> {
    let query = this.client
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .order('last_name')
      .order('first_name');
    if (filters.active !== undefined) query = query.eq('active', filters.active);
    if (filters.search) {
      const search = filters.search.replace(/[%_,]/g, '\\$&');
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%,customer_number.ilike.%${search}%`,
      );
    }
    const offset = filters.offset ?? 0;
    if (filters.limit !== undefined) query = query.range(offset, offset + filters.limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(toCustomer);
  }

  async getById(businessId: string, id: string): Promise<Customer | null> {
    const { data, error } = await this.client
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? toCustomer(data) : null;
  }

  async create(businessId: string, input: CreateCustomerInput): Promise<Customer> {
    const { data, error } = await this.client
      .from('customers')
      .insert(toCustomerInsert(businessId, input))
      .select()
      .single();
    if (error) throw error;
    return toCustomer(data);
  }

  async update(
    businessId: string,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> {
    const { data, error } = await this.client
      .from('customers')
      .update(toCustomerUpdate(input))
      .eq('business_id', businessId)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();
    if (error) throw error;
    return toCustomer(data);
  }

  async delete(businessId: string, id: string): Promise<void> {
    const { error } = await this.client.rpc('soft_delete_customer', {
      target_business_id: businessId,
      target_id: id,
    });
    if (error) throw error;
  }
}
