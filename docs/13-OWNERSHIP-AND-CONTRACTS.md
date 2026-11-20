# 13 — Ownership and Contracts

This document is the human-readable companion to [ownership.json](./contracts/ownership.json) and [events.json](./contracts/events.json). The mock responses currently live under `docs/contracts/fixtures/`; TTV2-A03 will move them into the v2 contract packages.

## Ownership map

The domain ownership below is copied from [03-ARCHITECTURE.md §6](./03-ARCHITECTURE.md) and the developer boundaries in `progress.md`.

| Module | Owner | Contracts path | Public API |
|---|---|---|---|
| iam | kartik | `packages/contracts/iam` | `packages/domain/iam/public.ts` |
| catalog | kartik | `packages/contracts/catalog` | `packages/domain/catalog/public.ts` |
| crm | bhavesh | `packages/contracts/crm` | `packages/domain/crm/public.ts` |
| commerce | kartik | `packages/contracts/commerce` | `packages/domain/commerce/public.ts` |
| billing | kartik | `packages/contracts/billing` | `packages/domain/billing/public.ts` |
| tutors | kartik | `packages/contracts/tutors` | `packages/domain/tutors/public.ts` |
| scheduling | kartik | `packages/contracts/scheduling` | `packages/domain/scheduling/public.ts` |
| classroom | kartik | `packages/contracts/classroom` | `packages/domain/classroom/public.ts` |
| attendance | kartik | `packages/contracts/attendance` | `packages/domain/attendance/public.ts` |
| media | kartik | `packages/contracts/media` | `packages/domain/media/public.ts` |
| lms | bhavesh | `packages/contracts/lms` | `packages/domain/lms/public.ts` |
| payouts | kartik | `packages/contracts/payouts` | `packages/domain/payouts/public.ts` |
| support | bhavesh | `packages/contracts/support` | `packages/domain/support/public.ts` |
| notifications | kartik | `packages/contracts/notifications` | `packages/domain/notifications/public.ts` |
| ai | bhavesh | `packages/contracts/ai` | `packages/domain/ai/public.ts` |
| analytics | bhavesh | `packages/contracts/analytics` | `packages/domain/analytics/public.ts` |
| audit | kartik | `packages/contracts/audit` | `packages/domain/audit/public.ts` |
| config | kartik | `packages/contracts/config` | `packages/domain/config/public.ts` |

The complete path map, including reviewers and sources, is machine-readable in [ownership.json](./contracts/ownership.json). Its `developers` list contains only the two developer identifiers: `kartik` and `bhavesh`.

| Path | Owner | Reviewers | Source |
|---|---|---|---|
| `apps/api` | kartik |  | progress.md — Kartik |
| `apps/worker` | kartik |  | D-002 — added later with the first durable job; progress.md — Kartik |
| `packages/db` | kartik | bhavesh | progress.md — Kartik; shared review rules |
| `packages/adapters` | kartik |  | progress.md — Kartik |
| `packages/adapters/payments` | kartik | bhavesh | proposed — payment adapter review |
| `packages/domain/iam` | kartik | bhavesh | progress.md — Kartik; auth and child-data review |
| `packages/domain/config` | kartik |  | progress.md — Kartik |
| `packages/domain/catalog` | kartik |  | progress.md — Kartik |
| `packages/domain/notifications` | kartik |  | progress.md — Kartik |
| `packages/domain/commerce` | kartik | bhavesh | progress.md — Kartik; payment review |
| `packages/domain/billing` | kartik | bhavesh | progress.md — Kartik; payment and ledger review |
| `packages/domain/tutors` | kartik |  | progress.md — Kartik |
| `packages/domain/scheduling` | kartik | bhavesh | progress.md — Kartik; ledger and child-data review |
| `packages/domain/classroom` | kartik | bhavesh | progress.md — Kartik; participant identity and recording artefact review |
| `packages/domain/attendance` | kartik | bhavesh | progress.md — Kartik; recording and child-data review |
| `packages/domain/media` | kartik | bhavesh | progress.md — Kartik; recording review |
| `packages/domain/payouts` | kartik | bhavesh | progress.md — Kartik; ledger review |
| `infra` | kartik |  | progress.md — Kartik |
| `apps/web` | bhavesh |  | D-002 — added later as the public surface migrates; progress.md — Bhavesh |
| `apps/app` | bhavesh |  | D-002 — added later as the portal surface migrates; progress.md — Bhavesh |
| `apps/admin` | bhavesh |  | D-002 — added later as the admin surface migrates; progress.md — Bhavesh |
| `packages/ui` | bhavesh |  | progress.md — Bhavesh |
| `packages/seo` | bhavesh | kartik | proposed — progress.md; missing from docs/03-ARCHITECTURE.md §5 |
| `packages/domain/crm` | bhavesh | kartik | progress.md — Bhavesh; child-data review |
| `packages/domain/ai` | bhavesh | kartik | progress.md — Bhavesh; AI prompt review |
| `packages/domain/lms` | bhavesh | kartik | progress.md — Bhavesh; child-data review |
| `packages/domain/support` | bhavesh | kartik | progress.md — Bhavesh; safeguarding and child-data review |
| `packages/domain/analytics` | bhavesh |  | progress.md — Bhavesh |
| `packages/domain/audit` | kartik | bhavesh | proposed — docs/03-ARCHITECTURE.md §6; TTV2-A04 |
| `apps/api/src/modules/<module>` | module | kartik, bhavesh | proposed — AGENTS.md §2; resolved per module owner |
| `apps/worker/src/jobs/<module>` | module | kartik, bhavesh | D-002 — added later with the first durable job; AGENTS.md §2; resolved per module owner |
| `packages/db/schema/<module>.ts` | module | kartik, bhavesh | proposed — AGENTS.md §2; resolved per module owner |
| `packages/adapters/llm` | bhavesh | kartik | proposed — AGENTS.md §2 rule 10; ai module |
| `packages/adapters/embeddings` | bhavesh | kartik | proposed — AGENTS.md §2 rule 10; ai module |
| `packages/db/migrations` | generated | kartik, bhavesh | proposed — drizzle-kit journal conflict rule |
| `packages/config` | kartik | bhavesh | proposed — tooling ownership gap |
| `packages/config/tailwind` | bhavesh | kartik | proposed — Tailwind preset ownership gap |
| `packages/testing` | kartik | bhavesh | proposed — testing ownership gap |
| `packages/contracts/events/<module>` | module | kartik, bhavesh | proposed — producing module owns its event contracts |
| `packages/api-client` | generated | kartik, bhavesh | proposed — AGENTS.md rule 14 |
| `packages/contracts/openapi.json` | generated | kartik, bhavesh | proposed — AGENTS.md rule 14 |
| `apps` | shared | kartik, bhavesh | proposed — both developers own an app under apps/ |
| `packages` | shared | kartik, bhavesh | docs/03-ARCHITECTURE.md §5 |
| `packages/domain` | shared | kartik, bhavesh | docs/03-ARCHITECTURE.md §5 |
| `packages/contracts` | shared | kartik, bhavesh | docs/03-ARCHITECTURE.md §5; AGENTS.md §2 |
| `.github/workflows` | kartik | bhavesh | proposed — CI ownership gap |
| `turbo.json` | kartik | bhavesh | deferred by D-002; add only if Turborepo is justified |
| `pnpm-workspace.yaml` | kartik | bhavesh | proposed — root build ownership gap |
| `package.json` | kartik | bhavesh | proposed — root build ownership gap |
| `docs/` | shared | kartik, bhavesh | progress.md — shared rules |
| `AGENTS.md` | shared | kartik, bhavesh | proposed — shared documentation |
| `CLAUDE.md` | shared | kartik, bhavesh | proposed — shared documentation |
| `SPECS.md` | shared | kartik, bhavesh | proposed — shared documentation |
| `progress.md` | shared | kartik, bhavesh | proposed — shared documentation |

## Contract rules

- A module's request, response and event contracts live in `packages/contracts/<module>` and belong to that module's owner.
- The owner value `module` means “the owner of that named module in `modules`”; it does not mean that both developers own every module-scoped folder.
- The other developer proposes a contract change by PR; the module owner reviews and accepts it.
- Generated files are never edited by hand. TTV2-A03 creates the CODEOWNERS file from ownership.json.
- Modules reach one another only through the owning module's `public.ts` interface or through events, as required by [03-ARCHITECTURE.md §5](./03-ARCHITECTURE.md).
- The shared event catalogue is in [events.json](./contracts/events.json); event names, envelopes, versions and idempotent consumers follow [05-API-CONVENTIONS.md §6](./05-API-CONVENTIONS.md#6-events-outbox).
- HTTP versioning, snake_case JSON, pagination, errors and generated clients follow [05-API-CONVENTIONS.md §1–4 and §10](./05-API-CONVENTIONS.md#1-basics).

The ownership rules deliberately leave module-scoped API controllers, worker jobs, database schemas and event folders resolved by the named module. The rest of each app or package remains with its base owner. Database migrations are generated and merged one migration PR at a time after rebasing and regenerating against the current `develop` branch.

## Mock fixtures

Fixtures live now under `docs/contracts/fixtures/<module>/`. TTV2-A03 moves them to `packages/contracts/<module>/fixtures`; Bhavesh's mock API layer in TTV2-B02 loads them from there. TTV2-A05 and TTV2-A06 keep their real responses matching the fixtures, or update the fixtures in the same PR when a contract changes.

The fixtures cover IAM OTP, sessions and role views; catalogue markets, products, taxonomy and quotes; and shared 404 and 422 Problem Details responses. All fixture people and contact values are synthetic.

## Proposed: needs Bhavesh's agreement

### Ownership proposals

- Module `audit` is proposed for Kartik because TTV2-A04 builds the audit log.
- `packages/seo` is proposed for Bhavesh because it is in `progress.md` but absent from the architecture layout.
- `apps` is shared because it contains Kartik's API and worker plus Bhavesh's web, app and admin apps.
- `packages/domain/audit` is proposed for Kartik.
- `apps/api/src/modules/<module>`, `apps/worker/src/jobs/<module>`, `packages/db/schema/<module>.ts` and `packages/contracts/events/<module>` use the proposed `module` owner marker.
- `packages/adapters/llm` and `packages/adapters/embeddings` are proposed for Bhavesh under the AI boundary.
- `packages/adapters/payments` is proposed for Kartik with Bhavesh review.
- `packages/db/migrations` is generated; branches must rebase and regenerate, with one migration PR merging at a time.
- `packages/config` is proposed for Kartik and `packages/config/tailwind` for Bhavesh.
- `packages/testing` is proposed for Kartik; module fixtures resolve to their module owner.
- `packages/contracts/events/<module>` is proposed as producing-module ownership.
- `packages/api-client` and `packages/contracts/openapi.json` are generated and not hand-edited.
- `.github/workflows`, `pnpm-workspace.yaml` and the root `package.json` are proposed for Kartik with Bhavesh review. `turbo.json` is deferred by D-002 unless Turborepo is justified.
- `AGENTS.md`, `CLAUDE.md`, `SPECS.md` and `progress.md` are proposed as shared documentation.

### Event producer proposals

- `commerce.order.created`: billing consumes it, but the source table does not name its producer; commerce is proposed.
- `classroom.participant.joined`: the source names `participant.joined` without a module; classroom is proposed.
- `cms.page.published`: CMS inside `apps/web` is the proposed extra producer, owned by Bhavesh.

### Event rename proposal

- The documented `chat.handoff` is proposed as `ai.chat.handed_off` so the full name uses a past-tense verb; the documented spelling remains in `short_name`.
- `attendance.computed` is proposed as `attendance.record.computed` and `attendance.overridden` as `attendance.record.overridden`; the documented spellings remain in `short_name`.
- `config.changed` is proposed as `config.setting.changed`; the documented spelling remains in `short_name`.

### Event catalogue proposals

The following event names are inferred from the short names in the architecture table and remain proposed until the owners agree: `iam.user.created`, `iam.consent.given`, `iam.consent.withdrawn`, `crm.lead.created`, `crm.demo.booked`, `crm.lead.won`, `commerce.order.paid`, `commerce.order.partially_paid`, `commerce.order.refunded`, `billing.payment.succeeded`, `billing.payment.failed`, `billing.invoice.issued`, `tutors.tutor.approved`, `tutors.tutor.leave_approved`, `scheduling.enrollment.activated`, `scheduling.session.scheduled`, `scheduling.session.cancelled`, `scheduling.session.outcome_set`, `classroom.conference.ended`, `classroom.artifact.available`, `classroom.participant.joined`, `media.recording.ready`, `media.transcript.ready`, `lms.session_log.submitted`, `lms.report.published`, `payouts.payout.paid`, `support.ticket.created`, `notifications.notification.delivered`, `notifications.notification.failed`, `ai.chat.lead_captured`, `attendance.record.computed`, `attendance.record.overridden` and `config.setting.changed`.
