# tutrain

## What this repository is

This private repository (D-003) holds Tutrain v2, an Express 5 TypeScript modular monolith (D-002) on PostgreSQL 16 (D-001).

## Source of truth

AGENTS.md, CLAUDE.md, SPECS.md, progress.md, docs/ and docs/contracts/ live here in eQOURSE/tutrain. They were imported unchanged from tutrain-backend commit 851227b12ce03bd59779d5de4b4e034edbfa0ea8 on 2026-11-20. The tutrain-backend copies are migration history. Change the documents here, by PR.

## What stays in tutrain-backend

The legacy code, its architecture document and secret inventory, and A01/A02 progress stay in tutrain-backend until those PRs finish.

## Local development

Use Node 22.12+ or Node 24, enable Corepack, install Docker and pnpm, then run `pnpm install`. Create `apps/api/.env` from [apps/api/README.md](./apps/api/README.md), including the local `DATABASE_URL`, and run `pnpm dev`. The `pnpm dev` script starts PostgreSQL with `docker compose up -d --wait postgres` before starting the API. `pnpm db:up` starts only PostgreSQL, while `pnpm dev:api` starts only the API. `docker compose down` stops PostgreSQL and keeps the named volume.

On Windows when Docker runs only in WSL, run Docker Compose from WSL in the repository folder, then start the API with `pnpm dev:api`:

```sh
cd /mnt/f/projects/tutrain
docker compose up -d --wait postgres
pnpm dev:api
```

## How changes merge

Every change goes through a pull request into develop, needs one approval from the other developer, and merges with a merge commit. The organisation is on GitHub Free, so GitHub doesn't enforce these rules or the required checks on this private repository. They are a team agreement: don't merge without the other developer's approval or with a failing check.

## Checks

Run `npm run test:docs` on Node 22. CI runs docs-check and secret-scan on every pull request and on pushes to develop and main. secret-scan finds a secret only after it reaches GitHub, so any finding means rotating that credential.
