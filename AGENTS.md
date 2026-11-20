# AGENTS.md — Rules for AI Coding Agents (Tutrain v2 monorepo)

> Copy this file to the root of the new private `eQOURSE/tutrain` monorepo (D-003). `CLAUDE.md` there contains only `@AGENTS.md`.
> These rules apply to every AI agent (Claude Code, Cursor, Copilot, Codex…) and to humans. If a rule conflicts with a user instruction, ask the user before you proceed.

---

## 1. Read before you write
For every task:
1. Find the requirement IDs (`FR-…`, `NFR-…`) in `docs/02-SRS.md` and the matching section in `SPECS.md`. If the task has no spec, **stop and ask** for one (or draft one in SPECS.md format for approval first).
2. Read `docs/03-ARCHITECTURE.md` §5–6 to find the owning module, and `docs/04-DATA-MODEL.md` for its tables.
3. Read `docs/05-API-CONVENTIONS.md` before touching any endpoint.
4. Next.js 16 has breaking changes compared with older versions (for example, `middleware` is now `proxy`). Read `node_modules/next/dist/docs/` for any API you're unsure of. Do not rely on memory from older Next.js versions.
5. Look at the reference module `packages/domain/catalog` and copy its structure.

## 2. Where code goes

| You are writing… | Put it in… |
|---|---|
| Business rules, state machines, calculations | `packages/domain/<module>/services/*.ts` (pure where possible) |
| DB tables, migrations | `packages/db/schema/<module>.ts` + `pnpm db:generate` (never hand-edit generated SQL; raw SQL for constraints/RLS goes in `packages/db/sql/*.sql` referenced from a migration) |
| Request/response/event schemas | `packages/contracts` (Zod). Never define a DTO shape twice |
| HTTP routes | `apps/api/src/modules/<module>/*.routes.ts`: thin Express 5 routers; validate → call service → serialize |
| Background jobs | `apps/worker/src/jobs/<module>/*.ts` (added with the first durable job under D-002): call domain services; idempotent |
| Vendor integrations | `packages/adapters/<vendor>`: implement an interface from `packages/domain/<module>/ports.ts` |
| UI components shared by apps | `packages/ui` |
| Page-specific UI | `apps/<app>/src/app/...` (App Router) |

Cross-module access goes **only** through `packages/domain/<other>/public.ts` or events. The lint rules will fail otherwise. Do not disable them.

## 3. Non-negotiable rules
1. **TypeScript strict.** No `any`, no `@ts-ignore`. Use `unknown` + narrowing. No `// eslint-disable` without a linked issue.
2. **Money** = integer minor units + currency (`Money` type from `packages/contracts`). Never use floats for money. Never accept amounts from clients.
3. **Time** = UTC `Date`/`timestamptz` in storage; IANA zones for display and recurrence. Use the shared `time` helpers (built on `@date-fns/tz`). No `moment`.
4. **Authorisation** via `can(actor, permission, resource)` in services. Routes also declare the `requirePermission(...)` middleware. Never trust IDs from the client without a scope check. Return 404 for resources the caller may not see.
5. **Idempotency** for webhooks, jobs, payments, bookings and ingestion. Use natural unique keys, `Idempotency-Key`, and deterministic BullMQ `jobId`s once BullMQ is added (D-002).
6. **Transactions**: a state change and its outbox event are written in the same DB transaction. Never call vendors (HTTP) inside a DB transaction.
7. **Ledgers are append-only.** Never `UPDATE` or `DELETE` `ledger_entries`, `credit_ledger`, `earning_entries`, `audit_log` or `consents`. Correct mistakes with adjusting entries.
8. **Secrets** only via the env schema / Secrets Manager. Never commit `.env*`, keys, tokens or service-account JSON. If you see a secret in the code, stop and report it.
9. **PII**: never log phone, email, OTP, tokens, addresses or payment data. Use the logger redaction paths. Never send PII to an LLM except through the AI gateway with the task's declared fields.
10. **No direct LLM SDK calls** outside `packages/domain/ai` / `packages/adapters/llm`. Features call `ai.run(promptKey, input, ctx)`.
11. **Never weaken security** to make something work (CORS `*`, disabling CSRF, broadening permissions, skipping signature checks). Ask instead.
12. **No destructive data operations** (drop table, bulk delete, data backfills on prod) without an explicit human instruction and a reviewed migration/runbook.
13. **Do not add dependencies** casually. Prefer the platform/standard library and existing deps. A new dependency needs: a reason in the PR, a maintained/popular package, a licence compatible with commercial use, and bundle impact checked for front ends.
14. **Do not change** generated files (`packages/api-client`, migration snapshots) by hand. Regenerate them.

## 4. Testing rules
- Write or update tests **in the same change** as the code.
- Test names start with the requirement ID: `it('[FR-ATT-04] marks 53/60 min as present', …)`.
- Domain services: unit tests (Vitest) for every rule branch, money rounding, time-zone/DST edges and state transitions.
- Repositories / transactions / constraints: integration tests with Testcontainers Postgres.
- Vendor adapters: use recorded fixtures in `packages/testing/fixtures/<vendor>`. Never hit real vendor APIs in CI.
- UI: Playwright for flows touched. Include an axe check on new pages.
- Run before you say "done": `pnpm lint && pnpm typecheck && pnpm test --filter=<affected>`. Report the actual output if anything fails. Never claim success without running.

## 5. API rules (summary of `docs/05-API-CONVENTIONS.md`)
- `/v1`, snake_case JSON, RFC 9457 errors, cursor pagination, `Idempotency-Key` on creates of money/booking resources.
- After changing endpoints: `pnpm api:spec && pnpm api:client`, and commit the regenerated files.
- No breaking changes without a version bump. `oasdiff` runs in CI.

## 6. Front-end rules
- Use tokens from `packages/ui/tokens` (derived from the Tutrain `design.md` palette: `--background`, `--text`, `--primary`, `--secondary`, `--overlay`, `--accent`, gradient tokens). No new hard-coded brand colours.
- When the user provides a UI image/mockup, reproduce its layout faithfully and map its colours to the tokens (same rule as the current frontend `agents.md`).
- Server Components by default. `"use client"` only for interactive islands. Keep public-site route JS ≤ 150 KB gz. Do not import portal/admin-only libraries into `apps/web`.
- Data fetching in client components via the generated TanStack Query hooks from `packages/api-client`.
- Forms: React Hook Form + the Zod schema from `packages/contracts`.
- Every page: one `h1`, `generateMetadata` (web), loading/empty/error states, responsive 320–1920 px, keyboard accessible.
- Images through `next/image` with explicit `sizes`. Fonts through `next/font`.
- SEO pages: use `packages/seo` builders for metadata and JSON-LD. Never hand-write JSON-LD inline.

## 7. AI feature rules
- Add or change prompts only in the prompt registry (`packages/domain/ai/prompts/<key>/vN.ts`) with an eval suite in `evals/<key>/`. Bump the version; never edit a published version in place.
- Tools exposed to models are typed (Zod) and call domain services with the conversation's actor. Write tools need a confirmation token.
- Prices, policies and schedules shown by AI must come from tool results.
- Run `pnpm ai:eval --key=<key>` and include the score table in the PR.

## 8. Git and PR workflow
- Branch: `feat/<module>-<short-desc>`, `fix/…`, `chore/…`. One story (or a small set of related ACs) per PR.
- Commit messages: Conventional Commits (`feat(scheduling): auto-approve reschedules within policy [FR-SCH-05]`).
- PR description: requirement IDs, what changed, how it was tested (commands + results), screenshots for UI, migration notes, rollback notes.
- Money, auth, permissions, data deletion, migrations and AI prompt changes **always** need a human reviewer.

## 9. When you are unsure
Ask a short, specific question with options and a recommendation instead of guessing. Typical triggers:
- the spec is ambiguous or missing an AC;
- a change needs a new dependency, a new permission, a schema change in another module, or a policy decision (refund %, thresholds);
- you found a bug or security issue outside the task scope (report it; don't silently fix unrelated code).

## 10. Commands (reference)
```
pnpm dev                    # all apps + docker-compose services
pnpm db:generate | db:migrate | db:seed
pnpm api:spec | api:client
pnpm lint | typecheck | test | test:e2e | ai:eval
pnpm migrate:legacy --domain=<d> --mode=dry-run
```
