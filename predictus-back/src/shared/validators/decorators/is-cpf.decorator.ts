import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidCpf } from '../cpf.validator';

export function IsCpf(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: { message: 'CPF inválido', ...options },
      validator: { validate: (v: unknown) => typeof v === 'string' && isValidCpf(v) },
    });
  };
}