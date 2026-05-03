import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegistrationService } from './registration.service';
import { Registration, RegistrationStatus } from './entities/registration.entity';

describe('RegistrationService.upsertIdentification', () => {
  let service: RegistrationService;
  let repo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn((x) => Promise.resolve({ ...x, id: 'uuid-fake' })),
      create: jest.fn((x) => x),
    };
    const module = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: getRepositoryToken(Registration), useValue: repo },
        { provide: ConfigService, useValue: { get: () => 7 } },
      ],
    }).compile();
    service = module.get(RegistrationService);
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