/**
 * Valida celular brasileiro:
 * - Aceita formato E.164 com prefixo `+55` ou sem
 * - Sanitiza caracteres não-dígitos antes da checagem
 * - 11 dígitos após o DDD removido o prefixo `55`
 * - Terceiro dígito (primeiro do número, depois do DDD) deve ser `9`
 */
export function isValidMobileBr(input: string): boolean {
  if (typeof input !== 'string') return false;
  const digits = input.replace(/\D/g, '').replace(/^55/, '');
  return digits.length === 11 && digits[2] === '9';
}
