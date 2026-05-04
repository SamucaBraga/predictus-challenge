import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailMessage, EmailProvider } from '../../shared/interfaces/email-provider.interface';

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly client: Resend;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.client = new Resend(config.get<string>('RESEND_API_KEY'));
    this.from = config.get<string>('EMAIL_FROM')!;
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (error) {
      this.logger.error(`Resend send failed for ${message.to}: ${error.message}`);
      throw new Error(`Email send failed: ${error.message}`);
    }
  }
}