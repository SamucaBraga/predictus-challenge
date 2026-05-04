import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CepData, CepProvider } from '../../shared/interfaces/cep-provider.interface';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: true;
}

@Injectable()
export class ViaCepProvider implements CepProvider {
  private readonly logger = new Logger(ViaCepProvider.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('VIACEP_BASE_URL')!;
  }

  async lookup(cep: string): Promise<CepData | null> {
    const sanitized = cep.replace(/\D/g, '');
    if (sanitized.length !== 8) return null;

    const url = `${this.baseUrl}/${sanitized}/json/`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as ViaCepResponse;
      if ('erro' in data) return null;
      return {
        cep: data.cep.replace('-', ''),
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      };
    } catch (err) {
      this.logger.error(`CEP lookup failed for ${sanitized}`, err);
      return null;
    }
  }
}