import { HTTPError } from 'ky';

export interface FormState<T> {
  success: boolean;
  message: string | null;
  errors: Record<string, string[]> | null;
  data?: T;
}

export const INITIAL_STATE: FormState<unknown> = {
  success: false,
  message: null,
  errors: null,
  data: undefined,
};

export function makeSuccess<T>(data?: T, message: string | null = null): FormState<T> {
  return { success: true, message, errors: null, data };
}

export function makeFailure(
  errors: Record<string, string[]>,
  message: string | null = null,
): FormState<never> {
  return { success: false, message, errors, data: undefined };
}

const SLUG_TO_ERROR: Record<string, [field: string, message: string]> = {
  invalid_code: ['code', 'Código inválido.'],
  expired_code: ['code', 'Código expirado. Reenvie e tente de novo.'],
  too_many_attempts: ['code', 'Muitas tentativas. Reenvie um novo código.'],
  invalid_token: ['_form', 'Link inválido. Reinicie o cadastro.'],
  expired_token: ['_form', 'Link expirado. Reinicie o cadastro.'],
  no_session: ['_form', 'Sessão expirada. Reinicie o cadastro.'],
  mfa_not_validated: ['_form', 'Confirme o código de verificação primeiro.'],
  step_not_allowed: ['_form', 'Etapa não permitida.'],
  incomplete_data: ['_form', 'Faltam dados para concluir o cadastro.'],
  registration_already_finished: ['_form', 'Cadastro já finalizado.'],
  cep_not_found: ['_form', 'CEP não encontrado.'],
  registration_not_found: ['_form', 'Cadastro não encontrado.'],
};

export async function mapKyErrorToFormState(err: unknown): Promise<FormState<never>> {
  if (!(err instanceof HTTPError)) {
    return makeFailure({ _form: ['Erro de rede. Tente novamente.'] });
  }

  const body = (await err.response.json().catch(() => ({}))) as {
    error?: string;
    attemptsLeft?: number;
  };

  const entry = body.error ? SLUG_TO_ERROR[body.error] : undefined;
  if (!entry) return makeFailure({ _form: ['Erro inesperado.'] });

  const [field, baseMessage] = entry;
  
  const message =
    body.error === 'invalid_code' && body.attemptsLeft != null
      ? `Código inválido. Tentativas restantes: ${body.attemptsLeft}`
      : baseMessage;
  return makeFailure({ [field]: [message] });
}
