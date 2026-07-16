import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CatalogDatabase,
  CatalogItem,
  CatalogItemFilters,
  CreateCatalogItemInput,
  UpdateCatalogItemInput,
} from '../types';
import { toCatalogItem, toCatalogItemInsert, toCatalogItemUpdate } from './catalog-item.mapper';

export interface CatalogItemRepository {
  list(businessId: string, filters?: CatalogItemFilters): Promise<CatalogItem[]>;
  getById(businessId: string, id: string): Promise<CatalogItem | null>;
  create(businessId: string, input: CreateCatalogItemInput): Promise<CatalogItem>;
  update(businessId: string, id: string, input: UpdateCatalogItemInput): Promise<CatalogItem>;
  delete(businessId: string, id: string): Promise<void>;
}

export class SupabaseCatalogItemRepository implements CatalogItemRepository {
  constructor(private readonly client: SupabaseClient<CatalogDatabase>) {}

  async list(businessId: string, filters: CatalogItemFilters = {}): Promise<CatalogItem[]> {
    let query = this.client
      .from('catalog_items')
      .select('*')
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .order('name');
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.active !== undefined) query = query.eq('active', filters.active);
    if (filters.search) {
      query = query.ilike('name', `%${filters.search.replace(/[%_]/g, '\\$&')}%`);
    }
    const offset = filters.offset ?? 0;
    if (filters.limit !== undefined) query = query.range(offset, offset + filters.limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(toCatalogItem);
  }

  async getById(businessId: string, id: string): Promise<CatalogItem | null> {
    const { data, error } = await this.client
      .from('catalog_items')
      .select('*')
      .eq('business_id', businessId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? toCatalogItem(data) : null;
  }

  async create(businessId: string, input: CreateCatalogItemInput): Promise<CatalogItem> {
    const { data, error } = await this.client
      .from('catalog_items')
      .insert(toCatalogItemInsert(businessId, input))
      .select()
      .single();
    if (error) throw error;
    return toCatalogItem(data);
  }

  async update(businessId: string, id: string, input: UpdateCatalogItemInput): Promise<CatalogItem> {
    const { data, error } = await this.client
      .from('catalog_items')
      .update(toCatalogItemUpdate(input))
      .eq('business_id', businessId)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();
    if (error) throw error;
    return toCatalogItem(data);
  }

  async delete(businessId: string, id: string): Promise<void> {
    const { error } = await this.client.rpc('soft_delete_catalog_item', {
      target_business_id: businessId,
      target_id: id,
    });
    if (error) throw error;
  }
}
