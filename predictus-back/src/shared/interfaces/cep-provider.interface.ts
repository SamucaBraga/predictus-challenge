export interface CepData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CepProvider {
  lookup(cep: string): Promise<CepData | null>;
}

// token runtime pra substituir interface
export const CEP_PROVIDER = Symbol('CepProvider');