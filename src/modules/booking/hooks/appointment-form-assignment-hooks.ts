import { useCallback, useEffect, useState } from 'react';

import type { AppointmentFormAssignmentService } from '../services';
import type { AppointmentFormAssignment, CreateAppointmentFormAssignmentInput } from '../types';

export interface AppointmentFormAssignmentQueryState { data: AppointmentFormAssignment[]; loading: boolean; error: Error | null; refetch: () => Promise<void>; }
export interface AppointmentFormAssignmentMutationState { mutate: (input: CreateAppointmentFormAssignmentInput) => Promise<AppointmentFormAssignment>; loading: boolean; error: Error | null; reset: () => void; }

export function useAppointmentFormAssignments(service: AppointmentFormAssignmentService, businessId: string, appointmentId: string | null): AppointmentFormAssignmentQueryState {
  const [data, setData] = useState<AppointmentFormAssignment[]>([]);
  const [loading, setLoading] = useState(Boolean(appointmentId));
  const [error, setError] = useState<Error | null>(null);
  const refetch = useCallback(async () => {
    if (!appointmentId) { setData([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setData(await service.listForAppointment(businessId, appointmentId)); } catch (cause) { setError(toError(cause)); } finally { setLoading(false); }
  }, [service, businessId, appointmentId]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useAssignAppointmentForm(service: AppointmentFormAssignmentService, businessId: string): AppointmentFormAssignmentMutationState {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mutate = useCallback(async (input: CreateAppointmentFormAssignmentInput) => {
    setLoading(true); setError(null);
    try { return await service.assignForm(businessId, input); } catch (cause) { const next = toError(cause); setError(next); throw next; } finally { setLoading(false); }
  }, [service, businessId]);
  return { mutate, loading, error, reset: useCallback(() => setError(null), []) };
}

function toError(cause: unknown): Error { return cause instanceof Error ? cause : new Error('An unknown appointment form assignment error occurred.'); }
