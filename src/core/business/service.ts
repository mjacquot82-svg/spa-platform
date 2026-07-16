import type { BusinessRepository } from './repository';
import type { Business, CreateBusinessInput, UpdateBusinessInput } from './types';
import { validateCreateBusiness, validateUpdateBusiness } from './validation';

function normalizeCreate(input: CreateBusinessInput): CreateBusinessInput {
  return {
    ...input,
    name: input.name.trim(),
    ...(input.legalName ? { legalName: input.legalName.trim() } : {}),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    website: input.website.trim(),
    logo: input.logo.trim(),
    address: {
      ...input.address,
      line1: input.address.line1.trim(),
      ...(input.address.line2 ? { line2: input.address.line2.trim() } : {}),
      ...(input.address.city ? { city: input.address.city.trim() } : {}),
      ...(input.address.region ? { region: input.address.region.trim() } : {}),
      ...(input.address.postalCode ? { postalCode: input.address.postalCode.trim() } : {}),
      country: input.address.country.trim().toUpperCase(),
    },
    timezone: input.timezone.trim(),
    currency: input.currency.trim().toUpperCase(),
  };
}

function normalizeUpdate(input: UpdateBusinessInput): UpdateBusinessInput {
  const normalized: UpdateBusinessInput = { ...input };

  if (input.name !== undefined) normalized.name = input.name.trim();
  if (input.legalName !== undefined) normalized.legalName = input.legalName.trim();
  if (input.email !== undefined) normalized.email = input.email.trim().toLowerCase();
  if (input.phone !== undefined) normalized.phone = input.phone.trim();
  if (input.website !== undefined) normalized.website = input.website.trim();
  if (input.logo !== undefined) normalized.logo = input.logo.trim();
  if (input.address !== undefined) {
    normalized.address = {
      ...input.address,
      line1: input.address.line1.trim(),
      ...(input.address.line2 ? { line2: input.address.line2.trim() } : {}),
      ...(input.address.city ? { city: input.address.city.trim() } : {}),
      ...(input.address.region ? { region: input.address.region.trim() } : {}),
      ...(input.address.postalCode ? { postalCode: input.address.postalCode.trim() } : {}),
      country: input.address.country.trim().toUpperCase(),
    };
  }
  if (input.timezone !== undefined) normalized.timezone = input.timezone.trim();
  if (input.currency !== undefined) normalized.currency = input.currency.trim().toUpperCase();

  return normalized;
}

export class BusinessService {
  constructor(private readonly repository: BusinessRepository) {}

  list(): Promise<Business[]> {
    return this.repository.list();
  }

  getById(id: string): Promise<Business | null> {
    if (!id.trim()) throw new Error('Business id is required');
    return this.repository.getById(id);
  }

  create(input: CreateBusinessInput): Promise<Business> {
    validateCreateBusiness(input);
    return this.repository.create(normalizeCreate(input));
  }

  update(id: string, input: UpdateBusinessInput): Promise<Business> {
    if (!id.trim()) throw new Error('Business id is required');
    validateUpdateBusiness(input);

    return this.repository.update(id, normalizeUpdate(input));
  }
}
