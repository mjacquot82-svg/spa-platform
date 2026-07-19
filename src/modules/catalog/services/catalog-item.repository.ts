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

/** Volatile, business-scoped storage for demos and tests. */
export class InMemoryCatalogItemRepository implements CatalogItemRepository {
  private readonly items = new Map<string, CatalogItem>();

  constructor(seed: CatalogItem[] = []) {
    for (const item of seed) this.items.set(this.key(item.businessId, item.id), cloneCatalogItem(item));
  }

  async list(businessId: string, filters: CatalogItemFilters = {}): Promise<CatalogItem[]> {
    const offset = filters.offset ?? 0;
    const search = filters.search?.toLocaleLowerCase();
    const matches = [...this.items.values()]
      .filter((item) => item.businessId === businessId && item.deletedAt === null)
      .filter((item) => filters.type === undefined || item.type === filters.type)
      .filter((item) => filters.category === undefined || item.category === filters.category)
      .filter((item) => filters.active === undefined || item.active === filters.active)
      .filter((item) => !search || item.name.toLocaleLowerCase().includes(search))
      .sort((left, right) => left.name.localeCompare(right.name));
    return matches.slice(offset, filters.limit === undefined ? undefined : offset + filters.limit).map(cloneCatalogItem);
  }

  async getById(businessId: string, id: string): Promise<CatalogItem | null> {
    const item = this.items.get(this.key(businessId, id));
    return item && item.deletedAt === null ? cloneCatalogItem(item) : null;
  }

  async create(businessId: string, input: CreateCatalogItemInput): Promise<CatalogItem> {
    const now = new Date().toISOString();
    const item = { ...input, id: crypto.randomUUID(), businessId, createdAt: now, updatedAt: now, deletedAt: null } as CatalogItem;
    this.items.set(this.key(businessId, item.id), item);
    return cloneCatalogItem(item);
  }

  async update(businessId: string, id: string, input: UpdateCatalogItemInput): Promise<CatalogItem> {
    const key = this.key(businessId, id);
    const existing = this.items.get(key);
    if (!existing || existing.deletedAt !== null) throw new Error('Catalog item not found.');
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() } as CatalogItem;
    this.items.set(key, updated);
    return cloneCatalogItem(updated);
  }

  async delete(businessId: string, id: string): Promise<void> {
    const key = this.key(businessId, id);
    const existing = this.items.get(key);
    if (!existing || existing.deletedAt !== null) throw new Error('Catalog item not found.');
    this.items.set(key, { ...existing, active: false, deletedAt: new Date().toISOString() });
  }

  private key(businessId: string, id: string): string {
    return `${businessId}:${id}`;
  }
}

function cloneCatalogItem(item: CatalogItem): CatalogItem {
  return item.type === 'Service'
    ? { ...item, ...(item.resourceTypesRequired ? { resourceTypesRequired: [...item.resourceTypesRequired] } : {}) }
    : { ...item };
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
