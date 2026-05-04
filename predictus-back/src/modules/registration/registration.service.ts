import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Registration, RegistrationStatus, DocumentType } from './registration.entity';
import { ExpiredResumeTokenException, IncompleteRegistrationDataException, InvalidResumeTokenException, MfaNotValidatedException, RegistrationAlreadyFinishedException, RegistrationNotFoundException, StepNotAllowedException } from '../../shared/exceptions/domain.exceptions';

export interface UpsertIdentificationInput {
  email: string;
  name: string;
}

interface AddressInput {
  cep: string; street: string; number: string; complement?: string;
  neighborhood: string; city: string; state: string;
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

  async markMfaValidated(id: string): Promise<void> {
    await this.repo.update({ id }, { mfa_validated_at: new Date(), current_step: 2 });
  }

  private computeTokenExpiry(): Date {
    const days = this.config.get<number>('RESUME_TOKEN_TTL_DAYS')!;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  async updateDocument(id: string, data: { document_type: DocumentType; document_number: string }) {
    const reg = await this.findActiveOrFail(id);
    this.assertMfaValidated(reg);
    this.assertCanWriteStep(reg, 2);
    reg.document_type = data.document_type;
    reg.document_number = data.document_number.replace(/\D/g, '');
    reg.current_step = Math.max(reg.current_step, 3);
    return this.repo.save(reg);
  }

  async updateContact(id: string, data: { phone: string }) {
    const reg = await this.findActiveOrFail(id);
    this.assertMfaValidated(reg);
    this.assertCanWriteStep(reg, 3);
    reg.phone = data.phone;
    reg.current_step = Math.max(reg.current_step, 4);
    return this.repo.save(reg);
  }

  async updateAddress(id: string, data: AddressInput) {
    const reg = await this.findActiveOrFail(id);
    this.assertMfaValidated(reg);
    this.assertCanWriteStep(reg, 4);
    Object.assign(reg, {
      cep: data.cep,
      street: data.street,
      number: data.number,
      complement: data.complement ?? null,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state.toUpperCase(),
    });
    reg.current_step = Math.max(reg.current_step, 5);
    return this.repo.save(reg);
  }

  async finish(id: string): Promise<Registration> {
    const reg = await this.findActiveOrFail(id);
    this.assertMfaValidated(reg);
    if (reg.current_step < 5) throw new StepNotAllowedException();
    if (!reg.cep) throw new IncompleteRegistrationDataException();
    reg.status = RegistrationStatus.FINISHED;
    reg.finished_at = new Date();
    return this.repo.save(reg);
  }

  async getState(id: string) {
    const reg = await this.findActiveOrFail(id);
    return {
      id: reg.id,
      currentStep: reg.current_step,
      status: reg.status,
      mfaValidated: !!reg.mfa_validated_at,
      partialData: this.serializePartial(reg),
    };
  }

  async findByResumeToken(token: string): Promise<Registration> {
    const reg = await this.repo.findOne({ where: { resume_token: token } });
    if (!reg) throw new InvalidResumeTokenException();
    if (reg.resume_token_expires_at < new Date()) throw new ExpiredResumeTokenException();
    return reg;
  }

  async reactivateAbandoned(reg: Registration): Promise<Registration> {
    if (reg.status === RegistrationStatus.ABANDONED) {
      reg.status = RegistrationStatus.IN_PROGRESS;
      reg.recovery_email_sent_at = null;
      return this.repo.save(reg);
    }
    return reg;
  }

  private async findActiveOrFail(id: string): Promise<Registration> {
    const reg = await this.repo.findOne({ where: { id } });
    if (!reg) throw new RegistrationNotFoundException();
    if (reg.status === RegistrationStatus.FINISHED) {
      throw new RegistrationAlreadyFinishedException();
    }
    
    // Submitting on an abandoned registration reactivates it.
    // Caller will persist via repo.save(reg)
    if (reg.status === RegistrationStatus.ABANDONED) {
      reg.status = RegistrationStatus.IN_PROGRESS;
      reg.recovery_email_sent_at = null;
    }
    return reg;
  }

  private assertMfaValidated(reg: Registration) {
    if (!reg.mfa_validated_at) throw new MfaNotValidatedException();
  }

  private assertCanWriteStep(reg: Registration, requestedStep: number) {
    // permite editar step <= current_step (edit-from-review). Bloqueia pular adiante.
    if (requestedStep > reg.current_step) throw new StepNotAllowedException();
  }

  private serializePartial(reg: Registration) {
    return {
      name: reg.name,
      email: reg.email,
      document_type: reg.document_type,
      document_number: reg.document_number,
      phone: reg.phone,
      cep: reg.cep,
      street: reg.street,
      number: reg.number,
      complement: reg.complement,
      neighborhood: reg.neighborhood,
      city: reg.city,
      state: reg.state,
    };
  }
}