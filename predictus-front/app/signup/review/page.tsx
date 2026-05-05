import { ReviewSummary } from '@/components/forms/review-summary';
import { StepLayout } from '@/components/ui/step-layout';
import { getRegistrationState } from '@/lib/actions/_state';

export default async function Page() {
  const state = await getRegistrationState();
  if (!state) return null;

  return (
    <StepLayout.Root>
      <StepLayout.Header
        title="Revisão"
        description="Confira os dados antes de finalizar o cadastro."
      />
      <StepLayout.Body>
        <ReviewSummary data={state.partialData} />
      </StepLayout.Body>
    </StepLayout.Root>
  );
}
