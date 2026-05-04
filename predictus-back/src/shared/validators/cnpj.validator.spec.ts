import { isValidCnpj } from './cnpj.validator';

describe('isValidCnpj', () => {
  describe('válidos', () => {
    it.each([
      ['11222333000181', 'sem formatação'],
      ['11.222.333/0001-81', 'com formatação padrão'],
      ['11 222 333 0001 81', 'com espaços'],
      ['11222333000181\n', 'com whitespace ao final'],
      ['11444777000161', 'outro CNPJ válido'],
    ])('aceita %s (%s)', (input) => {
      expect(isValidCnpj(input)).toBe(true);
    });
  });

  describe('inválidos', () => {
    it.each([
      ['11222333000182', 'último dígito errado'],
      ['11222333000171', 'penúltimo dígito errado'],
      ['12345678901234', 'sequência arbitrária'],
      ['00000000000000', 'todos zeros'],
      ['11111111111111', 'todos uns'],
      ['99999999999999', 'todos noves'],
    ])('rejeita %s (%s)', (input) => {
      expect(isValidCnpj(input)).toBe(false);
    });
  });

  describe('formato errado', () => {
    it.each([
      ['', 'string vazia'],
      ['123', 'curto demais'],
      ['112223330001811', 'longo demais'],
      ['11144477735', 'CPF (11 dígitos)'],
      ['abc.def.ghi/jkl-mn', 'só letras'],
      ['11.222.333/0001-8a', 'mistura com letra'],
    ])('rejeita %s (%s)', (input) => {
      expect(isValidCnpj(input)).toBe(false);
    });
  });
});
