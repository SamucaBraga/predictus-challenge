'use server';

import { backendApi } from '@/lib/http/backend-api';
import { logger } from '@/lib/logger';

export interface CepData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function lookupCep(cep: string): Promise<CepData | null> {
  if (!/^\d{8}$/.test(cep)) return null;

  try {
    return await backendApi.get(`cep/${cep}`).json<CepData>();
  } catch (error) {
    logger.warn({ error, cep }, 'CEP lookup failed');
    return null;
  }
}
