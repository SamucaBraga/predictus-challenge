'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { submitContact } from '@/lib/actions/registration';
import { useFormState } from '@/lib/hooks/use-form-state';

interface Props {
  initialPhone: string | null;
  editFromReview: boolean;
}

export function FormContact({ initialPhone, editFromReview }: Props) {
  const router = useRouter();
  const [state, handleSubmit, isPending] = useFormState(submitContact, () => {
    router.push(editFromReview ? '/signup/review' : '/signup/address');
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField.Root>
        <FormField.Label htmlFor="phone">Celular</FormField.Label>
        <Input.Root error={!!state.errors?.phone}>
          <MaskedInput
            id="phone"
            name="phone"
            mask="phone"
            defaultValue={initialPhone ?? ''}
            autoFocus
          />
        </Input.Root>
        <FormField.Message
          error={state.errors?.phone}
          hint="Apenas celulares (com 9 inicial)"
        />
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
