import { isValidCpf } from './cpf.validator';

describe('isValidCpf', () => {
  describe('válidos', () => {
    it.each([
      ['11144477735', 'sem formatação'],
      ['111.444.777-35', 'com formatação padrão'],
      ['111 444 777 35', 'com espaços'],
      ['11144477735\n', 'com whitespace ao final'],
      ['52998224725', 'outro CPF válido'],
    ])('aceita %s (%s)', (input) => {
      expect(isValidCpf(input)).toBe(true);
    });
  });

  describe('inválidos', () => {
    it.each([
      ['11144477734', 'último dígito errado'],
      ['11144477725', 'penúltimo dígito errado'],
      ['12345678910', 'sequência arbitrária'],
      ['00000000000', 'todos zeros'],
      ['11111111111', 'todos uns'],
      ['99999999999', 'todos noves'],
    ])('rejeita %s (%s)', (input) => {
      expect(isValidCpf(input)).toBe(false);
    });
  });

  describe('formato errado', () => {
    it.each([
      ['', 'string vazia'],
      ['123', 'curto demais'],
      ['111444777355', 'longo demais'],
      ['abc.def.ghi-jk', 'só letras'],
      ['111.444.777-3a', 'mistura com letra'],
    ])('rejeita %s (%s)', (input) => {
      expect(isValidCpf(input)).toBe(false);
    });
  });
});
