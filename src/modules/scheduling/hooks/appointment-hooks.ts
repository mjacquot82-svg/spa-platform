import { useCallback, useEffect, useState } from 'react';

import type { AppointmentService } from '../services';
import type {
  Appointment,
  AppointmentFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../types';

export interface AppointmentQueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface AppointmentMutationState<TArguments extends unknown[], TResult> {
  mutate: (...args: TArguments) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useAppointments(
  service: AppointmentService,
  businessId: string,
  filters?: AppointmentFilters,
): AppointmentQueryState<Appointment[]> {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const filterKey = JSON.stringify(filters ?? {});
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await service.listAppointments(businessId, filters));
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

export function useAppointment(
  service: AppointmentService,
  businessId: string,
  id: string | null,
): AppointmentQueryState<Appointment | null> {
  const [data, setData] = useState<Appointment | null>(null);
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
      setData(await service.getAppointment(businessId, id));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  }, [service, businessId, id]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useCreateAppointment(service: AppointmentService, businessId: string) {
  return useMutation<[CreateAppointmentInput], Appointment>(
    (input) => service.createAppointment(businessId, input),
  );
}

export function useUpdateAppointment(service: AppointmentService, businessId: string) {
  return useMutation<[string, UpdateAppointmentInput], Appointment>(
    (id, input) => service.updateAppointment(businessId, id, input),
  );
}

export function useArchiveAppointment(service: AppointmentService, businessId: string) {
  return useMutation<[string], Appointment>((id) => service.archiveAppointment(businessId, id));
}

export function useRestoreAppointment(service: AppointmentService, businessId: string) {
  return useMutation<[string], Appointment>((id) => service.restoreAppointment(businessId, id));
}

function useMutation<TArguments extends unknown[], TResult>(
  operation: (...args: TArguments) => Promise<TResult>,
): AppointmentMutationState<TArguments, TResult> {
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
  return cause instanceof Error ? cause : new Error('An unknown appointment error occurred.');
}
