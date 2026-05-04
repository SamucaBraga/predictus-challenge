'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { resendMfa, verifyMfa } from '@/lib/actions/registration';
import { useFormState } from '@/lib/hooks/use-form-state';

export function FormMfa() {
  const router = useRouter();
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [isResending, startResend] = useTransition();

  const [state, handleSubmit, isPending] = useFormState(verifyMfa, () => {
    router.push('/signup/document');
  });

  function handleResend() {
    setResendNotice(null);
    startResend(async () => {
      const result = await resendMfa();
      setResendNotice(result.success ? 'Novo código enviado.' : 'Falha ao reenviar.');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField.Root>
        <FormField.Label htmlFor="code">Código de 6 dígitos</FormField.Label>
        <Input.Root error={!!state.errors?.code}>
          <Input.Control
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            autoFocus
            required
            className="tracking-widest"
          />
        </Input.Root>
        <FormField.Message error={state.errors?.code} />
      </FormField.Root>

      {state.errors?._form && (
        <p className="text-sm text-red-600">{state.errors._form[0]}</p>
      )}
      {resendNotice && <p className="text-sm text-gray-700">{resendNotice}</p>}

      <Button type="submit" size="lg" disabled={isPending} loading={isPending}>
        Verificar
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={isResending}
        className="text-sm text-primary underline disabled:opacity-50"
      >
        {isResending ? 'Reenviando…' : 'Reenviar código'}
      </button>
    </form>
  );
}
