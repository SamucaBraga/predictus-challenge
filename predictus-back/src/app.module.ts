import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/configuration';
import { DatabaseModule } from './infra/database/database.module';
import { RegistrationModule } from './modules/registration/registration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { name: 'identification', ttl: 60_000, limit: config.get<number>('THROTTLE_IDENTIFICATION_LIMIT')! },
        { name: 'mfa-resend', ttl: 600_000, limit: config.get<number>('THROTTLE_MFA_RESEND_LIMIT')! },
        { name: 'mfa-verify', ttl: 60_000, limit: config.get<number>('THROTTLE_MFA_VERIFY_LIMIT')! },
      ],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RegistrationModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
