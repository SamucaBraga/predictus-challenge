import { Module } from '@nestjs/common';
import { EmailModule } from '../../infra/email/email.module';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [EmailModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
