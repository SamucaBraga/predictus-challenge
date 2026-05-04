import { Module } from '@nestjs/common';
import { CEP_PROVIDER } from '../../shared/interfaces/cep-provider.interface';
import { ViaCepProvider } from './viacep.provider';

@Module({
  providers: [{ provide: CEP_PROVIDER, useClass: ViaCepProvider }],
  exports: [CEP_PROVIDER],
})
export class CepProviderModule {}