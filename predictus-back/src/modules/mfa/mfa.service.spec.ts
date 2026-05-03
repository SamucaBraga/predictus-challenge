import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { MfaService } from './mfa.service';
import { MfaCode } from './mfa-code.entity';
import {
  MfaExpiredException,
  MfaInvalidCodeException,
  MfaTooManyAttemptsException,
} from '../../shared/exceptions/domain.exceptions';

type MockRepo = {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

const TTL_MIN = 10;
const MAX_ATTEMPTS = 3;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function buildService(): Promise<{ service: MfaService; repo: MockRepo }> {
  const repo: MockRepo = {
    findOne: jest.fn(),
    save: jest.fn((entity) => Promise.resolve({ ...entity, id: entity.id ?? 'mfa-id' })),
    create: jest.fn((entity) => entity),
    update: jest.fn(() => Promise.resolve({ affected: 1 })),
  };
  const config: Partial<ConfigService> = {
    get: jest.fn((key: string) => {
      if (key === 'MFA_CODE_TTL_MINUTES') return TTL_MIN;
      if (key === 'MFA_MAX_ATTEMPTS') return MAX_ATTEMPTS;
      return undefined;
    }) as never,
  };

  const module = await Test.createTestingModule({
    providers: [
      MfaService,
      { provide: getRepositoryToken(MfaCode), useValue: repo },
      { provide: ConfigService, useValue: config },
    ],
  }).compile();

  return { service: module.get(MfaService), repo };
}

function mockMfaCode(overrides: Partial<MfaCode> = {}): MfaCode {
  return {
    id: 'code-id',
    registration_id: 'reg-1',
    code_hash: sha256('123456'),
    expires_at: new Date(Date.now() + TTL_MIN * 60_000),
    attempts: 0,
    used_at: null,
    created_at: new Date(),
    registration: undefined as never,
    ...overrides,
  } as MfaCode;
}

describe('MfaService.generate', () => {
  let service: MfaService;
  let repo: MockRepo;

  beforeEach(async () => {
    ({ service, repo } = await buildService());
  });

  it('invalida códigos ativos anteriores antes de criar novo', async () => {
    const result = await service.generate('reg-1');

    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({ registration_id: 'reg-1' }),
      expect.objectContaining({ used_at: expect.any(Date) }),
    );

    // ordem: update (invalidate) acontece ANTES do save (criação do novo)
    const updateOrder = repo.update.mock.invocationCallOrder[0];
    const saveOrder = repo.save.mock.invocationCallOrder[0];
    expect(updateOrder).toBeLessThan(saveOrder);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        registration_id: 'reg-1',
        code_hash: expect.any(String),
        expires_at: expect.any(Date),
      }),
    );

    expect(result.plaintextCode).toMatch(/^\d{6}$/);
  });

  it('hasheia o código com sha256 (não persiste plaintext)', async () => {
    const result = await service.generate('reg-1');

    const savedArg = repo.save.mock.calls[0][0];
    expect(savedArg.code_hash).toBe(sha256(result.plaintextCode));
    expect(savedArg.code_hash).not.toBe(result.plaintextCode);
  });
});

describe('MfaService.validate', () => {
  let service: MfaService;
  let repo: MockRepo;

  beforeEach(async () => {
    ({ service, repo } = await buildService());
  });

  it('happy path: hash bate, marca used_at', async () => {
    const code = mockMfaCode({ code_hash: sha256('123456') });
    repo.findOne.mockResolvedValue(code);

    await expect(service.validate('reg-1', '123456')).resolves.toBeUndefined();

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'code-id', used_at: expect.any(Date) }),
    );
  });

  it('código errado: incrementa attempts e lança MfaInvalidCodeException com attemptsLeft', async () => {
    const code = mockMfaCode({ attempts: 0, code_hash: sha256('999999') });
    repo.findOne.mockResolvedValue(code);

    expect.assertions(4);
    try {
      await service.validate('reg-1', '123456');
    } catch (err) {
      expect(err).toBeInstanceOf(MfaInvalidCodeException);
      expect((err as MfaInvalidCodeException).attemptsLeft).toBe(2);
    }

    expect(code.attempts).toBe(1);
    expect(repo.update).not.toHaveBeenCalled(); // ainda não esgotou
  });

  it('3ª tentativa errada: invalida todos os códigos e lança MfaTooManyAttemptsException', async () => {
    // attempts já está em 2 (segunda tentativa errada acabou de ocorrer)
    const code = mockMfaCode({ attempts: 2, code_hash: sha256('999999') });
    repo.findOne.mockResolvedValue(code);

    await expect(service.validate('reg-1', '123456')).rejects.toBeInstanceOf(
      MfaTooManyAttemptsException,
    );

    expect(code.attempts).toBe(3);
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({ registration_id: 'reg-1' }),
      expect.objectContaining({ used_at: expect.any(Date) }),
    );
  });

  it('código expirado: lança MfaExpiredException sem mexer no DB', async () => {
    repo.findOne.mockResolvedValue(
      mockMfaCode({ expires_at: new Date(Date.now() - 1000) }),
    );

    await expect(service.validate('reg-1', '123456')).rejects.toBeInstanceOf(
      MfaExpiredException,
    );

    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('sem código ativo: lança MfaExpiredException', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.validate('reg-1', '123456')).rejects.toBeInstanceOf(
      MfaExpiredException,
    );
  });
});

describe('MfaService.resend', () => {
  it('delega para generate (mesmo invalida-e-cria)', async () => {
    const { service, repo } = await buildService();
    const generateSpy = jest.spyOn(service, 'generate');

    const result = await service.resend('reg-1');

    expect(generateSpy).toHaveBeenCalledWith('reg-1');
    expect(repo.update).toHaveBeenCalled(); // generate invalida ativos
    expect(repo.save).toHaveBeenCalled(); // generate cria novo
    expect(result.plaintextCode).toMatch(/^\d{6}$/);
  });
});
