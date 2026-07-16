import type { Address } from '../../../shared/types';

/** @deprecated Use the shared Address type. */
export type CustomerAddress = Address;

export interface Customer {
  id: string;
  businessId: string;
  customerNumber?: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phone: string;
  address: Address;
  notes: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

type ManagedCustomerFields = 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'deletedAt';

export type CreateCustomerInput = Omit<Customer, ManagedCustomerFields>;
export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export interface CustomerFilters {
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}
