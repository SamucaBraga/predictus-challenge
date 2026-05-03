import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegistrationService } from './registration.service';
import { DocumentType, Registration, RegistrationStatus } from './entities/registration.entity';
import {
  ExpiredResumeTokenException,
  MfaNotValidatedException,
  StepNotAllowedException,
} from '../../shared/exceptions/domain.exceptions';

type MockRepo = { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

async function buildService(): Promise<{ service: RegistrationService; repo: MockRepo }> {
  const repo: MockRepo = {
    findOne: jest.fn(),
    save: jest.fn((x) => Promise.resolve({ ...x, id: x.id ?? 'uuid-fake' })),
    create: jest.fn((x) => x),
  };
  const module = await Test.createTestingModule({
    providers: [
      RegistrationService,
      { provide: getRepositoryToken(Registration), useValue: repo },
      { provide: ConfigService, useValue: { get: () => 7 } },
    ],
  }).compile();
  return { service: module.get(RegistrationService), repo };
}

describe('RegistrationService.upsertIdentification', () => {
  let service: RegistrationService;
  let repo: MockRepo;

  beforeEach(async () => {
    ({ service, repo } = await buildService());
  });

  it('cria novo registration quando email não existe', async () => {
    repo.findOne.mockResolvedValue(null);
    const r = await service.upsertIdentification({ email: 'JOAO@x.com', name: 'João' });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'joao@x.com',
      status: RegistrationStatus.IN_PROGRESS,
      current_step: 1,
    }));
    expect(r.resume_token).toBeDefined();
  });

  it('reativa registration abandoned, regenerando token e resetando recovery_email_sent_at', async () => {
    const existing = mockReg({
      status: RegistrationStatus.ABANDONED,
      recovery_email_sent_at: new Date(),
    });
    const originalToken = existing.resume_token; // ← captura ANTES de mutar
    repo.findOne.mockResolvedValue(existing);

    const r = await service.upsertIdentification({ email: 'a@x.com', name: 'Ana' });

    expect(r.status).toBe(RegistrationStatus.IN_PROGRESS);
    expect(r.recovery_email_sent_at).toBeNull();
    expect(r.resume_token).not.toBe(originalToken); // ← compara com snapshot
  });

  it('regenera token quando expirado mesmo se status era in_progress', async () => {
    const oldToken = 'old-token';
    const existing = mockReg({
      status: RegistrationStatus.IN_PROGRESS,
      resume_token: oldToken,
      resume_token_expires_at: new Date(Date.now() - 1000),
    });
    repo.findOne.mockResolvedValue(existing);
    const r = await service.upsertIdentification({ email: 'a@x.com', name: 'Ana' });
    expect(r.resume_token).not.toBe(oldToken);
  });

  it('mantém token quando in_progress e ainda válido, só atualiza name', async () => {
    const oldToken = 'old-token';
    const existing = mockReg({
      status: RegistrationStatus.IN_PROGRESS,
      resume_token: oldToken,
      resume_token_expires_at: new Date(Date.now() + 1000 * 60 * 60),
    });
    repo.findOne.mockResolvedValue(existing);
    const r = await service.upsertIdentification({ email: 'a@x.com', name: 'Novo Nome' });
    expect(r.resume_token).toBe(oldToken);
    expect(r.name).toBe('Novo Nome');
  });

  it('lança erro quando registration já está finished', async () => {
    repo.findOne.mockResolvedValue(mockReg({ status: RegistrationStatus.FINISHED }));
    await expect(service.upsertIdentification({ email: 'a@x.com', name: 'A' })).rejects.toThrow();
  });
});

describe('RegistrationService.updateDocument', () => {
  let service: RegistrationService;
  let repo: MockRepo;

  beforeEach(async () => {
    ({ service, repo } = await buildService());
  });

  it('falha quando MFA não foi validado', async () => {
    repo.findOne.mockResolvedValue(
      mockReg({ id: 'r1', mfa_validated_at: null, current_step: 2 }),
    );

    await expect(
      service.updateDocument('r1', {
        document_type: DocumentType.CPF,
        document_number: '11144477735',
      }),
    ).rejects.toBeInstanceOf(MfaNotValidatedException);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('avança current_step de 2 para 3 ao salvar documento', async () => {
    repo.findOne.mockResolvedValue(
      mockReg({ id: 'r1', mfa_validated_at: new Date(), current_step: 2 }),
    );

    const result = await service.updateDocument('r1', {
      document_type: DocumentType.CPF,
      document_number: '111.444.777-35', // entrada formatada
    });

    expect(result.current_step).toBe(3);
    expect(result.document_type).toBe(DocumentType.CPF);
    expect(result.document_number).toBe('11144477735'); // sanitizado pra dígitos
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});

describe('RegistrationService.updateAddress', () => {
  let service: RegistrationService;
  let repo: MockRepo;

  beforeEach(async () => {
    ({ service, repo } = await buildService());
  });

  it('não decrementa current_step em modo edit (já está em 5)', async () => {
    repo.findOne.mockResolvedValue(
      mockReg({
        id: 'r1',
        mfa_validated_at: new Date(),
        current_step: 5, // usuário voltou da revisão pra editar endereço
      }),
    );

    const result = await service.updateAddress('r1', {
      cep: '01310100',
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'sp',
    });

    expect(result.current_step).toBe(5); // mantém — Math.max(5, 5)
    expect(result.state).toBe('SP'); // upper-case
  });
});

describe('RegistrationService.finish', () => {
  let service: RegistrationService;
  let repo: MockRepo;

  beforeEach(async () => {
    ({ service, repo } = await buildService());
  });

  it('falha quando current_step < 5', async () => {
    repo.findOne.mockResolvedValue(
      mockReg({ id: 'r1', mfa_validated_at: new Date(), current_step: 4, cep: '01310100' }),
    );

    await expect(service.finish('r1')).rejects.toBeInstanceOf(StepNotAllowedException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('finaliza com sucesso quando step 5 e dados completos', async () => {
    repo.findOne.mockResolvedValue(
      mockReg({
        id: 'r1',
        mfa_validated_at: new Date(),
        current_step: 5,
        cep: '01310100',
      }),
    );

    const result = await service.finish('r1');

    expect(result.status).toBe(RegistrationStatus.FINISHED);
    expect(result.finished_at).toBeInstanceOf(Date);
  });
});

describe('RegistrationService.findByResumeToken', () => {
  let service: RegistrationService;
  let repo: MockRepo;

  beforeEach(async () => {
    ({ service, repo } = await buildService());
  });

  it('lança ExpiredResumeTokenException quando token está expirado', async () => {
    repo.findOne.mockResolvedValue(
      mockReg({
        resume_token: 'tok-expired',
        resume_token_expires_at: new Date(Date.now() - 1000),
      }),
    );

    await expect(service.findByResumeToken('tok-expired')).rejects.toBeInstanceOf(
      ExpiredResumeTokenException,
    );
  });

  it('retorna registration quando token é válido', async () => {
    const reg = mockReg({
      resume_token: 'tok-valid',
      resume_token_expires_at: new Date(Date.now() + 60_000),
    });
    repo.findOne.mockResolvedValue(reg);

    const result = await service.findByResumeToken('tok-valid');

    expect(result).toBe(reg);
  });
});

describe('RegistrationService.reactivateAbandoned', () => {
  let service: RegistrationService;
  let repo: MockRepo;

  beforeEach(async () => {
    ({ service, repo } = await buildService());
  });

  it('reseta recovery_email_sent_at e volta status pra in_progress', async () => {
    const reg = mockReg({
      status: RegistrationStatus.ABANDONED,
      recovery_email_sent_at: new Date(),
    });

    const result = await service.reactivateAbandoned(reg);

    expect(result.status).toBe(RegistrationStatus.IN_PROGRESS);
    expect(result.recovery_email_sent_at).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(reg);
  });

  it('é no-op quando registration não está abandoned', async () => {
    const reg = mockReg({
      status: RegistrationStatus.IN_PROGRESS,
      recovery_email_sent_at: null,
    });

    const result = await service.reactivateAbandoned(reg);

    expect(result).toBe(reg);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

function mockReg(overrides: Partial<Registration>): Registration {
  return {
    id: 'id',
    email: 'a@x.com',
    name: null,
    status: RegistrationStatus.IN_PROGRESS,
    current_step: 1,
    resume_token: 'tok',
    resume_token_expires_at: new Date(Date.now() + 86400000),
    recovery_email_sent_at: null,
    mfa_validated_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    finished_at: null,
    ...overrides,
  } as Registration;
}