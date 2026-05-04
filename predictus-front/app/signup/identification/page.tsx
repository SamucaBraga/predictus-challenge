import { FormIdentification } from '@/components/forms/form-identification';
import { StepLayout } from '@/components/ui/step-layout';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: 'O link de retomada é inválido. Reinicie o cadastro abaixo.',
  expired_token: 'O link de retomada expirou. Reinicie o cadastro abaixo.',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const banner = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <StepLayout.Root>
      <StepLayout.Header
        title="Vamos começar"
        description="Preencha seus dados básicos para iniciar o cadastro."
      />
      <StepLayout.Body>
        {banner && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {banner}
          </div>
        )}
        <FormIdentification />
      </StepLayout.Body>
    </StepLayout.Root>
  );
}
