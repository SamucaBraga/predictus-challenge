# Predictus

Implementação do desafio Predictus — cadastro incremental multi-step com MFA por e-mail, detecção de abandono e retomada por link. Desafio em [`challenge.md`](challenge.md).

## Layout

- [`predictus-back/`](predictus-back/) — API NestJS + TypeORM + PostgreSQL
- [`predictus-front/`](predictus-front/) — UI Next.js + React 19 + Tailwind v4

## Quick start

Cada app tem seu próprio README com setup detalhado, envs e decisões.

**Backend** ([predictus-back/README.md](predictus-back/README.md)):

```bash
cd predictus-back
docker compose up -d
npm install
npm run migration:run
npm run start:dev    
```

**Frontend** ([predictus-front/README.md](predictus-front/README.md)):

```bash
cd predictus-front
npm install
npm run dev          
```

## Lint/format: Biome em vez de ESLint + Prettier

Os dois apps usam [Biome](https://biomejs.dev) — substituto unificado de ESLint + Prettier, em Rust. Single binary, single config, lint + format + organize-imports juntos.
