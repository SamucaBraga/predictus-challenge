'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { finishRegistration } from '@/lib/actions/registration';

interface Props {
  data: Record<string, string | null | undefined>;
}

interface Section {
  title: string;
  route: string;
  fields: Array<[label: string, key: string]>;
}

const SECTIONS: Section[] = [
  {
    title: 'Identificação',
    route: '/signup/identification',
    fields: [
      ['Nome', 'name'],
      ['E-mail', 'email'],
    ],
  },
  {
    title: 'Documento',
    route: '/signup/document',
    fields: [
      ['Tipo', 'document_type'],
      ['Número', 'document_number'],
    ],
  },
  {
    title: 'Contato',
    route: '/signup/contact',
    fields: [['Telefone', 'phone']],
  },
  {
    title: 'Endereço',
    route: '/signup/address',
    fields: [
      ['CEP', 'cep'],
      ['Rua', 'street'],
      ['Número', 'number'],
      ['Complemento', 'complement'],
      ['Bairro', 'neighborhood'],
      ['Cidade', 'city'],
      ['UF', 'state'],
    ],
  },
];

export function ReviewSummary({ data }: Props) {
  const router = useRouter();
  const [isFinishing, startFinish] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFinish() {
    setError(null);
    startFinish(async () => {
      const result = await finishRegistration();
      if (result.success) router.push('/signup/success');
      else setError(result.errors?._form?.[0] ?? 'Falha ao finalizar.');
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">{section.title}</h2>
            <Link
              href={`${section.route}?edit=review`}
              className="text-xs text-primary underline"
            >
              Editar
            </Link>
          </div>
          <dl className="mt-3 flex flex-col gap-1 text-sm">
            {section.fields.map(([label, key]) => (
              <div key={key} className="flex justify-between gap-3">
                <dt className="text-gray-500">{label}</dt>
                <dd className="text-right text-gray-900">{data[key] ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="button"
        size="lg"
        loading={isFinishing}
        disabled={isFinishing}
        onClick={handleFinish}
      >
        Concluir cadastro
      </Button>
    </div>
  );
}
