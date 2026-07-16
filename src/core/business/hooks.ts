import { useCallback, useEffect, useState } from 'react';

import type { BusinessService } from './service';
import type { Business, CreateBusinessInput, UpdateBusinessInput } from './types';

export interface BusinessQuery<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useBusinesses(service: BusinessService): BusinessQuery<Business[]> {
  const [data, setData] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await service.list());
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useBusiness(
  service: BusinessService,
  id: string | null,
): BusinessQuery<Business | null> {
  const [data, setData] = useState<Business | null>(null);
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
      setData(await service.getById(id));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  }, [id, service]);

  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useBusinessMutations(service: BusinessService) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(async (operation: () => Promise<Business>) => {
    setLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (cause) {
      const nextError = toError(cause);
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    (input: CreateBusinessInput) => run(() => service.create(input)),
    [run, service],
  );
  const update = useCallback(
    (id: string, input: UpdateBusinessInput) => run(() => service.update(id, input)),
    [run, service],
  );

  return { create, update, loading, error };
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error('An unknown business error occurred.');
}
