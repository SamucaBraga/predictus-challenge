import { headers } from 'next/headers';
import { FormDocument } from '@/components/forms/form-document';
import { StepLayout } from '@/components/ui/step-layout';
import { getRegistrationState } from '@/lib/actions/_state';

export default async function Page() {
  const state = await getRegistrationState();
  const pathname = (await headers()).get('x-pathname') ?? '';
  const editFromReview = pathname.includes('edit=review');

  const documentType = state?.partialData.document_type as 'cpf' | 'cnpj' | null | undefined;
  const documentNumber = state?.partialData.document_number ?? null;

  return (
    <StepLayout.Root>
      <StepLayout.Header title="Documento" description="Informe seu CPF ou CNPJ." />
      <StepLayout.Body>
        <FormDocument
          initialDocumentType={documentType ?? null}
          initialDocumentNumber={documentNumber}
          editFromReview={editFromReview}
        />
      </StepLayout.Body>
    </StepLayout.Root>
  );
}
