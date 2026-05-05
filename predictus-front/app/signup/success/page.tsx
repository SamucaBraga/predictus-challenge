import { StepLayout } from '@/components/ui/step-layout';

export default function Page() {
  return (
    <StepLayout.Root>
      <StepLayout.Header
        title="Cadastro concluído"
        description="Recebemos seus dados com sucesso."
      />
      <StepLayout.Body>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Tudo certo! Em breve entraremos em contato.
        </div>
      </StepLayout.Body>
    </StepLayout.Root>
  );
}
