import { useCallback, useEffect, useState } from 'react';

import type { WorkingHoursService } from '../services';
import type {
  CreateWorkingHoursInput,
  UpdateWorkingHoursInput,
  WorkingHours,
  WorkingHoursFilters,
} from '../types';

export interface WorkingHoursQueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface WorkingHoursMutationState<TArguments extends unknown[], TResult> {
  mutate: (...args: TArguments) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useWorkingHours(
  service: WorkingHoursService,
  businessId: string,
  filters?: WorkingHoursFilters,
): WorkingHoursQueryState<WorkingHours[]> {
  const [data, setData] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const filterKey = JSON.stringify(filters ?? {});
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await service.listWorkingHours(businessId, filters));
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

export function useWorkingHoursRecord(
  service: WorkingHoursService,
  businessId: string,
  id: string | null,
): WorkingHoursQueryState<WorkingHours | null> {
  const [data, setData] = useState<WorkingHours | null>(null);
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
      setData(await service.getWorkingHours(businessId, id));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  }, [service, businessId, id]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useCreateWorkingHours(
  service: WorkingHoursService,
  businessId: string,
): WorkingHoursMutationState<[CreateWorkingHoursInput], WorkingHours> {
  return useWorkingHoursMutation((input) => service.createWorkingHours(businessId, input));
}

export function useUpdateWorkingHours(
  service: WorkingHoursService,
  businessId: string,
): WorkingHoursMutationState<[string, UpdateWorkingHoursInput], WorkingHours> {
  return useWorkingHoursMutation((id, input) => service.updateWorkingHours(businessId, id, input));
}

export function useRemoveWorkingHours(
  service: WorkingHoursService,
  businessId: string,
): WorkingHoursMutationState<[string], void> {
  return useWorkingHoursMutation((id) => service.removeWorkingHours(businessId, id));
}

function useWorkingHoursMutation<TArguments extends unknown[], TResult>(
  operation: (...args: TArguments) => Promise<TResult>,
): WorkingHoursMutationState<TArguments, TResult> {
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
  return cause instanceof Error ? cause : new Error('An unknown working-hours error occurred.');
}
