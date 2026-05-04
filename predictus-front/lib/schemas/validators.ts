export function isValidCpf(input: string): boolean {
  const cpf = input.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (slice: number) => {
    let sum = 0;
    for (let i = 0; i < slice; i++) sum += Number(cpf[i]) * (slice + 1 - i);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export function isValidCnpj(input: string): boolean {
  const cnpj = input.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += Number(cnpj[i]) * weights[i];
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return calc(w1) === Number(cnpj[12]) && calc(w2) === Number(cnpj[13]);
}

export function isValidMobileBr(input: string): boolean {
  const digits = input.replace(/\D/g, '').replace(/^55/, '');
  return digits.length === 11 && digits[2] === '9';
}
