import { headers } from 'next/headers';
import { FormContact } from '@/components/forms/form-contact';
import { StepLayout } from '@/components/ui/step-layout';
import { getRegistrationState } from '@/lib/actions/_state';

export default async function Page() {
  const state = await getRegistrationState();
  const pathname = (await headers()).get('x-pathname') ?? '';
  const editFromReview = pathname.includes('edit=review');

  return (
    <StepLayout.Root>
      <StepLayout.Header title="Contato" description="Informe seu telefone celular." />
      <StepLayout.Body>
        <FormContact
          initialPhone={state?.partialData.phone ?? null}
          editFromReview={editFromReview}
        />
      </StepLayout.Body>
    </StepLayout.Root>
  );
}
