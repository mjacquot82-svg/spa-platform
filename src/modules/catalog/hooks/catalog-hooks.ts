import { useCallback, useEffect, useState } from 'react';
import type { CatalogItem, CatalogItemFilters, CreateCatalogItemInput, UpdateCatalogItemInput } from '../types';
import type { CatalogItemService } from '../services';

export interface CatalogQueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface CatalogMutationState<TArguments extends unknown[], TResult> {
  mutate: (...args: TArguments) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useCatalogItems(
  service: CatalogItemService,
  businessId: string,
  filters?: CatalogItemFilters,
): CatalogQueryState<CatalogItem[]> {
  const [data, setData] = useState<CatalogItem[]>([]);
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
  // filterKey provides stable value-based dependencies for plain filter objects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, businessId, filterKey]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

export function useCatalogItem(
  service: CatalogItemService,
  businessId: string,
  id: string | null,
): CatalogQueryState<CatalogItem | null> {
  const [data, setData] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!id) { setData(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try { setData(await service.getById(businessId, id)); }
    catch (cause) { setError(toError(cause)); }
    finally { setLoading(false); }
  }, [service, businessId, id]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

export function useCreateCatalogItem(
  service: CatalogItemService,
  businessId: string,
): CatalogMutationState<[CreateCatalogItemInput], CatalogItem> {
  return useCatalogMutation((input) => service.create(businessId, input));
}

export function useUpdateCatalogItem(
  service: CatalogItemService,
  businessId: string,
): CatalogMutationState<[string, UpdateCatalogItemInput], CatalogItem> {
  return useCatalogMutation((id, input) => service.update(businessId, id, input));
}

export function useDeleteCatalogItem(
  service: CatalogItemService,
  businessId: string,
): CatalogMutationState<[string], void> {
  return useCatalogMutation((id) => service.delete(businessId, id));
}

function useCatalogMutation<TArguments extends unknown[], TResult>(
  operation: (...args: TArguments) => Promise<TResult>,
): CatalogMutationState<TArguments, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mutate = useCallback(async (...args: TArguments) => {
    setLoading(true);
    setError(null);
    try { return await operation(...args); }
    catch (cause) { const nextError = toError(cause); setError(nextError); throw nextError; }
    finally { setLoading(false); }
  }, [operation]);
  const reset = useCallback(() => setError(null), []);
  return { mutate, loading, error, reset };
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error('An unknown catalog error occurred.');
}
