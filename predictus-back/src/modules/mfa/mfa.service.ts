import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, IsNull } from 'typeorm';
import { createHash, randomInt } from 'node:crypto';
import {
  MfaInvalidCodeException, MfaExpiredException, MfaTooManyAttemptsException,
} from '../../shared/exceptions/domain.exceptions';
import { MfaCode } from './mfa-code.entity';

export interface MfaGenerateResult { plaintextCode: string; }

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(MfaCode) private readonly repo: Repository<MfaCode>,
    private readonly config: ConfigService,
  ) {}

  async generate(registrationId: string): Promise<MfaGenerateResult> {
    await this.invalidateActiveCodes(registrationId);
    const plaintext = this.generate6DigitCode();
    const ttlMin = this.config.get<number>('MFA_CODE_TTL_MINUTES')!;
    await this.repo.save(this.repo.create({
      registration_id: registrationId,
      code_hash: this.hash(plaintext),
      expires_at: new Date(Date.now() + ttlMin * 60_000),
    }));
    return { plaintextCode: plaintext };
  }

  /** Lança exceção se inválido. Retorna void no sucesso. */
  async validate(registrationId: string, code: string): Promise<void> {
    const maxAttempts = this.config.get<number>('MFA_MAX_ATTEMPTS')!;
    const active = await this.repo.findOne({
      where: { registration_id: registrationId, used_at: IsNull() },
      order: { created_at: 'DESC' },
    });

    if (!active) throw new MfaExpiredException();
    if (active.expires_at < new Date()) throw new MfaExpiredException();
    if (active.attempts >= maxAttempts) throw new MfaTooManyAttemptsException();

    if (active.code_hash !== this.hash(code)) {
      active.attempts += 1;
      await this.repo.save(active);
      const left = maxAttempts - active.attempts;
      if (left <= 0) {
        await this.invalidateActiveCodes(registrationId); // expira tudo
        throw new MfaTooManyAttemptsException();
      }
      throw new MfaInvalidCodeException(left);
    }

    active.used_at = new Date();
    await this.repo.save(active);
  }

  async resend(registrationId: string): Promise<MfaGenerateResult> {
    return this.generate(registrationId); // generate já invalida ativos
  }

  private async invalidateActiveCodes(registrationId: string) {
    await this.repo.update(
      { registration_id: registrationId, used_at: IsNull() as never },
      { used_at: new Date() },
    );
  }

  private generate6DigitCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}