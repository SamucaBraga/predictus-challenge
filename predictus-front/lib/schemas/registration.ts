import { z } from 'zod';
import { isValidCnpj, isValidCpf, isValidMobileBr } from './validators';

export const identificationSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(255),
  email: z.email('E-mail inválido').max(255),
});

export const verifyMfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Código deve ter 6 dígitos'),
});

export const documentSchema = z.discriminatedUnion('document_type', [
  z.object({
    document_type: z.literal('cpf'),
    document_number: z.string().refine(isValidCpf, 'CPF inválido'),
  }),
  z.object({
    document_type: z.literal('cnpj'),
    document_number: z.string().refine(isValidCnpj, 'CNPJ inválido'),
  }),
]);

export const contactSchema = z.object({
  phone: z.string().refine(isValidMobileBr, 'Celular inválido'),
});

export const addressSchema = z.object({
  cep: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')),
  street: z.string().min(1, 'Obrigatório'),
  number: z.string().min(1, 'Obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Obrigatório'),
  city: z.string().min(1, 'Obrigatório'),
  state: z.string().length(2, 'UF com 2 letras'),
});

export type IdentificationInput = z.infer<typeof identificationSchema>;
export type VerifyMfaInput = z.infer<typeof verifyMfaSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
