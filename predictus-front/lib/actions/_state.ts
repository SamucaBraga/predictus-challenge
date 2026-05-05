import 'server-only';
import { backendApi } from '@/lib/http/backend-api';
import { logger } from '@/lib/logger';

export type RegistrationStatus = 'in_progress' | 'finished' | 'abandoned';

export interface RegistrationState {
  id: string;
  currentStep: number;
  status: RegistrationStatus;
  mfaValidated: boolean;
  partialData: Record<string, string | null>;
}

export async function getRegistrationState(): Promise<RegistrationState | null> {
  try {
    return await backendApi.get('registration/state').json<RegistrationState>();
  } catch (error) {
    logger.debug({ error }, 'getRegistrationState returned no state');
    return null;
  }
}
