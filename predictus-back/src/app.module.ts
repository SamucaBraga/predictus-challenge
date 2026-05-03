import { Module } from '@nestjs/common';
import { validateEnv } from './config/configuration';
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './infra/database/database.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule,
  ],
})
export class AppModule {}
