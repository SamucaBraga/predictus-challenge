import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidMobileBr } from '../mobile-br.validator';

export function IsMobileBr(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: { message: 'Celular brasileiro inválido', ...options },
      validator: {
        validate: (v: unknown) => typeof v === 'string' && isValidMobileBr(v),
      },
    });
  };
}
