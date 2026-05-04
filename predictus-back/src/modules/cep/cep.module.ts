import { Module } from '@nestjs/common';
import { CepProviderModule } from '../../infra/cep/cep-provider.module';
import { CepController } from './cep.controller';

@Module({
  imports: [CepProviderModule],
  controllers: [CepController],
})
export class CepModule {}
