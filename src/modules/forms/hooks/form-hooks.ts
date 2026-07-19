import { useCallback, useEffect, useState } from 'react';

import type { FormService } from '../services';
import type { CreateFormInput, CreateFormSubmissionInput, Form, FormFilters, FormSubmission, UpdateFormInput } from '../types';

export interface FormQueryState<T> { data: T; loading: boolean; error: Error | null; refetch: () => Promise<void>; }
export interface FormMutationState<TArgs extends unknown[], TResult> { mutate: (...args: TArgs) => Promise<TResult>; loading: boolean; error: Error | null; reset: () => void; }

export function useForms(service: FormService, businessId: string, filters?: FormFilters): FormQueryState<Form[]> {
  const [data, setData] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const filterKey = JSON.stringify(filters ?? {});
  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await service.listForms(businessId, filters)); } catch (cause) { setError(toError(cause)); } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, businessId, filterKey]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useForm(service: FormService, businessId: string, id: string | null): FormQueryState<Form | null> {
  const [data, setData] = useState<Form | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<Error | null>(null);
  const refetch = useCallback(async () => {
    if (!id) { setData(null); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setData(await service.getForm(businessId, id)); } catch (cause) { setError(toError(cause)); } finally { setLoading(false); }
  }, [service, businessId, id]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useFormSubmissions(service: FormService, businessId: string, formId?: string): FormQueryState<FormSubmission[]> {
  const [data, setData] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await service.listSubmissions(businessId, formId)); } catch (cause) { setError(toError(cause)); } finally { setLoading(false); }
  }, [service, businessId, formId]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useCreateForm(service: FormService, businessId: string): FormMutationState<[CreateFormInput], Form> { return useMutation((input) => service.createForm(businessId, input)); }
export function useUpdateForm(service: FormService, businessId: string): FormMutationState<[string, UpdateFormInput], Form> { return useMutation((id, input) => service.updateForm(businessId, id, input)); }
export function useSubmitForm(service: FormService, businessId: string): FormMutationState<[CreateFormSubmissionInput], FormSubmission> { return useMutation((input) => service.submitForm(businessId, input)); }

function useMutation<TArgs extends unknown[], TResult>(operation: (...args: TArgs) => Promise<TResult>): FormMutationState<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mutate = useCallback(async (...args: TArgs) => {
    setLoading(true); setError(null);
    try { return await operation(...args); } catch (cause) { const next = toError(cause); setError(next); throw next; } finally { setLoading(false); }
  }, [operation]);
  return { mutate, loading, error, reset: useCallback(() => setError(null), []) };
}

function toError(cause: unknown): Error { return cause instanceof Error ? cause : new Error('An unknown Forms error occurred.'); }
