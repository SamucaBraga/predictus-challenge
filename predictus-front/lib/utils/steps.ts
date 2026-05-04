export const STEP_ROUTES = [
  '/signup/identification',
  '/signup/verify',
  '/signup/document',
  '/signup/contact',
  '/signup/address',
  '/signup/review',
] as const;

export function routeForStep(step: number, mfaValidated: boolean): string {
  if (step === 1 && !mfaValidated) return '/signup/identification';
  if (step === 1 && mfaValidated) return '/signup/document';
  if (step === 2) return '/signup/document';
  if (step === 3) return '/signup/contact';
  if (step === 4) return '/signup/address';
  if (step >= 5) return '/signup/review';
  return '/signup/identification';
}
