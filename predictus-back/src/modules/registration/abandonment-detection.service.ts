import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
 import { NotificationsService } from '../notifications/notifications.service';
import { Registration, RegistrationStatus } from './registration.entity';

@Injectable()
export class AbandonmentDetectionService {
  private readonly logger = new Logger(AbandonmentDetectionService.name);

  constructor(
    @InjectRepository(Registration) private readonly repo: Repository<Registration>,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async detectAbandonments(): Promise<void> {
    const timeoutMs = this.config.get<number>('ABANDONMENT_TIMEOUT_MINUTES')! * 60_000;
    const cutoff = new Date(Date.now() - timeoutMs);

    const candidates = await this.repo.find({
      where: {
        status: RegistrationStatus.IN_PROGRESS,
        mfa_validated_at: Not(IsNull()),
        updated_at: LessThan(cutoff),
        recovery_email_sent_at: IsNull(),
      },
    });

    if (candidates.length === 0) return;
    this.logger.log(`Detected ${candidates.length} abandoned registration(s)`);

    for (const reg of candidates) {
      await this.processOne(reg);
    }
  }

  private async processOne(reg: Registration) {
    reg.status = RegistrationStatus.ABANDONED;
    reg.recovery_email_sent_at = new Date();
    await this.repo.save(reg);

    try {
      await this.notifications.sendRecoveryEmail(reg);
    } catch (err) {
      this.logger.error(
        `Recovery email failed for registration ${reg.id} (${reg.email}). Status remains abandoned, dedupe column already set.`,
        err,
      );
    }
  }
}