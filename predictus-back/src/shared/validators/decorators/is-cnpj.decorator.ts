import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidCnpj } from '../cnpj.validator';

export function IsCnpj(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: { message: 'CNPJ inválido', ...options },
      validator: { validate: (v: unknown) => typeof v === 'string' && isValidCnpj(v) },
    });
  };
}