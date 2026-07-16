import type {
  CreateCustomerInput,
  Customer,
  CustomerInsert,
  CustomerJson,
  CustomerRow,
  CustomerUpdate,
  UpdateCustomerInput,
} from '../types';

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    businessId: row.business_id,
    ...(row.customer_number ? { customerNumber: row.customer_number } : {}),
    firstName: row.first_name,
    lastName: row.last_name,
    ...(row.company_name ? { companyName: row.company_name } : {}),
    email: row.email,
    phone: row.phone,
    address: row.address as Customer['address'],
    notes: row.notes,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function toCustomerInsert(
  businessId: string,
  input: CreateCustomerInput,
): CustomerInsert {
  return {
    business_id: businessId,
    customer_number: input.customerNumber ?? null,
    first_name: input.firstName,
    last_name: input.lastName,
    company_name: input.companyName ?? null,
    email: input.email,
    phone: input.phone,
    address: input.address as CustomerJson,
    notes: input.notes,
    active: input.active,
  };
}

export function toCustomerUpdate(input: UpdateCustomerInput): CustomerUpdate {
  return {
    ...('customerNumber' in input ? { customer_number: input.customerNumber ?? null } : {}),
    ...('firstName' in input ? { first_name: input.firstName } : {}),
    ...('lastName' in input ? { last_name: input.lastName } : {}),
    ...('companyName' in input ? { company_name: input.companyName ?? null } : {}),
    ...('email' in input ? { email: input.email } : {}),
    ...('phone' in input ? { phone: input.phone } : {}),
    ...('address' in input ? { address: input.address as CustomerJson } : {}),
    ...('notes' in input ? { notes: input.notes } : {}),
    ...('active' in input ? { active: input.active } : {}),
  };
}
