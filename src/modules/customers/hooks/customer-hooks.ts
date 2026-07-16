import { useCallback, useEffect, useState } from 'react';

import type { CustomerService } from '../services';
import type {
  CreateCustomerInput,
  Customer,
  CustomerFilters,
  UpdateCustomerInput,
} from '../types';

export interface CustomerQueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface CustomerMutationState<TArguments extends unknown[], TResult> {
  mutate: (...args: TArguments) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useCustomers(
  service: CustomerService,
  businessId: string,
  filters?: CustomerFilters,
): CustomerQueryState<Customer[]> {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const filterKey = JSON.stringify(filters ?? {});
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await service.list(businessId, filters));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  // filterKey provides value-based dependencies for plain filter objects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, businessId, filterKey]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useCustomer(
  service: CustomerService,
  businessId: string,
  id: string | null,
): CustomerQueryState<Customer | null> {
  const [data, setData] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<Error | null>(null);
  const refetch = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await service.getById(businessId, id));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  }, [service, businessId, id]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useCreateCustomer(
  service: CustomerService,
  businessId: string,
): CustomerMutationState<[CreateCustomerInput], Customer> {
  return useCustomerMutation((input) => service.create(businessId, input));
}

export function useUpdateCustomer(
  service: CustomerService,
  businessId: string,
): CustomerMutationState<[string, UpdateCustomerInput], Customer> {
  return useCustomerMutation((id, input) => service.update(businessId, id, input));
}

export function useDeleteCustomer(
  service: CustomerService,
  businessId: string,
): CustomerMutationState<[string], void> {
  return useCustomerMutation((id) => service.delete(businessId, id));
}

function useCustomerMutation<TArguments extends unknown[], TResult>(
  operation: (...args: TArguments) => Promise<TResult>,
): CustomerMutationState<TArguments, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mutate = useCallback(async (...args: TArguments) => {
    setLoading(true);
    setError(null);
    try {
      return await operation(...args);
    } catch (cause) {
      const nextError = toError(cause);
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [operation]);
  const reset = useCallback(() => setError(null), []);
  return { mutate, loading, error, reset };
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error('An unknown customer error occurred.');
}
