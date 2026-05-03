import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MfaService } from './mfa.service';
import { MfaCode } from './mfa-code.entity';
 
@Module({
  imports: [
    TypeOrmModule.forFeature([MfaCode]),
  ],
  providers: [MfaService],
  exports: [MfaService],
})
export class MfaModule {}
