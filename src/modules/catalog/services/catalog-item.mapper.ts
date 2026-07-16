import type {
  CatalogItem,
  CatalogItemInsert,
  CatalogItemRow,
  CatalogItemUpdate,
  CreateCatalogItemInput,
  UpdateCatalogItemInput,
} from '../types';

export function toCatalogItem(row: CatalogItemRow): CatalogItem {
  const common = {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    description: row.description,
    category: row.category,
    image: row.image,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };

  if (row.type === 'Product') {
    return { ...common, type: 'Product' };
  }

  return { ...common, type: 'Service' };
}

export function toCatalogItemInsert(
  businessId: string,
  input: CreateCatalogItemInput,
): CatalogItemInsert {
  const row: CatalogItemInsert = {
    business_id: businessId,
    type: input.type,
    name: input.name,
    description: input.description,
    category: input.category,
    image: input.image,
    active: input.active,
  };
  return row;
}

export function toCatalogItemUpdate(input: UpdateCatalogItemInput): CatalogItemUpdate {
  // `type` is a discriminator for safe input narrowing, not a mutable field.
  const common: CatalogItemUpdate = {};
  if (input.name !== undefined) common.name = input.name;
  if (input.description !== undefined) common.description = input.description;
  if (input.category !== undefined) common.category = input.category;
  if (input.image !== undefined) common.image = input.image;
  if (input.active !== undefined) common.active = input.active;
  return common;
}
