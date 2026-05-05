'use client';

import { type ChangeEvent, type ComponentProps, useState } from 'react';
import { Input } from './input';

export type MaskType = 'cpf' | 'cnpj' | 'cep' | 'phone';

const MASKS: Record<MaskType, (raw: string) => string> = {
  cpf: (v) =>
    v
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
  cnpj: (v) =>
    v
      .replace(/\D/g, '')
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2'),
  cep: (v) =>
    v
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, '$1-$2'),
  phone: (v) =>
    v
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2'),
};

interface Props extends Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'defaultValue'> {
  mask: MaskType;
  defaultValue?: string;
  onValueChange?: (rawDigits: string) => void;
}

export function MaskedInput({ mask, defaultValue = '', onValueChange, ...rest }: Props) {
  const [value, setValue] = useState(MASKS[mask](defaultValue));

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const masked = MASKS[mask](e.target.value);
    setValue(masked);
    onValueChange?.(masked.replace(/\D/g, ''));
  }

  return (
    <Input.Control type="tel" inputMode="numeric" value={value} onChange={handleChange} {...rest} />
  );
}
