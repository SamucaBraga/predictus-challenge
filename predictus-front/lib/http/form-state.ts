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
  registration_already_finished: ['_form', 'Email já cadastrado.'],
  cep_not_found: ['_form', 'CEP não encontrado.'],
  registration_not_found: ['_form', 'Cadastro não encontrado.'],
};

export function mapKyErrorToFormState(err: unknown): FormState<never> {
  if (!(err instanceof HTTPError)) {
    return { success: false, message: null, errors: { _form: ['Erro de rede. Tente novamente.'] } };
  }

  const { error, attemptsLeft } = err.data || {};

  const entry = error ? SLUG_TO_ERROR[error] : undefined;
  if (!entry) return { success: false, message: null, errors: { _form: ['Erro inesperado.'] } };

  const [field, baseMessage] = entry;

  const message =
    error === 'invalid_code' && attemptsLeft != null
      ? `Código inválido. Tentativas restantes: ${attemptsLeft}`
      : baseMessage;

  return { success: false, message: null, errors: { [field]: [message] } };
}
