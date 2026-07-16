import type { CatalogItem, CatalogItemFilters, CreateCatalogItemInput, UpdateCatalogItemInput } from '../types';
import { CatalogValidationError } from '../types';
import type { CatalogItemRepository } from './catalog-item.repository';
import { validateCatalogItem } from './catalog-item.validation';

export class CatalogItemService {
  constructor(private readonly repository: CatalogItemRepository) {}

  list(businessId: string, filters?: CatalogItemFilters): Promise<CatalogItem[]> {
    return this.repository.list(requireId(businessId, 'businessId'), filters);
  }

  getById(businessId: string, id: string): Promise<CatalogItem | null> {
    return this.repository.getById(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }

  create(businessId: string, input: CreateCatalogItemInput): Promise<CatalogItem> {
    assertValid(input, false);
    return this.repository.create(requireId(businessId, 'businessId'), input);
  }

  update(businessId: string, id: string, input: UpdateCatalogItemInput): Promise<CatalogItem> {
    assertValid(input, true);
    return this.repository.update(requireId(businessId, 'businessId'), requireId(id, 'id'), input);
  }

  delete(businessId: string, id: string): Promise<void> {
    return this.repository.delete(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }
}

function assertValid(input: CreateCatalogItemInput | UpdateCatalogItemInput, partial: boolean): void {
  const result = validateCatalogItem(input, partial);
  if (!result.valid) throw new CatalogValidationError(result.issues);
}

function requireId(value: string, field: string): string {
  if (!value.trim()) throw new TypeError(`${field} is required.`);
  return value;
}
