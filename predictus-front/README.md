# Predictus — Frontend (cadastro incremental)

App Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript. Front-end do fluxo de cadastro em 5 passos com verificação de e-mail, persistência incremental e retomada por link.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack)
- **React 19** — `useActionState` via wrapper `useFormState` próprio
- **Tailwind CSS v4** (CSS-first via `@import "tailwindcss"`)
- **TypeScript** estrito + **Biome** (lint + format)
- **ky** — HTTP client com hooks de cookie marshaling
- **Zod 4** — validação de schemas (cliente + payload pro backend)
- **pino** — logger estruturado server-side
- **`@t3-oss/env-nextjs`** — env vars tipados
- **tailwind-variants** + `clsx` + `tailwind-merge` — UI primitives

Sem React Hook Form, sem Zustand, sem TanStack Query — formulários nativos com Server Actions.

## Como rodar

```bash
# 1. Instalar deps
npm install

# 2. Preparar env
cp .env.local.example .env.local
# editar .env.local com BACKEND_URL apontando pro Nest (default: http://localhost:3001)

# 3. Subir o backend primeiro (em outro terminal)
cd ../predictus-back
npm run start:dev

# 4. Subir o frontend
cd predictus-front
npm run dev
# http://localhost:3000 → redireciona pra /signup/identification
```

### Variáveis de ambiente

| Var | Obrigatória | Default | Descrição |
|-----|-------------|---------|-----------|
| `BACKEND_URL` | sim | — | URL do Nest (ex: `http://localhost:3001`) |
| `NEXT_PUBLIC_APP_URL` | sim | — | URL pública do front (ex: `http://localhost:3000`) |
| `LOG_LEVEL` | não | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` |

## Scripts

```bash
npm run dev        # dev server com Turbopack
npm run build      # build de produção
npm run start      # serve build local
npm run lint       # Biome check
npm run lint:fix   # Biome check --write
npm run format     # Biome format --write
```

## Estrutura

```text
predictus-front/
├── app/
│   ├── layout.tsx                # root layout (html/body)
│   ├── page.tsx                  # home → redirect /signup/identification
│   ├── globals.css               # Tailwind v4 + tema (--color-primary)
│   └── signup/
│       ├── layout.tsx            # guard server-side + Stepper
│       ├── identification/page.tsx
│       ├── verify/page.tsx
│       ├── document/page.tsx
│       ├── contact/page.tsx
│       ├── address/page.tsx
│       ├── review/page.tsx
│       ├── success/page.tsx
│       └── resume/route.ts       # GET handler do link de retomada
├── components/
│   ├── ui/                       # primitives (Input, Button, FormField, Stepper, StepLayout, MaskedInput)
│   └── forms/                    # forms por step (FormIdentification, FormMfa, ...)
├── lib/
│   ├── actions/
│   │   ├── registration.ts       # server actions de cada step + finish
│   │   ├── cep.ts                # lookupCep server action
│   │   └── _state.ts             # getRegistrationState (helper, não action)
│   ├── schemas/
│   │   ├── registration.ts       # Zod schemas por step
│   │   └── validators.ts         # CPF / CNPJ / mobile-br
│   ├── http/
│   │   ├── backend-api.ts        # ky instance + cookie hooks
│   │   └── form-state.ts         # FormState type + mapKyErrorToFormState
│   ├── hooks/
│   │   └── use-form-state.ts     # wrapper de useActionState
│   └── logger.ts                 # pino
├── env/
│   ├── index.ts                  # env tipado (server + client)
│   └── public.ts                 # PUBLIC_ENV (safe pra `'use client'`)
├── helpers/
│   └── utils.ts                  # cn()
└── proxy.ts                      # Next 16 (ex-middleware): expõe x-pathname
```

## Decisões

### Por que Server Actions em vez de React Hook Form?

Forms simples + validação Zod no boundary do server. Cada submit vai pra uma `'use server'` action que:

1. Valida o `FormData` com o schema correspondente
2. Repassa pro Nest via `ky`
3. Retorna `FormState<T>` (tipado, com `errors` per-field e `data` opcional)
4. Em 401 (`no_session`), redireciona pra `/signup/identification` com query `?error=expired_token`

Sem state management cliente-side, sem `react-hook-form`. O hook `useFormState` é só um wrapper minúsculo de `useActionState` que normaliza `handleSubmit` e oferece `onSuccess`/`onError`.

### Por que `ky` (e não `fetch` direto ou `axios`)?

`ky` tem hooks (`beforeRequest`, `afterResponse`) que permitem **cookie marshaling**:

- Antes de cada request, lê `registration_session` do `cookies()` do Next e injeta no header `Cookie:`
- Depois de cada response, parseia `Set-Cookie` e propaga pro cookie store do Next via `cookies().set(...)`

O cookie é HttpOnly, vive no domínio do Next. O Nest acha que está conversando direto com o browser.

### Por que sem rewrite/proxy de backend?

Todo backend call passa por **server-side**. Cliente nunca chama o Nest direto. Vantagens:

- Cookie HttpOnly fica server-side (não vaza pro JS do cliente)
- Erros do Nest são traduzidos no boundary (server) e nunca expõem detalhes internos
- CORS irrelevante (server-to-server)

### Por que sem Zustand / TanStack Query?

Estado global é o backend. Cada page é Server Component que chama `getRegistrationState()` direto no Nest e renderiza o form com `partialData` pré-preenchido. Não há cache cliente-side a sincronizar.

### Por que Biome em vez de ESLint + Prettier?

- Single binary, single config, single comando
- Lint + format + organize-imports tudo junto
- ~10x mais rápido que ESLint
- Suporta Tailwind v4 directives nativamente (`@theme`, `@apply`)

O challenge pede ESLint, mas Biome é o que se usa em projetos novos hoje. Trade-off documentado.

## Fluxos importantes

### Forward-only com exceção em revisão

`app/signup/layout.tsx` busca o `state` do backend a cada navegação e bloqueia avanço além do `currentStep`. Exceção: `?edit=review` na query string libera o acesso a steps anteriores **a partir da página de revisão** (botão "Editar" em cada seção). Após salvar, o form retorna pra `/signup/review`.

### Retomada por link

O backend envia e-mail com link tipo `https://app/signup/resume?token=<uuid>`. O route handler em `app/signup/resume/route.ts`:

1. Faz `GET /registration/resume?token=...` no Nest
2. Backend valida token, reativa registro abandonado e seta cookie
3. Backend retorna `{ redirectTo: '/signup/<step>' }`
4. Route handler propaga o cookie via `ky` afterResponse hook e responde com `NextResponse.redirect(...)`

Erros: `expired_token` (410) e `invalid_token` (404) viram redirect pra `/signup/identification?error=...`, mostrando banner correspondente.

### Detecção de abandono

Cuidada inteiramente pelo backend (cron job). O frontend só recebe o e-mail do Nest com o link de retomada quando o cron classifica o registro como abandonado.

## Como testar end-to-end

1. Subir backend + frontend
2. Acessar `http://localhost:3000` → redireciona pra `/signup/identification`
3. Preencher nome + e-mail → recebe código MFA (em dev, ver log do backend ou inbox de teste do Resend)
4. Inserir código → avança pro documento
5. Preencher CPF/CNPJ, contato, endereço (CEP autocompleta os campos via ViaCEP)
6. Revisão: botão "Editar" leva ao step com `?edit=review`
7. "Concluir cadastro" → `/signup/success`

### Simular abandono e retomada

```sql
-- pegar resume_token do banco
SELECT resume_token FROM registrations WHERE email = 'voce@email.com';
```

Acessar `http://localhost:3000/signup/resume?token=<uuid>` → cookie é setado, redirect pro step certo.

## Convenções

- **Código em inglês**, **copy de UI em pt-BR** (incluindo URL paths em inglês: `/signup/...`).
- Server Actions sem sufixo `Action`. Nomeadas com verbo + objeto (`submitIdentification`, `verifyMfa`).
- Forms com prefixo `Form*` em PascalCase, arquivos `form-*.tsx` em kebab-case.
- Compound components para UI primitives (`Input.Root` + `Input.Control`, `FormField.Root` + `FormField.Label` + `FormField.Message`).
- `tailwind-variants` (`tv`) pra buttons (variants + size + loading).
