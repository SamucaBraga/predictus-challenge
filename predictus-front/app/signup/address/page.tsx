import { headers } from 'next/headers';
import { FormAddress } from '@/components/forms/form-address';
import { StepLayout } from '@/components/ui/step-layout';
import { getRegistrationState } from '@/lib/actions/_state';

export default async function Page() {
  const state = await getRegistrationState();
  const pathname = (await headers()).get('x-pathname') ?? '';
  const editFromReview = pathname.includes('edit=review');

  return (
    <StepLayout.Root>
      <StepLayout.Header
        title="Endereço"
        description="Digite o seu CEP"
      />
      <StepLayout.Body>
        <FormAddress initial={state?.partialData ?? {}} editFromReview={editFromReview} />
      </StepLayout.Body>
    </StepLayout.Root>
  );
}
