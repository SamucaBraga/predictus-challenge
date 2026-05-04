import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_PROVIDER, type EmailProvider } from '../../shared/interfaces/email-provider.interface';
import { mfaTemplate } from './templates/mfa.template';
import { recoveryTemplate } from './templates/recovery.template';
import type { Registration } from '../registration/registration.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
    private readonly config: ConfigService,
  ) {}

  async sendMfaCode(to: string, code: string): Promise<void> {
    const tpl = mfaTemplate(code);
    await this.email.send({ to, ...tpl });
  }

  async sendRecoveryEmail(reg: Registration): Promise<void> {
    const baseUrl = this.config.get<string>('BASE_URL');
    const url = `${baseUrl}/signup/resume?token=${reg.resume_token}`;
    const tpl = recoveryTemplate(url);
    await this.email.send({ to: reg.email, ...tpl });
  }
}