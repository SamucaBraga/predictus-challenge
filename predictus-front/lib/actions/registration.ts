'use server';

import { HTTPError } from 'ky';
import { redirect } from 'next/navigation';
import { backendApi } from '@/lib/http/backend-api';
import { type FormState, mapKyErrorToFormState } from '@/lib/http/form-state';
import { logger } from '@/lib/logger';
import {
  addressSchema,
  contactSchema,
  documentSchema,
  identificationSchema,
  verifyMfaSchema,
} from '@/lib/schemas/registration';

const SESSION_LOST_REDIRECT = '/cadastro/identificacao?error=expired_token';

function isUnauthorized(error: unknown): boolean {
  return error instanceof HTTPError && error.response.status === 401;
}

export async function submitIdentification(
  _prev: FormState<{ requiresMfa: boolean }>,
  formData: FormData,
): Promise<FormState<{ requiresMfa: boolean }>> {
  const parsed = identificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: null,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const data = await backendApi
      .post('registration/identification', { json: parsed.data })
      .json<{ requiresMfa: boolean }>();
    return { success: true, message: null, errors: null, data };
  } catch (error) {
    logger.error({ error, step: 'identification' }, 'Identification step failed');
    return mapKyErrorToFormState(error);
  }
}

export async function verifyMfa(
  _prev: FormState<{ success: boolean }>,
  formData: FormData,
): Promise<FormState<{ success: boolean }>> {
  const parsed = verifyMfaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: null,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const data = await backendApi
      .post('registration/mfa/verify', { json: parsed.data })
      .json<{ success: boolean }>();
    return { success: true, message: null, errors: null, data };
  } catch (error) {
    if (isUnauthorized(error)) redirect(SESSION_LOST_REDIRECT);
    logger.error({ error, step: 'mfa-verify' }, 'MFA verify failed');
    return mapKyErrorToFormState(error);
  }
}

export async function resendMfa(): Promise<FormState<{ sent: boolean }>> {
  try {
    const data = await backendApi.post('registration/mfa/resend').json<{ sent: boolean }>();
    return { success: true, message: null, errors: null, data };
  } catch (error) {
    if (isUnauthorized(error)) redirect(SESSION_LOST_REDIRECT);
    logger.error({ error, step: 'mfa-resend' }, 'MFA resend failed');
    return mapKyErrorToFormState(error);
  }
}

export async function submitDocument(
  _prev: FormState<unknown>,
  formData: FormData,
): Promise<FormState<unknown>> {
  const parsed = documentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: null,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const data = await backendApi
      .post('registration/document', { json: parsed.data })
      .json<unknown>();
    return { success: true, message: null, errors: null, data };
  } catch (error) {
    if (isUnauthorized(error)) redirect(SESSION_LOST_REDIRECT);
    logger.error({ error, step: 'document' }, 'Document step failed');
    return mapKyErrorToFormState(error);
  }
}

export async function submitContact(
  _prev: FormState<unknown>,
  formData: FormData,
): Promise<FormState<unknown>> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: null,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const data = await backendApi
      .post('registration/contact', { json: parsed.data })
      .json<unknown>();
    return { success: true, message: null, errors: null, data };
  } catch (error) {
    if (isUnauthorized(error)) redirect(SESSION_LOST_REDIRECT);
    logger.error({ error, step: 'contact' }, 'Contact step failed');
    return mapKyErrorToFormState(error);
  }
}

export async function submitAddress(
  _prev: FormState<unknown>,
  formData: FormData,
): Promise<FormState<unknown>> {
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: null,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const data = await backendApi
      .post('registration/address', { json: parsed.data })
      .json<unknown>();
    return { success: true, message: null, errors: null, data };
  } catch (error) {
    if (isUnauthorized(error)) redirect(SESSION_LOST_REDIRECT);
    logger.error({ error, step: 'address' }, 'Address step failed');
    return mapKyErrorToFormState(error);
  }
}

export async function finishRegistration(): Promise<FormState<unknown>> {
  try {
    const data = await backendApi.post('registration/finish').json<unknown>();
    return { success: true, message: null, errors: null, data };
  } catch (error) {
    if (isUnauthorized(error)) redirect(SESSION_LOST_REDIRECT);
    logger.error({ error, step: 'finish' }, 'Finish step failed');
    return mapKyErrorToFormState(error);
  }
}
