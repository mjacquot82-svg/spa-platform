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
  listRecent(businessId: string, limit: number): Promise<Customer[]>;
  getById(businessId: string, id: string): Promise<Customer | null>;
  create(businessId: string, input: CreateCustomerInput): Promise<Customer>;
  update(businessId: string, id: string, input: UpdateCustomerInput): Promise<Customer>;
  delete(businessId: string, id: string): Promise<void>;
}

/** Volatile, business-scoped storage for demos and tests. */
export class InMemoryCustomerRepository implements CustomerRepository {
  private readonly customers = new Map<string, Customer>();

  constructor(seed: Customer[] = []) {
    for (const customer of seed) this.customers.set(this.key(customer.businessId, customer.id), clone(customer));
  }

  async list(businessId: string, filters: CustomerFilters = {}): Promise<Customer[]> {
    const search = filters.search?.toLocaleLowerCase();
    const offset = filters.offset ?? 0;
    const matches = [...this.customers.values()]
      .filter((customer) => customer.businessId === businessId && customer.deletedAt === null)
      .filter((customer) => filters.active === undefined || customer.active === filters.active)
      .filter((customer) => !search || [customer.firstName, customer.lastName, customer.companyName, customer.email]
        .some((value) => value?.toLocaleLowerCase().includes(search)))
      .sort((left, right) => `${left.lastName} ${left.firstName}`.localeCompare(`${right.lastName} ${right.firstName}`));
    return matches.slice(offset, filters.limit === undefined ? undefined : offset + filters.limit).map(clone);
  }

  async getById(businessId: string, id: string): Promise<Customer | null> {
    const customer = this.customers.get(this.key(businessId, id));
    return customer && customer.deletedAt === null ? clone(customer) : null;
  }

  async listRecent(businessId: string, limit: number): Promise<Customer[]> {
    return [...this.customers.values()].filter((customer) => customer.businessId === businessId && customer.deletedAt === null)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, limit).map(clone);
  }

  async create(businessId: string, input: CreateCustomerInput): Promise<Customer> {
    const now = new Date().toISOString();
    const customer: Customer = { ...cloneInput(input), id: crypto.randomUUID(), businessId, createdAt: now, updatedAt: now, deletedAt: null };
    this.customers.set(this.key(businessId, customer.id), customer);
    return clone(customer);
  }

  async update(businessId: string, id: string, input: UpdateCustomerInput): Promise<Customer> {
    const key = this.key(businessId, id);
    const existing = this.customers.get(key);
    if (!existing || existing.deletedAt !== null) throw new Error('Customer not found.');
    const updated = { ...existing, ...cloneInput(input), updatedAt: new Date().toISOString() };
    this.customers.set(key, updated);
    return clone(updated);
  }

  async delete(businessId: string, id: string): Promise<void> {
    const key = this.key(businessId, id);
    const existing = this.customers.get(key);
    if (!existing || existing.deletedAt !== null) throw new Error('Customer not found.');
    this.customers.set(key, { ...existing, active: false, deletedAt: new Date().toISOString() });
  }

  private key(businessId: string, id: string): string {
    return `${businessId}:${id}`;
  }
}

function clone(customer: Customer): Customer {
  return { ...customer, address: { ...customer.address } };
}

function cloneInput<T extends CreateCustomerInput | UpdateCustomerInput>(input: T): T {
  return { ...input, ...(input.address ? { address: { ...input.address } } : {}) };
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

  async listRecent(businessId: string, limit: number): Promise<Customer[]> {
    const { data, error } = await this.client.from('customers').select('*').eq('business_id', businessId)
      .is('deleted_at', null).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data.map(toCustomer);
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
