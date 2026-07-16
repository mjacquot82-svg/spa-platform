import type { Address } from '../../shared/types';

/** @deprecated Use the shared Address type. */
export type BusinessAddress = Address;

export interface Business {
  id: string;
  name: string;
  legalName?: string;
  email: string;
  phone: string;
  website: string;
  logo: string;
  address: Address;
  timezone: string;
  currency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateBusinessInput = Omit<
  Business,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateBusinessInput = Partial<CreateBusinessInput>;

export interface BusinessRow {
  id: string;
  name: string;
  legal_name: string | null;
  email: string;
  phone: string;
  website: string;
  logo: string;
  address: Address;
  timezone: string;
  currency: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
