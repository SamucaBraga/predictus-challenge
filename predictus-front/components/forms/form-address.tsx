'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { lookupCep } from '@/lib/actions/cep';
import { submitAddress } from '@/lib/actions/registration';
import { useFormState } from '@/lib/hooks/use-form-state';

type CepStatus = 'idle' | 'loading' | 'not_found';

interface InitialAddress {
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

interface Props {
  initial: InitialAddress;
}

export function FormAddress({ initial }: Props) {
  const router = useRouter();

  const [cepDigits, setCepDigits] = useState((initial.cep ?? '').replace(/\D/g, ''));
  const [street, setStreet] = useState(initial.street ?? '');
  const [neighborhood, setNeighborhood] = useState(initial.neighborhood ?? '');
  const [city, setCity] = useState(initial.city ?? '');
  const [stateUf, setStateUf] = useState(initial.state ?? '');
  const [cepStatus, setCepStatus] = useState<CepStatus>('idle');
  const lastFetched = useRef<string>('');

  useEffect(() => {
    if (cepDigits.length !== 8) {
      setCepStatus('idle');
      return;
    }

    if (cepDigits === lastFetched.current) return;

    const handle = setTimeout(async () => {
      lastFetched.current = cepDigits;
      setCepStatus('loading');
      const data = await lookupCep(cepDigits);
      if (!data) {
        setCepStatus('not_found');
        return;
      }
      setStreet(data.street ?? '');
      setNeighborhood(data.neighborhood ?? '');
      setCity(data.city ?? '');
      setStateUf(data.state ?? '');
      setCepStatus('idle');
    }, 300);

    return () => clearTimeout(handle);
  }, [cepDigits]);

  const [state, formAction, isPending] = useFormState(submitAddress, () => {
    router.push('/signup/review');
  });

  const cepHint =
    cepStatus === 'loading'
      ? 'Buscando…'
      : cepStatus === 'not_found'
        ? 'CEP não encontrado, preencha manualmente'
        : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField.Root>
        <FormField.Label htmlFor="cep">CEP</FormField.Label>
        <Input.Root error={!!state.errors?.cep}>
          <MaskedInput
            id="cep"
            name="cep"
            mask="cep"
            defaultValue={cepDigits}
            onValueChange={setCepDigits}
            autoFocus
          />
        </Input.Root>
        <FormField.Message error={state.errors?.cep} hint={cepHint} />
      </FormField.Root>

      <FormField.Root>
        <FormField.Label htmlFor="street">Rua</FormField.Label>
        <Input.Root error={!!state.errors?.street}>
          <Input.Control
            id="street"
            name="street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
          />
        </Input.Root>
        <FormField.Message error={state.errors?.street} />
      </FormField.Root>

      <div className="grid grid-cols-3 gap-3">
        <FormField.Root>
          <FormField.Label htmlFor="number">Número</FormField.Label>
          <Input.Root error={!!state.errors?.number}>
            <Input.Control
              id="number"
              name="number"
              defaultValue={initial.number ?? ''}
              required
              inputMode="numeric"
            />
          </Input.Root>
          <FormField.Message error={state.errors?.number} />
        </FormField.Root>

        <div className="col-span-2">
          <FormField.Root>
            <FormField.Label htmlFor="complement">Complemento</FormField.Label>
            <Input.Root>
              <Input.Control
                id="complement"
                name="complement"
                defaultValue={initial.complement ?? ''}
              />
            </Input.Root>
          </FormField.Root>
        </div>
      </div>

      <FormField.Root>
        <FormField.Label htmlFor="neighborhood">Bairro</FormField.Label>
        <Input.Root error={!!state.errors?.neighborhood}>
          <Input.Control
            id="neighborhood"
            name="neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            required
          />
        </Input.Root>
        <FormField.Message error={state.errors?.neighborhood} />
      </FormField.Root>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <FormField.Root>
            <FormField.Label htmlFor="city">Cidade</FormField.Label>
            <Input.Root error={!!state.errors?.city}>
              <Input.Control
                id="city"
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </Input.Root>
            <FormField.Message error={state.errors?.city} />
          </FormField.Root>
        </div>

        <FormField.Root>
          <FormField.Label htmlFor="state">UF</FormField.Label>
          <Input.Root error={!!state.errors?.state}>
            <Input.Control
              id="state"
              name="state"
              value={stateUf}
              onChange={(e) => setStateUf(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              required
            />
          </Input.Root>
          <FormField.Message error={state.errors?.state} />
        </FormField.Root>
      </div>

      {state.errors?._form && <p className="text-sm text-red-600">{state.errors._form[0]}</p>}

      <Button type="submit" size="lg" disabled={isPending} loading={isPending}>
        Revisar
      </Button>
    </form>
  );
}
