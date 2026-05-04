'use server';

import type { ZodType } from 'zod';
import { backendApi } from '@/lib/http/backend-api';
import {
  type FormState,
  makeFailure,
  makeSuccess,
  mapKyErrorToFormState,
} from '@/lib/http/form-state';
import { logger } from '@/lib/logger';
import {
  addressSchema,
  contactSchema,
  documentSchema,
  identificationSchema,
  verifyMfaSchema,
} from '@/lib/schemas/registration';

async function postToBackend<T>(endpoint: string, body?: unknown): Promise<FormState<T>> {
  try {
    const req = body !== undefined ? backendApi.post(endpoint, { json: body }) : backendApi.post(endpoint);
    const data = await req.json<T>();
    return makeSuccess(data);
  } catch (error) {
    logger.error({ error, endpoint }, 'Backend POST failed');
    return mapKyErrorToFormState(error);
  }
}

async function submitWithSchema<T>(
  endpoint: string,
  schema: ZodType<unknown, unknown>,
  formData: FormData,
): Promise<FormState<T>> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return makeFailure(flat);
  }
  return postToBackend<T>(endpoint, parsed.data);
}

export async function submitIdentification(
  _prev: FormState<{ requiresMfa: boolean }>,
  formData: FormData,
): Promise<FormState<{ requiresMfa: boolean }>> {
  return submitWithSchema('registration/identification', identificationSchema, formData);
}

export async function verifyMfa(
  _prev: FormState<{ success: boolean }>,
  formData: FormData,
): Promise<FormState<{ success: boolean }>> {
  return submitWithSchema('registration/mfa/verify', verifyMfaSchema, formData);
}

export async function resendMfa(): Promise<FormState<{ sent: boolean }>> {
  return postToBackend<{ sent: boolean }>('registration/mfa/resend');
}

export async function submitDocument(
  _prev: FormState<unknown>,
  formData: FormData,
): Promise<FormState<unknown>> {
  return submitWithSchema('registration/document', documentSchema, formData);
}

export async function submitContact(
  _prev: FormState<unknown>,
  formData: FormData,
): Promise<FormState<unknown>> {
  return submitWithSchema('registration/contact', contactSchema, formData);
}

export async function submitAddress(
  _prev: FormState<unknown>,
  formData: FormData,
): Promise<FormState<unknown>> {
  return submitWithSchema('registration/address', addressSchema, formData);
}

export async function finishRegistration(): Promise<FormState<unknown>> {
  return postToBackend('registration/finish');
}
