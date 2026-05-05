# Predictus — Frontend (cadastro incremental)

App Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript. Front-end do fluxo de cadastro em 5 passos com verificação de e-mail, persistência incremental e retomada por link.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack, `proxy.ts`)
- **React 19** — `useActionState` via wrapper `useFormState` próprio + `<form action={...}>`
- **Tailwind CSS v4** (CSS-first via `@import "tailwindcss"` + `@theme`)
- **TypeScript** estrito + **Biome** (lint + format)
- **ky** — HTTP client com hooks de cookie marshaling
- **Zod 4** — validação de schemas (cliente + payload pro backend)
- **pino** — logger estruturado server-side
- **`@t3-oss/env-nextjs`** — env vars tipados
- **tailwind-variants** + `clsx` + `tailwind-merge` — UI primitives

## Como rodar

```bash
# 1. Instalar deps
npm install

# 2. Preparar env
cp .env.local.example .env.local
# editar com BACKEND_URL apontando pro Nest

# 3. Subir o backend
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
| `BACKEND_URL` | sim | — | URL do Nest (ex: `http://localhost:8080`) |
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
│   ├── globals.css               # Tailwind v4
│   └── signup/
│       ├── layout.tsx            # guard server-side (expectedRoute)
│       ├── identification/page.tsx
│       ├── verify/page.tsx
│       ├── document/page.tsx
│       ├── contact/page.tsx
│       ├── address/page.tsx
│       ├── review/page.tsx       # somente visualização (sem edição)
│       ├── success/page.tsx
│       └── resume/route.ts       # GET handler do link de retomada
├── components/
│   ├── ui/                       # primitives (Input, Button, FormField, StepLayout, MaskedInput, LoadingSpinner)
│   └── forms/                    # forms por step (FormIdentification, FormMfa, FormDocument, FormContact, FormAddress, ReviewSummary)
├── lib/
│   ├── actions/
│   │   ├── registration.ts       # server actions de cada step + finish
│   │   ├── cep.ts                # lookupCep server action
│   │   └── _state.ts             # getRegistrationState + RegistrationState/Status types
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
└── proxy.ts                      # Next 16 (ex-middleware) — expõe x-pathname
```