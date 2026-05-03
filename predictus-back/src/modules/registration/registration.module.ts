import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';
import { MfaModule } from '../mfa/mfa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration]),
    MfaModule,
  ],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
