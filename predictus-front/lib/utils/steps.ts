export const STEP_ROUTES = [
  '/cadastro/identificacao',
  '/cadastro/verificar',
  '/cadastro/documento',
  '/cadastro/contato',
  '/cadastro/endereco',
  '/cadastro/revisao',
] as const;

export function routeForStep(step: number, mfaValidated: boolean): string {
  if (step === 1 && !mfaValidated) return '/cadastro/identificacao';
  if (step === 1 && mfaValidated) return '/cadastro/documento';
  if (step === 2) return '/cadastro/documento';
  if (step === 3) return '/cadastro/contato';
  if (step === 4) return '/cadastro/endereco';
  if (step >= 5) return '/cadastro/revisao';
  return '/cadastro/identificacao';
}
