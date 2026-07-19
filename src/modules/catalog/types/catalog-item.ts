export const CATALOG_ITEM_TYPES = ['Product', 'Service'] as const;

export type CatalogItemType = (typeof CATALOG_ITEM_TYPES)[number];

export const CATALOG_RESOURCE_TYPES = ['staff', 'room', 'equipment'] as const;
export type CatalogResourceType = (typeof CATALOG_RESOURCE_TYPES)[number];

export interface ServiceSchedulingMetadata {
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  resourceTypesRequired?: CatalogResourceType[];
}

export interface CatalogItemBase {
  id: string;
  businessId: string;
  type: CatalogItemType;
  name: string;
  description: string | null;
  category: string | null;
  image: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProductCatalogItem extends CatalogItemBase {
  type: 'Product';
}

export interface ServiceCatalogItem extends CatalogItemBase, ServiceSchedulingMetadata {
  type: 'Service';
}

export type CatalogItem = ProductCatalogItem | ServiceCatalogItem;

type ManagedFields = 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'deletedAt';

export type CreateCatalogItemInput =
  | Omit<ProductCatalogItem, ManagedFields>
  | Omit<ServiceCatalogItem, ManagedFields>;

export type UpdateCatalogItemInput =
  | ({ type: 'Product' } & Partial<Omit<ProductCatalogItem, ManagedFields | 'type'>>)
  | ({ type: 'Service' } & Partial<Omit<ServiceCatalogItem, ManagedFields | 'type'>>);

export interface CatalogItemFilters {
  type?: CatalogItemType;
  category?: string;
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}
