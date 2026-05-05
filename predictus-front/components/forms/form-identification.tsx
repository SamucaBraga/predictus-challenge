'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { submitIdentification } from '@/lib/actions/registration';
import { useFormState } from '@/lib/hooks/use-form-state';

export function FormIdentification() {
  const router = useRouter();
  const [state, formAction, isPending] = useFormState(submitIdentification, () => {
    router.push('/signup/verify');
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField.Root>
        <FormField.Label htmlFor="name">Nome completo</FormField.Label>
        <Input.Root error={!!state.errors?.name}>
          <Input.Control
            id="name"
            name="name"
            placeholder="Seu nome"
            autoComplete="name"
            autoFocus
            required
          />
        </Input.Root>
        <FormField.Message error={state.errors?.name} />
      </FormField.Root>

      <FormField.Root>
        <FormField.Label htmlFor="email">E-mail</FormField.Label>
        <Input.Root error={!!state.errors?.email}>
          <Input.Control
            id="email"
            name="email"
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
            required
          />
        </Input.Root>
        <FormField.Message error={state.errors?.email} />
      </FormField.Root>

      {state.errors?._form && <p className="text-sm text-red-600">{state.errors._form[0]}</p>}

      <Button type="submit" size="lg" disabled={isPending} loading={isPending}>
        Continuar
      </Button>
    </form>
  );
}
