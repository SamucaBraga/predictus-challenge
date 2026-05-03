import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MfaCode } from './entities/mfa-code.entity';
 

@Module({
  imports: [
    TypeOrmModule.forFeature([MfaCode]),
  ],
  providers: [],
  exports: [],
})
export class MfaModule {}
