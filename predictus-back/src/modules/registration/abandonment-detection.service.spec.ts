import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AbandonmentDetectionService } from './abandonment-detection.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Registration, RegistrationStatus } from './registration.entity';

type MockRepo = { find: jest.Mock; save: jest.Mock };
type MockNotifications = { sendRecoveryEmail: jest.Mock };

const TIMEOUT_MIN = 5;

async function buildService(): Promise<{
  service: AbandonmentDetectionService;
  repo: MockRepo;
  notifications: MockNotifications;
}> {
  const repo: MockRepo = {
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
  };
  const notifications: MockNotifications = {
    sendRecoveryEmail: jest.fn(() => Promise.resolve()),
  };
  const config: Partial<ConfigService> = {
    get: jest.fn((key: string) => {
      if (key === 'ABANDONMENT_TIMEOUT_MINUTES') return TIMEOUT_MIN;
      return undefined;
    }) as never,
  };

  const module = await Test.createTestingModule({
    providers: [
      AbandonmentDetectionService,
      { provide: getRepositoryToken(Registration), useValue: repo },
      { provide: NotificationsService, useValue: notifications },
      { provide: ConfigService, useValue: config },
    ],
  }).compile();

  return {
    service: module.get(AbandonmentDetectionService),
    repo,
    notifications,
  };
}

function mockReg(overrides: Partial<Registration> = {}): Registration {
  return {
    id: 'reg-id',
    email: 'a@x.com',
    name: 'Ana',
    status: RegistrationStatus.IN_PROGRESS,
    current_step: 3,
    mfa_code_hash: null,
    mfa_code_expires_at: null,
    mfa_code_attempts: 0,
    resume_token: 'tok',
    resume_token_expires_at: new Date(Date.now() + 86_400_000),
    recovery_email_sent_at: null,
    created_at: new Date(Date.now() - 30 * 60_000),
    updated_at: new Date(Date.now() - 10 * 60_000),
    finished_at: null,
    ...overrides,
  } as Registration;
}

describe('AbandonmentDetectionService.detectAbandonments', () => {
  let service: AbandonmentDetectionService;
  let repo: MockRepo;
  let notifications: MockNotifications;

  beforeEach(async () => {
    ({ service, repo, notifications } = await buildService());
  });

  it('sem candidatos: não chama save nem sendRecoveryEmail', async () => {
    repo.find.mockResolvedValue([]);

    await service.detectAbandonments();

    expect(repo.save).not.toHaveBeenCalled();
    expect(notifications.sendRecoveryEmail).not.toHaveBeenCalled();
  });

  it('marca abandoned, seta recovery_email_sent_at e dispara recovery email', async () => {
    const reg = mockReg();
    repo.find.mockResolvedValue([reg]);

    await service.detectAbandonments();

    expect(reg.status).toBe(RegistrationStatus.ABANDONED);
    expect(reg.recovery_email_sent_at).toBeInstanceOf(Date);
    expect(repo.save).toHaveBeenCalledWith(reg);
    expect(notifications.sendRecoveryEmail).toHaveBeenCalledWith(reg);
  });

  it('múltiplos candidatos: processa todos, cada um marcado abandoned', async () => {
    const a = mockReg({ id: 'a', email: 'a@x.com' });
    const b = mockReg({ id: 'b', email: 'b@x.com' });
    const c = mockReg({ id: 'c', email: 'c@x.com' });
    repo.find.mockResolvedValue([a, b, c]);

    await service.detectAbandonments();

    expect(a.status).toBe(RegistrationStatus.ABANDONED);
    expect(b.status).toBe(RegistrationStatus.ABANDONED);
    expect(c.status).toBe(RegistrationStatus.ABANDONED);

    expect(repo.save).toHaveBeenCalledTimes(3);
    expect(notifications.sendRecoveryEmail).toHaveBeenCalledTimes(3);
    expect(notifications.sendRecoveryEmail).toHaveBeenNthCalledWith(1, a);
    expect(notifications.sendRecoveryEmail).toHaveBeenNthCalledWith(2, b);
    expect(notifications.sendRecoveryEmail).toHaveBeenNthCalledWith(3, c);
  });

  it('erro de envio em 1 candidato não impede o próximo', async () => {
    const a = mockReg({ id: 'a', email: 'a@x.com' });
    const b = mockReg({ id: 'b', email: 'b@x.com' });
    const c = mockReg({ id: 'c', email: 'c@x.com' });
    repo.find.mockResolvedValue([a, b, c]);

    notifications.sendRecoveryEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Resend down'))
      .mockResolvedValueOnce(undefined);

    await expect(service.detectAbandonments()).resolves.toBeUndefined();

    expect(notifications.sendRecoveryEmail).toHaveBeenCalledTimes(3);
    expect(repo.save).toHaveBeenCalledTimes(3);
    expect(a.status).toBe(RegistrationStatus.ABANDONED);
    expect(b.status).toBe(RegistrationStatus.ABANDONED);
    expect(c.status).toBe(RegistrationStatus.ABANDONED);
  });

  it('recovery_email_sent_at é setado mesmo quando envio falha (dedupe)', async () => {
    const reg = mockReg();
    repo.find.mockResolvedValue([reg]);
    notifications.sendRecoveryEmail.mockRejectedValue(new Error('Resend down'));

    await expect(service.detectAbandonments()).resolves.toBeUndefined();

    expect(reg.recovery_email_sent_at).toBeInstanceOf(Date);
    expect(repo.save).toHaveBeenCalledWith(reg);
  });

  it('query filtra por status, current_step >= 2, updated_at antigo e recovery_email_sent_at nulo', async () => {
    repo.find.mockResolvedValue([]);

    await service.detectAbandonments();

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: RegistrationStatus.IN_PROGRESS,
          current_step: expect.anything(),
          updated_at: expect.anything(),
          recovery_email_sent_at: expect.anything(),
        }),
      }),
    );
  });
});
