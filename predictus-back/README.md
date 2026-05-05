# Predictus Back

API do desafio Predictus — cadastro incremental multi-step com MFA por e-mail, detecção de abandono e retomada por link.

## Stack

- NestJS 11 + TypeORM + PostgreSQL 17
- `class-validator` (DTOs) + `zod` (env)
- `@nestjs/throttler` (rate limit) + `@nestjs/schedule` (cron)
- Resend (e-mail) + ViaCEP (consulta de endereço)
- Jest (unit + integração)
- Biome (lint + format)

## Subindo o projeto

Pré-requisitos: Node 20+, Docker, e API key da Resend.

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

A API sobe em `http://localhost:8080`. Healthcheck em `GET /health`.

## Variáveis de ambiente

Todas validadas via `zod` em [`src/config/env.schema.ts`](src/config/env.schema.ts) — boot falha se algo estiver inválido.

| Variável | Obrigatória | Default | Descrição |
| --- | --- | --- | --- |
| `NODE_ENV` | não | `development` | `development` \| `test` \| `production` |
| `PORT` | não | `8080` | Porta do servidor |
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
2. Para testes locais, usar `EMAIL_FROM=onboarding@resend.dev` (sender de teste da Resend).

> **Limitação do modo teste:** com o sender `onboarding@resend.dev`, a Resend **só entrega para o e-mail dono da API key** (email da conta).

## Testes

```bash
npm run test           
npm run test:cov       
```

## Decisões arquiteturais

- **Persistência incremental** — cada step submete um POST que atualiza colunas específicas em `registrations`.
- **Status** — `in_progress` (default) → `finished` (concluiu) ou `abandoned` (cron detecta inatividade). Submissão em registro `abandoned` reativa para `in_progress`.
- **MFA inline em `registrations`** — código MFA vive em 3 colunas na própria tabela (`mfa_code_hash`, `mfa_code_expires_at`, `mfa_code_attempts`). O portão "MFA passou" é derivado de `current_step >= 2` (verify só avança o step depois de bater o hash). Cada código vale por `MFA_CODE_TTL_MINUTES` (default 10 min) e aceita até `MFA_MAX_ATTEMPTS` (default 3) tentativas, se acabarem as tentativas, o código é invalidado e o usuário precisa pedir outro via `POST /mfa/resend` (rate-limit 3/10min).
- **`SessionGuard`** valida o cookie HttpOnly em todas as rotas de step e injeta o `Registration` no request via `@CurrentRegistration()`.
- **Detecção de abandono via cron** — [`abandonment-detection.service.ts`](src/modules/registration/abandonment-detection.service.ts) roda a cada minuto e marca como `abandoned` quem passou do MFA e ficou parado por mais de `ABANDONMENT_TIMEOUT_MINUTES` (default 5 min). Envia 1 email de retomada por ciclo — `recovery_email_sent_at` faz o dedupe e é resetado quando o registro reativa.
- **Retomada por link** — cookie HttpOnly + token na URL como fallback. `GET /registration/resume?token=...` reativa, refaz o cookie e devolve `redirectTo` do step apropriado.
- **Rate limit** — default global de 10 req/min/IP via `ThrottlerGuard`; overrides inline mais restritivos em `/identification` (5/min) e `/mfa/resend` (3/10min).
- **Providers como interfaces** (`CEP_PROVIDER`, `EMAIL_PROVIDER`) — facilita troca/mocks em teste sem acoplar ao Resend ou ViaCEP.
- **Exceções de domínio** — `src/shared/exceptions/domain.exceptions.ts` mapeiam erro de negócio direto pra HTTP code, sem tratar `BadRequestException` como categoria genérica.

```bash
npm run lint           # check
npm run lint:fix       # check + autofix
npm run format         # format only
```
