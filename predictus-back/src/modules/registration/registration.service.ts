import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, LessThan, IsNull, Not } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Registration, RegistrationStatus } from './entities/registration.entity';
import { RegistrationAlreadyFinishedException } from '../../shared/exceptions/domain.exceptions';

export interface UpsertIdentificationInput {
  email: string;
  name: string;
}

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Registration) private readonly repo: Repository<Registration>,
    private readonly config: ConfigService,
  ) {}

  async upsertIdentification(input: UpsertIdentificationInput): Promise<Registration> {
    const email = input.email.toLowerCase().trim();
    const existing = await this.repo.findOne({ where: { email } });

    const isRegistrationFinished = existing?.status === RegistrationStatus.FINISHED;

    if (isRegistrationFinished) {
      throw new RegistrationAlreadyFinishedException();
    }

    if (!existing) {
      return this.repo.save(this.repo.create({
        email,
        name: input.name,
        status: RegistrationStatus.IN_PROGRESS,
        current_step: 1,
        resume_token: randomUUID(),
        resume_token_expires_at: this.computeTokenExpiry(),
      }));
    }

    const hasTokenExpired = existing.resume_token_expires_at < new Date();
    const wasAbandoned = existing.status === RegistrationStatus.ABANDONED;

    existing.name = input.name;

    if (wasAbandoned || hasTokenExpired) {
      existing.status = RegistrationStatus.IN_PROGRESS;
      existing.resume_token = randomUUID();
      existing.resume_token_expires_at = this.computeTokenExpiry();
      existing.recovery_email_sent_at = null;
    }

    return this.repo.save(existing);
  }

  private computeTokenExpiry(): Date {
    const days = this.config.get<number>('RESUME_TOKEN_TTL_DAYS')!;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}