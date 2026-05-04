import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';
import { MfaModule } from '../mfa/mfa.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AbandonmentDetectionService } from './abandonment-detection.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration]),
    MfaModule,
    NotificationsModule,
  ],
  providers: [RegistrationService, AbandonmentDetectionService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
