import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { Stepper } from '@/components/ui/stepper';
import { getRegistrationState } from '@/lib/actions/_state';

const STEP_LABELS = ['Identificação', 'Verificação', 'Documento', 'Contato', 'Endereço', 'Revisão'];

const ROUTE_TO_INDEX: Record<string, number> = {
  '/signup/identification': 0,
  '/signup/verify': 1,
  '/signup/document': 2,
  '/signup/contact': 3,
  '/signup/address': 4,
  '/signup/review': 5,
  '/signup/success': 6,
};

const PUBLIC_ROUTES = new Set(['/signup/identification', '/signup/success']);

interface State {
  currentStep: number;
  status: 'in_progress' | 'finished' | 'abandoned';
  mfaValidated: boolean;
}

export default async function SignupLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const rawPathname = headersList.get('x-pathname') ?? '';
  const url = new URL(rawPathname || '/signup/identification', 'http://localhost');
  const path = url.pathname;
  const editFromReview = url.searchParams.get('edit') === 'review';

  if (PUBLIC_ROUTES.has(path)) {
    return <Shell currentLabelIndex={ROUTE_TO_INDEX[path] ?? 0}>{children}</Shell>;
  }

  const state = await getRegistrationState();
  if (!state) redirect('/signup/identification');
  if (state.status === 'finished') redirect('/signup/success');

  const requestedIndex = ROUTE_TO_INDEX[path] ?? 0;
  const allowedMaxIndex = computeAllowedMaxIndex(state.currentStep, state.mfaValidated);

  if (requestedIndex > allowedMaxIndex && !editFromReview) {
    redirect(allowedRoute(state));
  }

  if (path === '/signup/verify' && state.mfaValidated) {
    redirect('/signup/document');
  }

  return <Shell currentLabelIndex={ROUTE_TO_INDEX[path] ?? 0}>{children}</Shell>;
}

function computeAllowedMaxIndex(currentStep: number, mfaValidated: boolean): number {
  if (currentStep === 1 && !mfaValidated) return 1;
  if (currentStep === 1 && mfaValidated) return 2;
  if (currentStep === 2) return 2;
  if (currentStep === 3) return 3;
  if (currentStep === 4) return 4;
  if (currentStep >= 5) return 5;
  return 0;
}

function allowedRoute(state: State): string {
  if (state.currentStep === 1 && !state.mfaValidated) return '/signup/verify';
  if (state.currentStep <= 2) return '/signup/document';
  if (state.currentStep === 3) return '/signup/contact';
  if (state.currentStep === 4) return '/signup/address';
  return '/signup/review';
}

function Shell({ children, currentLabelIndex }: { children: ReactNode; currentLabelIndex: number }) {
  const userFacingStep = Math.min(currentLabelIndex + 1, STEP_LABELS.length);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white shadow-sm">
      <div className="px-5 pt-6">
        <Stepper current={userFacingStep} total={STEP_LABELS.length} labels={STEP_LABELS} />
      </div>
      {children}
    </main>
  );
}
