import { isValidMobileBr } from './mobile-br.validator';

describe('isValidMobileBr', () => {
  describe('válidos', () => {
    it.each([
      ['11999999999', 'só dígitos com 9 inicial'],
      ['(11) 99999-9999', 'formato brasileiro padrão'],
      ['+5511999999999', 'E.164 com prefixo +55'],
      ['5511999999999', 'com prefixo 55 sem +'],
      ['+55 (11) 99999-9999', 'E.164 formatado'],
      ['11 9 9999-9999', 'com espaços e separador'],
    ])('aceita %s (%s)', (input) => {
      expect(isValidMobileBr(input)).toBe(true);
    });
  });

  describe('inválidos', () => {
    it.each([
      ['1133334444', 'fixo (sem 9 inicial, 10 dígitos)'],
      ['(11) 3333-4444', 'fixo formatado'],
      ['1199999999', 'celular faltando 1 dígito'],
      ['119999999999', 'celular com 1 dígito a mais'],
      ['11899999999', 'terceiro dígito não é 9 (regra de celular)'],
      ['', 'string vazia'],
      ['abc', 'só letras'],
      ['(11) 9999-9999', 'sem o 9 extra de celular (10 dígitos)'],
    ])('rejeita %s (%s)', (input) => {
      expect(isValidMobileBr(input)).toBe(false);
    });
  });

  describe('input não-string', () => {
    it.each([
      [null, 'null'],
      [undefined, 'undefined'],
      [11999999999, 'number'],
      [{}, 'objeto'],
    ])('rejeita %s (%s)', (input) => {
      expect(isValidMobileBr(input as never)).toBe(false);
    });
  });
});
