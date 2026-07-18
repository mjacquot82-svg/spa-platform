import { useCallback, useEffect, useState } from 'react';

import type { SchedulingResourceService } from '../services';
import type {
  CreateSchedulingResourceInput,
  SchedulingResource,
  SchedulingResourceFilters,
  UpdateSchedulingResourceInput,
} from '../types';

export interface SchedulingResourceQueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface SchedulingResourceMutationState<TArguments extends unknown[], TResult> {
  mutate: (...args: TArguments) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useSchedulingResources(
  service: SchedulingResourceService,
  businessId: string,
  filters?: SchedulingResourceFilters,
): SchedulingResourceQueryState<SchedulingResource[]> {
  const [data, setData] = useState<SchedulingResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const filterKey = JSON.stringify(filters ?? {});

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await service.listResources(businessId, filters));
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

export function useSchedulingResource(
  service: SchedulingResourceService,
  businessId: string,
  id: string | null,
): SchedulingResourceQueryState<SchedulingResource | null> {
  const [data, setData] = useState<SchedulingResource | null>(null);
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
      setData(await service.getResource(businessId, id));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  }, [service, businessId, id]);

  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useCreateSchedulingResource(
  service: SchedulingResourceService,
  businessId: string,
): SchedulingResourceMutationState<[CreateSchedulingResourceInput], SchedulingResource> {
  return useResourceMutation((input) => service.createResource(businessId, input));
}

export function useUpdateSchedulingResource(
  service: SchedulingResourceService,
  businessId: string,
): SchedulingResourceMutationState<[string, UpdateSchedulingResourceInput], SchedulingResource> {
  return useResourceMutation((id, input) => service.updateResource(businessId, id, input));
}

export function useArchiveSchedulingResource(
  service: SchedulingResourceService,
  businessId: string,
): SchedulingResourceMutationState<[string], SchedulingResource> {
  return useResourceMutation((id) => service.archiveResource(businessId, id));
}

export function useRestoreSchedulingResource(
  service: SchedulingResourceService,
  businessId: string,
): SchedulingResourceMutationState<[string], SchedulingResource> {
  return useResourceMutation((id) => service.restoreResource(businessId, id));
}

function useResourceMutation<TArguments extends unknown[], TResult>(
  operation: (...args: TArguments) => Promise<TResult>,
): SchedulingResourceMutationState<TArguments, TResult> {
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
  return cause instanceof Error ? cause : new Error('An unknown scheduling resource error occurred.');
}
