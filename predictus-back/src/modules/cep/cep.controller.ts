import { Controller, Get, Inject, Param } from '@nestjs/common';
import { CEP_PROVIDER, type CepProvider } from '../../shared/interfaces/cep-provider.interface';
import { CepNotFoundException } from '../../shared/exceptions/domain.exceptions';

@Controller('cep')
export class CepController {
  constructor(@Inject(CEP_PROVIDER) private readonly provider: CepProvider) {}

  @Get(':cep')
  async lookup(@Param('cep') cep: string) {
    const data = await this.provider.lookup(cep);
    if (!data) throw new CepNotFoundException();
    return data;
  }
}