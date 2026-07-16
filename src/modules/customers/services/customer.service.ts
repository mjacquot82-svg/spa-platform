import type {
  CreateCustomerInput,
  Customer,
  CustomerFilters,
  UpdateCustomerInput,
} from '../types';
import { CustomerValidationError } from '../types';
import type { CustomerRepository } from './customer.repository';
import { validateCustomer } from './customer.validation';

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  list(businessId: string, filters?: CustomerFilters): Promise<Customer[]> {
    validateFilters(filters);
    return this.repository.list(requireId(businessId, 'businessId'), normalizeFilters(filters));
  }

  getById(businessId: string, id: string): Promise<Customer | null> {
    return this.repository.getById(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }

  create(businessId: string, input: CreateCustomerInput): Promise<Customer> {
    assertValid(input, false);
    return this.repository.create(requireId(businessId, 'businessId'), normalizeCreate(input));
  }

  update(businessId: string, id: string, input: UpdateCustomerInput): Promise<Customer> {
    assertValid(input, true);
    return this.repository.update(
      requireId(businessId, 'businessId'),
      requireId(id, 'id'),
      normalizeUpdate(input),
    );
  }

  delete(businessId: string, id: string): Promise<void> {
    return this.repository.delete(requireId(businessId, 'businessId'), requireId(id, 'id'));
  }
}

function assertValid(input: CreateCustomerInput | UpdateCustomerInput, partial: boolean): void {
  const result = validateCustomer(input, partial);
  if (!result.valid) throw new CustomerValidationError(result.issues);
}

function requireId(value: string, field: string): string {
  if (!value.trim()) throw new TypeError(`${field} is required.`);
  return value.trim();
}

function validateFilters(filters?: CustomerFilters): void {
  if (filters?.limit !== undefined && (!Number.isInteger(filters.limit) || filters.limit < 1)) {
    throw new TypeError('limit must be a positive integer.');
  }
  if (filters?.offset !== undefined && (!Number.isInteger(filters.offset) || filters.offset < 0)) {
    throw new TypeError('offset must be a non-negative integer.');
  }
}

function normalizeFilters(filters?: CustomerFilters): CustomerFilters | undefined {
  if (!filters) return undefined;
  return { ...filters, ...(filters.search ? { search: filters.search.trim() } : {}) };
}

function normalizeCreate(input: CreateCustomerInput): CreateCustomerInput {
  return {
    ...input,
    ...(input.customerNumber ? { customerNumber: input.customerNumber.trim() } : {}),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    ...(input.companyName ? { companyName: input.companyName.trim() } : {}),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    address: normalizeAddress(input.address),
    notes: input.notes.trim(),
  };
}

function normalizeUpdate(input: UpdateCustomerInput): UpdateCustomerInput {
  return {
    ...input,
    ...('customerNumber' in input
      ? { customerNumber: input.customerNumber?.trim() }
      : {}),
    ...(input.firstName !== undefined ? { firstName: input.firstName.trim() } : {}),
    ...(input.lastName !== undefined ? { lastName: input.lastName.trim() } : {}),
    ...('companyName' in input ? { companyName: input.companyName?.trim() } : {}),
    ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
    ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
    ...(input.address !== undefined ? { address: normalizeAddress(input.address) } : {}),
    ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
  };
}

function normalizeAddress(address: CreateCustomerInput['address']) {
  return {
    line1: address.line1.trim(),
    ...(address.line2 ? { line2: address.line2.trim() } : {}),
    ...(address.city ? { city: address.city.trim() } : {}),
    ...(address.region ? { region: address.region.trim() } : {}),
    ...(address.postalCode ? { postalCode: address.postalCode.trim() } : {}),
    country: address.country.trim().toUpperCase(),
  };
}
