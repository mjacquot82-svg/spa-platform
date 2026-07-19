import { describe, expect, it } from 'vitest';

import { CatalogValidationError } from '../types';
import { InMemoryCatalogItemRepository } from './catalog-item.repository';
import { CatalogItemService } from './catalog-item.service';

const baseService = {
  type: 'Service' as const,
  name: 'Signature Massage',
  description: null,
  category: 'Massage',
  image: null,
  active: true,
};

describe('CatalogItemService scheduling metadata', () => {
  it('defaults buffers for a schedulable service', async () => {
    const service = new CatalogItemService(new InMemoryCatalogItemRepository());
    const created = await service.create('business-1', {
      ...baseService,
      durationMinutes: 60,
      resourceTypesRequired: ['staff'],
    });

    expect(created.type).toBe('Service');
    if (created.type !== 'Service') throw new Error('Expected a service.');
    expect(created.bufferBeforeMinutes).toBe(0);
    expect(created.bufferAfterMinutes).toBe(0);
    expect(created.resourceTypesRequired).toEqual(['staff']);
  });

  it('requires a positive integer duration for scheduling metadata', () => {
    const service = new CatalogItemService(new InMemoryCatalogItemRepository());

    expect(() => service.create('business-1', {
      ...baseService,
      bufferAfterMinutes: 15,
    })).toThrow(CatalogValidationError);
    expect(() => service.create('business-1', {
      ...baseService,
      durationMinutes: 0,
    })).toThrow(CatalogValidationError);
  });

  it('validates required resource types', () => {
    const service = new CatalogItemService(new InMemoryCatalogItemRepository());

    expect(() => service.create('business-1', {
      ...baseService,
      durationMinutes: 45,
      resourceTypesRequired: [],
    })).toThrow(CatalogValidationError);
  });
});
