import { useCallback, useEffect, useState } from 'react';

import type { AvailabilityExceptionService } from '../services';
import type {
  AvailabilityException,
  AvailabilityExceptionFilters,
  CreateAvailabilityExceptionInput,
  UpdateAvailabilityExceptionInput,
} from '../types';

export interface AvailabilityExceptionQueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface AvailabilityExceptionMutationState<TArguments extends unknown[], TResult> {
  mutate: (...args: TArguments) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useAvailabilityExceptions(
  service: AvailabilityExceptionService,
  businessId: string,
  filters?: AvailabilityExceptionFilters,
): AvailabilityExceptionQueryState<AvailabilityException[]> {
  const [data, setData] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const filterKey = JSON.stringify(filters ?? {});
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await service.listExceptions(businessId, filters));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, businessId, filterKey]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useAvailabilityException(
  service: AvailabilityExceptionService,
  businessId: string,
  id: string | null,
): AvailabilityExceptionQueryState<AvailabilityException | null> {
  const [data, setData] = useState<AvailabilityException | null>(null);
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
      setData(await service.getException(businessId, id));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  }, [service, businessId, id]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useCreateAvailabilityException(service: AvailabilityExceptionService, businessId: string) {
  return useMutation<[CreateAvailabilityExceptionInput], AvailabilityException>(
    (input) => service.createException(businessId, input),
  );
}

export function useUpdateAvailabilityException(service: AvailabilityExceptionService, businessId: string) {
  return useMutation<[string, UpdateAvailabilityExceptionInput], AvailabilityException>(
    (id, input) => service.updateException(businessId, id, input),
  );
}

export function useArchiveAvailabilityException(service: AvailabilityExceptionService, businessId: string) {
  return useMutation<[string], AvailabilityException>((id) => service.archiveException(businessId, id));
}

export function useRestoreAvailabilityException(service: AvailabilityExceptionService, businessId: string) {
  return useMutation<[string], AvailabilityException>((id) => service.restoreException(businessId, id));
}

function useMutation<TArguments extends unknown[], TResult>(operation: (...args: TArguments) => Promise<TResult>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mutate = useCallback(async (...args: TArguments) => {
    setLoading(true);
    setError(null);
    try {
      return await operation(...args);
    } catch (cause) {
      const next = toError(cause);
      setError(next);
      throw next;
    } finally {
      setLoading(false);
    }
  }, [operation]);
  return { mutate, loading, error, reset: useCallback(() => setError(null), []) };
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error('An unknown availability-exception error occurred.');
}
