import { FormMfa } from '@/components/forms/form-mfa';
import { StepLayout } from '@/components/ui/step-layout';

export default function Page() {
  return (
    <StepLayout.Root>
      <StepLayout.Header
        title="Confirme seu e-mail"
        description="Enviamos um código de 6 dígitos para o seu e-mail. Insira-o abaixo."
      />
      <StepLayout.Body>
        <FormMfa />
      </StepLayout.Body>
    </StepLayout.Root>
  );
}
