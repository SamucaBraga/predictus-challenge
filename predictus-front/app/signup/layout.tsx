import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getRegistrationState, type RegistrationState } from '@/lib/actions/_state';

function expectedRoute(state: RegistrationState | null): string {
  if (!state || state.status === 'abandoned') return '/signup/identification';
  if (state.status === 'finished') return '/signup/success';
  if (state.currentStep === 1 && !state.mfaValidated) return '/signup/verify';
  if (state.currentStep <= 2) return '/signup/document';
  if (state.currentStep === 3) return '/signup/contact';
  if (state.currentStep === 4) return '/signup/address';
  if (state.currentStep === 5) return '/signup/review';
  return '/signup/identification';
}

export default async function Layout({ children }: { children: ReactNode }) {
  const path = (await headers()).get('x-pathname') ?? '/signup/identification';

  const state = await getRegistrationState();

  const expected = expectedRoute(state);

  if (path !== expected) redirect(expected);

  return <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white shadow-sm">{children}</main>
}
