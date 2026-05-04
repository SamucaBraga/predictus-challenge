# Predictus Back

API do desafio Predictus — cadastro incremental multi-step com MFA por e-mail, detecção de abandono e retomada por link.

> Spec completa: [`docs/superpowers/specs/2026-05-02-cadastro-incremental-design.md`](../docs/superpowers/specs/2026-05-02-cadastro-incremental-design.md).

## Stack

- NestJS 11 + TypeORM + PostgreSQL 17
- `class-validator` (DTOs) + `zod` (env)
- `@nestjs/throttler` (rate limit) + `@nestjs/schedule` (cron)
- Resend (e-mail) + ViaCEP (consulta de endereço)
- Jest (unit + integração)
- Biome (lint + format)

## Subindo o projeto

Pré-requisitos: Node 20+, Docker, e uma API key da Resend (passo abaixo).

```bash
# 1. Banco
docker compose up -d

# 2. Dependências
npm install

# 3. Configurar env (ver seção abaixo)
cp .env.example .env   # ou criar do zero

# 4. Migrations
npm run migration:run

# 5. Servir
npm run start:dev
```

A API sobe em `http://localhost:3001`. Healthcheck em `GET /health`.

## Variáveis de ambiente

Todas validadas via `zod` em [`src/config/env.schema.ts`](src/config/env.schema.ts) — boot falha se algo estiver inválido.

| Variável | Obrigatória | Default | Descrição |
| --- | --- | --- | --- |
| `NODE_ENV` | não | `development` | `development` \| `test` \| `production` |
| `PORT` | não | `3001` | Porta do servidor |
| `DATABASE_URL` | sim | — | URL do Postgres |
| `RESEND_API_KEY` | sim | — | Chave da Resend (envio de e-mail) |
| `EMAIL_FROM` | sim | — | Sender verificado na Resend (`onboarding@resend.dev` para testes) |
| `BASE_URL` | sim | — | URL pública do **front** (usada em links de retomada nos e-mails) |
| `FRONTEND_ORIGIN` | sim | — | Origin permitida pelo CORS |
| `VIACEP_BASE_URL` | sim | — | Base URL do provider de CEP |
| `ABANDONMENT_TIMEOUT_MINUTES` | não | `5` | Tempo sem update até marcar como abandonado |
| `MFA_CODE_TTL_MINUTES` | não | `10` | Validade do código MFA |
| `MFA_MAX_ATTEMPTS` | não | `3` | Tentativas erradas antes de invalidar o código |
| `RESUME_TOKEN_TTL_DAYS` | não | `7` | Validade do token de retomada |

### Resend — API key e sender

1. Criar conta em [resend.com](https://resend.com), copiar API key (`re_...`) → `RESEND_API_KEY`.
2. Para testes locais, usar `EMAIL_FROM=onboarding@resend.dev` (sender verificado da Resend que entrega para qualquer destinatário).

## Testes

```bash
npm run test           
npm run test:cov       
```

## Decisões arquiteturais

- **Persistência incremental** — cada step submete um POST que atualiza colunas específicas em `registrations`. Não há tabela de "rascunho".
- **Status** — `in_progress` (default) → `finished` (concluiu) ou `abandoned` (cron detecta inatividade). Submissão em registro `abandoned` reativa para `in_progress`.
- **MFA bloqueante após step 1** — `SessionGuard` valida cookie + token; rotas de step exigem `mfa_validated_at` setado.
- **Detecção de abandono via cron** — `@Cron(EVERY_MINUTE)` em [`abandonment-detection.service.ts`](src/modules/registration/abandonment-detection.service.ts). Coluna `recovery_email_sent_at` desduplica para evitar spam.
- **Retomada por link** — cookie HttpOnly + token na URL como fallback. `GET /registration/resume?token=...` reativa, refaz o cookie e devolve `redirectTo` do step apropriado.
- **Rate limit** — default global de 10 req/min/IP via `ThrottlerGuard`; overrides inline mais restritivos em `/identification` (5/min) e `/mfa/resend` (3/10min).
- **Providers como interfaces** (`CEP_PROVIDER`, `EMAIL_PROVIDER`) — facilita troca/mocks em teste sem acoplar ao Resend ou ViaCEP.
- **Exceções de domínio** — `src/shared/exceptions/domain.exceptions.ts` mapeiam erro de negócio direto pra HTTP code, sem tratar `BadRequestException` como categoria genérica.

## Lint/format: Biome em vez de ESLint + Prettier

O challenge sugere ESLint, mas o projeto usa [Biome](https://biomejs.dev) — substituto unificado dos dois, em Rust, ~10–25× mais rápido. A config vive em [`biome.jsonc`](biome.jsonc); é um único binário (`biome check`) cobrindo lint + format. A regra `useImportType` está desligada porque `import type` quebra a metadata de DI do Nest (decorators precisam da classe em runtime).

```bash
npm run lint           # check
npm run lint:fix       # check + autofix
npm run format         # format only
```
