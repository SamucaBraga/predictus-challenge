'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { cn } from '@/helpers/utils';
import { submitDocument } from '@/lib/actions/registration';
import { useFormState } from '@/lib/hooks/use-form-state';

type DocumentType = 'cpf' | 'cnpj';

interface Props {
  initialDocumentType: DocumentType | null;
  initialDocumentNumber: string | null;
  editFromReview: boolean;
}

export function FormDocument({
  initialDocumentType,
  initialDocumentNumber,
  editFromReview,
}: Props) {
  const router = useRouter();
  const [docType, setDocType] = useState<DocumentType>(initialDocumentType ?? 'cpf');

  const [state, handleSubmit, isPending] = useFormState(submitDocument, () => {
    router.push(editFromReview ? '/signup/review' : '/signup/contact');
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <TypeToggle active={docType === 'cpf'} onClick={() => setDocType('cpf')}>
          CPF
        </TypeToggle>
        <TypeToggle active={docType === 'cnpj'} onClick={() => setDocType('cnpj')}>
          CNPJ
        </TypeToggle>
      </div>

      <input type="hidden" name="document_type" value={docType} />

      <FormField.Root>
        <FormField.Label htmlFor="document_number">
          {docType === 'cpf' ? 'CPF' : 'CNPJ'}
        </FormField.Label>
        <Input.Root error={!!state.errors?.document_number}>
          <MaskedInput
            id="document_number"
            name="document_number"
            mask={docType}
            defaultValue={initialDocumentNumber ?? ''}
            autoFocus
          />
        </Input.Root>
        <FormField.Message error={state.errors?.document_number} />
      </FormField.Root>

      {state.errors?._form && (
        <p className="text-sm text-red-600">{state.errors._form[0]}</p>
      )}

      <Button type="submit" size="lg" disabled={isPending} loading={isPending}>
        {editFromReview ? 'Salvar' : 'Continuar'}
      </Button>
    </form>
  );
}

function TypeToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-lg py-2 text-sm font-medium transition',
        active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700',
      )}
    >
      {children}
    </button>
  );
}
