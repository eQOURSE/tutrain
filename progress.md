# Tutrain Platform v2 - Implementation Progress Plan

Status: Planning baseline
Last updated: 2026-11-20
Owners: Kartik (Developer A), Bhavesh (Developer B)
Source of truth: `docs/01-CURRENT-STATE-AUDIT.md`, `docs/02-SRS.md`, `docs/03-ARCHITECTURE.md`, `docs/04-DATA-MODEL.md`, `docs/05-API-CONVENTIONS.md`, `docs/06-ATTENDANCE-RECORDING-PIPELINE.md`, `docs/07-AI-PLATFORM.md`, `docs/08-WEB-SEO-PERFORMANCE.md`, `docs/09-SECURITY-COMPLIANCE.md`, `docs/10-ROADMAP.md`, `docs/11-DEPARTMENT-WORKFLOWS.md`, `AGENTS.md`, `SPECS.md`

## How to use this file

- Build one story at a time in the order below.
- Every implementation task must reference its `FR-*` or `NFR-*` requirement.
- Every acceptance criterion must have at least one test.
- `TODO` means planned but not started.
- `IN_PROGRESS` means actively being implemented.
- `BLOCKED` means work cannot continue until the listed decision or dependency is resolved.
- `DONE` requires code, tests, generated artifacts where applicable, documentation, review and the required verification commands.
- This file is a plan only. It does not replace `SPECS.md` or authorize production changes.

## Current repository condition

This is the new private repository eQOURSE/tutrain (D-003). It is the source of truth for the v2 documents and for the progress of TTV2-000, TTV2-002 and TTV2-A03 onwards. The documents were imported unchanged from tutrain-backend commit 851227b12ce03bd59779d5de4b4e034edbfa0ea8 on 2026-11-20; tutrain-backend keeps serving production during the migration. TTV2-A01 and TTV2-A02 are tracked in tutrain-backend's progress.md until their PRs finish. The v2 apps and packages don't exist yet; TTV2-A03 creates them, and `packages/domain/catalog` is not yet available as the reference module.

The numbered v2 documents now live in `docs/` with their numbered file names; `AGENTS.md`, `CLAUDE.md`, `SPECS.md` and `progress.md` remain at the repository root. TTV2-001 resolved the documentation path mismatch.

## Ownership and conflict boundaries

### Kartik - Developer A

Kartik owns the platform, backend, finance, delivery engine and migration infrastructure.

```text
apps/api
apps/worker
packages/db
packages/adapters
packages/domain/iam
packages/domain/config
packages/domain/catalog
packages/domain/notifications
packages/domain/commerce
packages/domain/billing
packages/domain/tutors
packages/domain/scheduling
packages/domain/classroom
packages/domain/attendance
packages/domain/media
packages/domain/payouts
infra
```

### Bhavesh - Developer B

Bhavesh owns the public website, CRM, AI, portals, admin workflows, learning experience and user-facing verification.

```text
apps/web
apps/app
apps/admin
packages/ui
packages/seo
packages/domain/crm
packages/domain/ai
packages/domain/lms
packages/domain/support
packages/domain/analytics
```

### Shared rules

- Each developer works only inside their owned modules except for reviewed contract changes.
- Domain schemas and event contracts live in `packages/contracts/<domain>` owned by the corresponding developer.
- `packages/api-client` is generated; neither developer edits it by hand.
- Cross-module access uses `public.ts` interfaces or events only.
- No direct cross-module database writes.
- Bhavesh can use mock API responses while Kartik implements backend services.
- Integration happens at planned gates, not through continuous edits to each other's files.
- Auth, permissions, payments, ledgers, migrations, recordings, child data and AI prompts require review by both developers.
- Full map, including the shared folders and generated files: docs/13-OWNERSHIP-AND-CONTRACTS.md.

## Dependency order

```text
A0/B0 decisions and boundaries
  -> A1/B1 legacy stabilisation and v2 workspace setup
  -> A2/B2 platform foundation and UI shell
  -> A3/B3 IAM, contracts, catalogue, CMS and CRM foundations
  -> A4/B4 commerce, billing, AI assistant and sales conversion
  -> A5/B5 tutors, scheduling, portals and operations console
  -> A6/B6 classroom, attendance, media, LMS and support
  -> A7/B7 payouts, analytics, migration, UAT and cutover
```

Kartik's backend dependencies and Bhavesh's frontend dependencies are intentionally separated with mocks and generated contracts. A task may start when its own listed dependency is complete; it does not need to wait for the entire other developer track.

## Stage 0 - Decisions and project boundaries

### TTV2-000 - Confirm implementation decisions

- Owner: Shared
- Status: IN_PROGRESS
- Dependencies: None
- Requirements: SRS assumptions and sign-off requirements
- Decision log: docs/12-DECISION-LOG.md, drafted 2026-11-17 and updated 2026-11-18. D-001, D-002 and D-003 are recorded as approved by Bhavesh Kanoje; the remaining decisions stay Proposed until their owners decide them.
- Stage 1 needs only D-001, D-002 and D-003 (Tech Lead).
- Recorded 2026-11-18: D-001 Approved, D-002 Approved with changes, D-003 Approved, decided by Bhavesh Kanoje. D-004 to D-025 remain Proposed.
- Tasks:
  - Approve PostgreSQL as the system of record.
  - Choose the primary domestic and international payment gateways.
  - Choose the WhatsApp BSP.
  - Choose Anthropic API or Bedrock for LLM hosting.
  - Approve refund, late-cancel, no-show, attendance and tutor penalty policies.
  - Approve payout cycle, rate override and TDS treatment.
  - Approve recording retention and transcript visibility.
  - Record each decision owner, effective date and system impact.
- Exit criteria: Decision log approved by the responsible business owners.

### TTV2-001 - Normalize v2 documentation paths

- Owner: Kartik
- Status: DONE
- Dependencies: TTV2-000
- Requirements: AGENTS.md section 1; architecture monorepo layout
- Tasks:
  - Decide whether the v2 documents remain at the root or move under `docs/`.
  - Update references consistently after approval.
  - Do not edit generated or external documentation without approval.
- Decision: the numbered v2 documents live in docs/ with their numbered file names; AGENTS.md, CLAUDE.md, SPECS.md and progress.md stay at the repository root. Approved 2026-11-14.
- Note: started ahead of TTV2-000 as approved parallel work (SPECS.md §0.2). TTV2-001 needs none of the TTV2-000 business decisions.
- Exit criteria: All referenced requirement and architecture paths resolve from the active repository.

### TTV2-002 - Define ownership and contract boundaries

- Owner: Shared
- Status: DONE
- Dependencies: TTV2-000
- Requirements: NFR-MNT-03; architecture sections 5-6
- Note: started ahead of TTV2-000 as approved parallel work (SPECS.md §0.2); the ownership map and contracts need none of the business decisions. D-003 now locates v2 in the new private `eQOURSE/tutrain` repository; the outputs live under docs/ until that repository is scaffolded.
- Drafted: docs/13-OWNERSHIP-AND-CONTRACTS.md and docs/contracts/ (ownership, events, fixtures). DONE when Bhavesh agrees to every proposal.
- Agreed: Bhavesh Kanoje agreed to every proposal after tutrain-backend #25 merged.
- Tasks:
  - Create the v2 module ownership map.
  - Create `packages/contracts/<domain>` boundaries.
  - Define event naming and versioning rules.
  - Define mock response fixtures for Bhavesh's independent UI work.
- Exit criteria: Both developers can work without editing the same domain files.

## Stage 1 - Legacy stabilisation and v2 workspace

### Kartik tasks

#### TTV2-A01 - Legacy payment and authentication stabilisation

- Owner: Kartik
- Status: IN_PROGRESS
- Tracking: kept current in tutrain-backend's progress.md until this task's PRs finish; this copy is not updated.
- Dependencies: TTV2-000
- Requirements: NFR-SEC-01, NFR-SEC-02, NFR-SEC-05; Phase 0 security actions
- Note: started ahead of TTV2-000 as approved parallel work (SPECS.md §0.2); the Phase 0 fixes need none of the TTV2-000 decisions. Split into three PRs: (1) remove the unused Razorpay integration and lock down the transaction router, audit S3; (2) protect admin and logged-in routes, S2, S5, S6, S9 and S12; (3) tutor password hashing, S4.
- Part 1 (S3): Razorpay removed rather than hardened, because nothing used it. Done on branch fix/payments-remove-razorpay.
- Part 2 (S2, S5, S6, S9, S12): done on branch fix/auth-protect-routes.
- Production check 2026-11-16: one role (Super Admin) and three admins, two of them not linked to it; no tutor password in the old reversible format.
- Release dependency: the frontend fix that logs out tokens without a role claim (owner Bhavesh) must be live on the frontend's main before Part 2 reaches the backend's main.
- Part 3 (S4): tutor login already used bcrypt; the production check found no reversible passwords or leftover IVs; removed the unused reversible helpers. Done on branch fix/auth-remove-reversible-passwords.
- Part 4a (audit 0.3): CCAvenue responses are matched to the stored order and checked for amount, currency, replays and downgrades before fulfilment. Done on branch fix/payments-ccavenue-verification. Part 4b adds the server-side status check.
- Part 4b (audit 0.3): server-side order status check through CCAvenue's API, off by default. Waiting for CCAvenue's API document and for CCAvenue to whitelist the server IP.
- Part 4c: automatic refunds report success without reading CCAvenue's answer and encrypt with the wrong IV. Fix in a separate PR after 4b; until then Finance checks every refund in the CCAvenue dashboard.
- Tasks:
  - Bind payment verification to the server-stored gateway order ID.
  - Verify payment amount and currency.
  - Reject mismatched order and transaction identifiers.
  - Replace reversible tutor password storage with one-way hashing or controlled migration.
  - Protect or remove destructive admin endpoints.
  - Remove production payment test routes.
  - Add regression tests for payment replay and mismatched payment scenarios.
- Acceptance: P0 payment and authentication findings have test evidence and reviewer sign-off.

#### TTV2-A02 - Legacy backend secrets and operational safety

- Owner: Kartik
- Status: IN_PROGRESS
- Tracking: kept current in tutrain-backend's progress.md until this task's PRs finish; this copy is not updated.
- Dependencies: TTV2-000
- Requirements: NFR-SEC-02, NFR-OBS-01, NFR-AV-03
- Tasks:
  - Inventory exposed keys and credentials without printing their values.
  - Coordinate revocation and rotation with the technology lead.
  - Remove sensitive request/body logging.
  - Restrict CORS and enable security headers.
  - Prevent duplicate cron execution where possible.
  - Add health and failure visibility to legacy background jobs.
- Acceptance: No secrets are committed; sensitive values are redacted; production safety checks are documented.
- Note: started ahead of TTV2-000 as approved parallel work (SPECS.md §0.2); the Phase 0 security fixes need none of the TTV2-000 decisions.
- Part 1, split into three PRs: secret inventory (chore/security-secret-inventory), main's admin password fix (fix/auth-admin-password-from-main), and sensitive data in logs and responses (fix/security-sensitive-data). Next: CORS and headers, cron safety and job visibility, each in its own PR.

#### TTV2-A03 - v2 monorepo and platform scaffold

- Owner: Kartik
- Status: IN_PROGRESS
- Dependencies: TTV2-000 (D-001–D-003 recorded), TTV2-002 (done)
- Requirements: SPECS group 1; NFR-MNT-01, NFR-MNT-03, NFR-OBS-01
- Tasks:
  - Create the private repo `eQOURSE/tutrain` (D-003).
  - Set up pnpm workspaces, without Turborepo (D-002).
  - Configure strict TypeScript and boundary linting.
  - Add an Express 5 API entry point with health endpoints, request IDs, RFC9457 errors and a redacting logger.
  - Add environment schemas and fail-fast startup.
  - Add Docker Compose local PostgreSQL 16; add Valkey and a worker with the first durable job (D-002).
  - Add CI for lint, typecheck, test and build.
- Reading of D-002 used for this plan: the v2 API is a new Express 5 TypeScript app in `eQOURSE/tutrain`; tutrain-backend keeps serving each area until that area is migrated.
- Acceptance: `pnpm dev` starts the API against local PostgreSQL, and CI rejects invalid boundaries.
- Progress: repository created; documents imported from tutrain-backend 851227b.
- Progress: workspace, strict TypeScript base, boundary linting and CI are in the `chore/a03-workspace` PR.
- Progress: packages/contracts holds the iam, catalog and shared schemas and the B02 fixtures in the `chore/a03-contracts` PR.
- CODEOWNERS (task 7): uses the two developers' GitHub accounts, mapped from ownership.json's kartik and bhavesh, as Bhavesh Kanoje decided.
- Repository protection: eQOURSE is on GitHub Free, so the main/develop ruleset is saved but not enforced on this private repository, and Secret Protection isn't available. Until a plan decision, the controls are review by the other developer and the CI checks docs-check and secret-scan. CODEOWNERS will list owners but won't request reviews.

### Bhavesh tasks

#### TTV2-B01 - Legacy frontend and deployment safety support

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-000
- Requirements: NFR-SEC-01, NFR-SEC-04, NFR-AV-03
- Tasks:
  - Remove unsafe production frontend configuration.
  - Prepare frontend smoke-test routes.
  - Document the current frontend deployment and rollback path.
  - Confirm public, app and admin surface boundaries.
- Acceptance: Frontend deployment smoke checks and security configuration are documented.

#### TTV2-B02 - v2 UI shell and mock API layer

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-002, TTV2-A03
- Requirements: NFR-UX-01, NFR-UX-02, NFR-MNT-03
- Tasks:
  - Create `apps/web`, `apps/app` and `apps/admin` shells.
  - Create `packages/ui` tokens and shared components.
  - Add route guards and role-aware navigation placeholders.
  - Add loading, empty, error and forbidden states.
  - Add mock API responses for Kartik-owned contracts.
  - Keep public-site dependencies separate from portal/admin dependencies.
- Note: D-002 keeps the existing frontend running and splits public, portal and admin apps as those surfaces migrate; these tasks need re-planning by Bhavesh.
- Acceptance: Bhavesh can build screens against mocks without waiting for backend endpoints.

## Stage 2 - Foundation domains

### Kartik tasks

#### TTV2-A04 - Database, outbox, audit and idempotency foundation

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A03
- Requirements: SPECS group 2; NFR-SEC-05, NFR-OBS-01
- Tasks:
  - Add Drizzle schema and migration runner.
  - Add transaction helper.
  - Add outbox and relay worker.
  - Add append-only audit log.
  - Add idempotency records and processed-event tracking.
  - Add request ID and structured PII-redacted logging.
- Acceptance: Commit and rollback outbox tests pass; privileged writes are audit-logged; duplicate jobs are safe.

#### TTV2-A05 - IAM, sessions, RBAC and consent

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A04
- Requirements: FR-IAM-01..10
- Tasks:
  - Implement OTP send and verify.
  - Implement customer Google login and staff Workspace SSO.
  - Implement access/refresh cookies and refresh-token rotation.
  - Implement logout and session management.
  - Implement guardian/learner relationships.
  - Implement roles, permissions, scopes and `can(actor, permission, resource)`.
  - Implement consent ledger and withdrawal events.
- Acceptance: IAM ACs in `SPECS.md` pass, including OTP lockout, guardian scope, finance field filtering and refresh-token reuse detection.

#### TTV2-A06 - Config and catalogue reference module

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A05
- Requirements: FR-COM-01..04, FR-WEB-04
- Tasks:
  - Build the reference module structure.
  - Implement taxonomy, markets, products and price books.
  - Implement promotion eligibility and limits.
  - Implement pure quote calculation.
  - Implement custom plans, batch slabs and market tax profiles.
  - Emit product publication and configuration events.
- Acceptance: Catalogue and quote ACs pass with integer money and market-specific pricing.

#### TTV2-A07 - Notifications and vendor adapter interfaces

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A05, TTV2-A04
- Requirements: FR-SUP-05, FR-SCH-07
- Tasks:
  - Define notification channel interfaces.
  - Implement templates, preferences, quiet hours and suppression.
  - Implement dedupe keys and retry behavior.
  - Implement SES, WhatsApp and SMS adapters behind interfaces.
  - Add provider webhook handling for bounces and delivery state.
- Acceptance: Notification dedupe, marketing suppression and SES bounce ACs pass.

### Bhavesh tasks

#### TTV2-B03 - Public website and CMS

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-B02, TTV2-A06 contract
- Requirements: FR-WEB-01..10, NFR-PERF-01, NFR-PERF-02, NFR-UX-01
- Tasks:
  - Add Payload CMS collections and publishing workflow.
  - Add reusable landing-page templates.
  - Add redirects registry and legacy URL coverage.
  - Add SEO metadata, JSON-LD, sitemap and raster OG images.
  - Add consent-gated analytics.
  - Add public forms using mock contracts first.
- Acceptance: Website and SEO ACs pass, including redirects, publishing, metadata and Lighthouse budgets.

#### TTV2-B04 - CRM and demo workflow

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-B02, TTV2-A05 contract, TTV2-A06 contract
- Requirements: FR-CRM-01..09
- Tasks:
  - Implement CRM domain contracts and UI.
  - Implement lead deduplication and timeline.
  - Implement owner assignment and SLA timers.
  - Implement demo slots using a temporary mock availability provider.
  - Implement tutor feedback and proposal workflow.
  - Implement lost/nurture and follow-up tasks.
- Acceptance: CRM ACs pass, including phone dedupe, assignment, concurrent demo booking and discount approval.

## Stage 3 - Conversion and AI

### Kartik tasks

#### TTV2-A08 - Commerce and billing

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A06, TTV2-A07, TTV2-A04
- Requirements: FR-COM-05..10, FR-FIN-01, FR-FIN-02, FR-FIN-08
- Tasks:
  - Implement orders, order lines and instalments.
  - Implement payment records and payment attempts.
  - Implement signed gateway webhooks and server-side status checks.
  - Implement payment idempotency and mismatch detection.
  - Implement GST invoices and credit notes.
  - Implement refunds and append-only financial ledger entries.
  - Emit `payment.succeeded`, `order.paid` and refund events.
- Acceptance: Payment replay, order binding, invoice sequencing, refund and credit allocation ACs pass.

#### TTV2-A09 - Demo-slot contract and scheduling precursor

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A06, TTV2-A07
- Requirements: FR-CRM-05, FR-TUT-03, FR-TUT-04
- Tasks:
  - Define the stable demo-slot contract for Bhavesh.
  - Provide availability lookup interfaces.
  - Provide atomic slot-hold behavior.
  - Keep the implementation replaceable by the full scheduling module.
- Acceptance: Bhavesh can integrate demo booking without waiting for the full scheduling implementation.

### Bhavesh tasks

#### TTV2-B05 - AI gateway and public assistant

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-B03, TTV2-B04, TTV2-A06 contract, TTV2-A09 contract
- Requirements: FR-BOT-01..10, NFR-AV-04, NFR-COST-01
- Tasks:
  - Implement AI gateway integration through the approved adapter.
  - Add versioned prompts and eval fixtures.
  - Add knowledge-base sync from CMS and catalogue events.
  - Add grounded catalogue and policy tools.
  - Add OTP, guardian consent and confirmation-card flows.
  - Add human handoff to CRM.
  - Add fallback form when the provider is unavailable.
- Acceptance: AI ACs pass for grounding, live prices, consent, minor protection, prompt injection and graceful degradation.

#### TTV2-B06 - Acquisition and conversion integration

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-B04, TTV2-B05, TTV2-A08 contract
- Requirements: FR-WEB-03, FR-CRM-05, FR-BOT-04, FR-BOT-06
- Tasks:
  - Connect website forms to CRM.
  - Connect chatbot lead capture to CRM.
  - Connect proposal and payment-link UI.
  - Add consent and attribution display.
  - Add counsellor handoff context and transcript display.
- Acceptance: Visitor-to-lead-to-demo-to-payment-link journey works end to end.

## Stage 4 - Fulfilment and operational delivery

### Kartik tasks

#### TTV2-A10 - Tutor lifecycle and matching

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A05, TTV2-A06
- Requirements: FR-TUT-01..07
- Tasks:
  - Implement tutor applications and status lifecycle.
  - Implement approvals by subject, board, grade and level.
  - Implement weekly availability and exceptions.
  - Implement matching filters and scoring.
  - Implement leave impact calculation and substitute interfaces.
- Acceptance: DST availability, approval filtering and leave/substitution ACs pass.

#### TTV2-A11 - Scheduling and credit ledger

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A08, TTV2-A10, TTV2-A07
- Requirements: FR-SCH-01..10
- Tasks:
  - Implement enrolments, batches and session series.
  - Implement RRULE generation in IANA time zones.
  - Implement session state machine.
  - Implement credit purchase, consume, transfer, expiry and adjustment entries.
  - Implement reschedule and cancellation policy evaluation.
  - Implement reminders and low-credit events.
- Acceptance: Scheduling ACs pass for holidays, reschedules, reminders, live-board signals and credit safety.

#### TTV2-A12 - Classroom and Google Meet

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A11
- Requirements: FR-SCH-02, FR-SCH-03, FR-ATT-01..03, FR-ATT-09
- Tasks:
  - Complete the Meet API and Workspace Events spike first.
  - Implement managed Meet spaces.
  - Implement calendar event synchronization.
  - Implement join tokens and join-window checks.
  - Implement webhook verification and queue ingestion.
  - Implement reconciliation polling fallback.
- Acceptance: Managed spaces, secure joins, event verification and reconciliation tests pass.

#### TTV2-A13 - Attendance and media pipeline

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A12, TTV2-A11
- Requirements: FR-ATT-01..12, NFR-PERF-05, NFR-PRV-04
- Tasks:
  - Implement conference-to-session matching.
  - Implement participant resolution without first-name guessing.
  - Implement interval union and attendance thresholds.
  - Implement tutor attendance and session outcomes.
  - Implement review and unmapped queues.
  - Implement Drive artifact copy to S3.
  - Implement MediaConvert/HLS workflow.
  - Implement transcript storage, chunks and retention.
  - Update credits and earnings atomically with outcomes.
- Acceptance: Attendance fixtures, idempotency, override preservation, playback authorization and reconciliation ACs pass.

### Bhavesh tasks

#### TTV2-B07 - Guardian, learner and tutor portals

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-B02, TTV2-A05 contracts, TTV2-A11 contracts
- Requirements: FR-IAM-04, FR-SCH-06, FR-ATT-07, FR-ATT-11, NFR-UX-02
- Tasks:
  - Implement guardian home and child switching.
  - Implement schedule and reschedule flows.
  - Implement join-class flow.
  - Implement credits, invoices and support entry points.
  - Implement learner learning views without billing data.
  - Implement tutor schedule, session log and earnings views.
  - Implement signed recording player integration.
- Acceptance: Role visibility, two-tap join, schedule and playback flows pass Playwright and axe checks.

#### TTV2-B08 - Operations and staff consoles

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-B04, TTV2-A10 contracts, TTV2-A11 contracts, TTV2-A13 contracts
- Requirements: FR-ADM-01..04, FR-ATT-08, FR-ATT-09, FR-SCH-08
- Tasks:
  - Implement onboarding queue.
  - Implement live board.
  - Implement reschedule and cancellation queue.
  - Implement attendance review and unmapped conference screens.
  - Implement tutor approval and substitution screens.
  - Implement permission-scoped tables and global search.
  - Implement audit-log viewer.
- Acceptance: Operations can process the payment-to-class and attendance-review journeys without external spreadsheets.

## Stage 5 - Finance, learning and support

### Kartik tasks

#### TTV2-A14 - Tutor payouts

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A13
- Requirements: FR-FIN-05, FR-FIN-06, FR-FIN-08
- Tasks:
  - Implement rate cards and override precedence.
  - Implement earning snapshots.
  - Implement payout cycles and dispute windows.
  - Implement TDS and payout statements.
  - Implement approval and idempotent payout execution.
  - Implement adjustment entries after payout lock.
- Acceptance: Rate precedence, rate snapshot and duplicate-payout ACs pass.

#### TTV2-A15 - Migration engine and shadow ETL

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A06; continue alongside A08-A14
- Requirements: FR-MIG-01..04
- Tasks:
  - Add read-only MongoDB and Firestore connectors.
  - Add deterministic source-to-target ID mapping.
  - Add domain dry-run and apply commands.
  - Add counts, money totals and credit reconciliation.
  - Add conflict reports with ownership.
  - Import legacy recordings through the access-controlled media path.
- Acceptance: Running `apply` twice creates no duplicates; mismatches are individually reported.

#### TTV2-A16 - Cutover and reliability runbooks

- Owner: Kartik
- Status: TODO
- Dependencies: TTV2-A15 and all cutover-domain acceptance gates
- Requirements: NFR-AV-01..03, NFR-OBS-01..03, FR-MIG-04
- Tasks:
  - Add freeze and final-delta scripts.
  - Add routing flags and smoke checks.
  - Add rollback procedures.
  - Add queue, payment and attendance alerts.
  - Add backup restore verification.
  - Move legacy domains to read-only after sign-off.
- Acceptance: Each domain has a rehearsed cutover and rollback runbook signed by its business owner.

### Bhavesh tasks

#### TTV2-B09 - LMS and academic workflows

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-B07, TTV2-A13 contracts
- Requirements: FR-LMS-01..09
- Tasks:
  - Implement curriculum tree and versioning.
  - Implement learning plans.
  - Implement tutor session logs.
  - Implement approved recaps.
  - Implement homework and submissions.
  - Implement tests and grading workflows.
  - Implement progress reports and PTMs.
  - Add AI drafts only through the AI gateway.
- Acceptance: Tutor and academic users can complete the session-to-recap-to-progress workflow with human approval.

#### TTV2-B10 - Support and safeguarding

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-B07, TTV2-A05 contracts, TTV2-A07 contracts
- Requirements: FR-SUP-01..05, NFR-PRV-02, NFR-PRV-05
- Tasks:
  - Implement ticket inbox and linked records.
  - Implement SLA timers, assignment and internal notes.
  - Implement notification preferences.
  - Implement safeguarding report workflow.
  - Restrict safeguarding visibility by role.
  - Add CSAT and escalation states.
- Acceptance: Billing, academic, session and safeguarding cases reach the correct team with restricted access.

#### TTV2-B11 - Analytics, marketing and AI copilots

- Owner: Bhavesh
- Status: TODO
- Dependencies: TTV2-B03, TTV2-B05, TTV2-B09, TTV2-A13 contracts
- Requirements: FR-ANL-01..04, FR-LMS-03, FR-LMS-07..08, NFR-COST-01
- Tasks:
  - Implement typed analytics events.
  - Implement department dashboards and Command Center views.
  - Implement SEO and attribution reporting.
  - Implement tutor recap and session-log assistance.
  - Implement support triage and lead-scoring views.
  - Add prompt versions and eval suites for every AI capability.
- Acceptance: KPI definitions are traceable to source records; AI outputs remain drafts until human approval.

#### TTV2-B12 - End-to-end UAT, accessibility and performance

- Owner: Bhavesh
- Status: TODO
- Dependencies: All user-facing modules
- Requirements: NFR-PERF-01..02, NFR-UX-01..03, SRS release acceptance criteria
- Tasks:
  - Build Playwright journeys for demo booking, payment-to-class, attendance, reschedule, refund and payout.
  - Add axe checks to new pages.
  - Verify responsive behavior from 320px to 1920px.
  - Verify role-based field visibility.
  - Verify Lighthouse budgets for top public templates.
  - Capture UAT evidence, defects and retest results.
- Acceptance: All mandatory UAT scenarios pass or have approved defect disposition before cutover.

## Integration gates

### Gate 1 - Foundation

- IAM contract available.
- Generated API client available.
- UI shells run against mocks.
- Database migrations and outbox tests pass.
- CI is green.

### Gate 2 - Acquisition

```text
public website -> lead -> deduplication -> owner assignment -> demo -> counsellor handoff
```

Required evidence:

- CRM lead exists once for duplicate contact submissions.
- Demo slot cannot be double-booked.
- Consent and attribution are visible.
- AI handoff contains the conversation context.

### Gate 3 - Commercial conversion

```text
proposal -> payment -> verified webhook -> invoice -> order.paid -> credits
```

Required evidence:

- Return URLs cannot mark payments paid.
- Webhook replay is idempotent.
- Payment is bound to the original provider order.
- Invoice and ledger entries are balanced.

### Gate 4 - Class delivery

```text
enrolment -> tutor -> schedule -> Meet space -> class -> attendance -> recording
```

Required evidence:

- Tutor and learner cannot be double-booked.
- Attendance uses evidence, not name guessing.
- Overrides survive re-ingestion.
- Credit and earning updates are atomic.

### Gate 5 - Operational readiness

```text
earning -> payout -> learning recap -> support -> KPI -> migration reconciliation
```

Required evidence:

- Payouts are idempotent.
- Restricted data is hidden from unauthorised roles.
- Department owners sign off their workflows.
- Reconciliation reports contain no unresolved unowned conflict.

## Required verification commands

Before a story is marked `DONE`, run the applicable commands and record the actual output in the pull request:

```text
pnpm lint
pnpm typecheck
pnpm test --filter=<affected>
pnpm test:e2e
pnpm api:spec
pnpm api:client
pnpm ai:eval --key=<key>
pnpm migrate:legacy --domain=<domain> --mode=dry-run
```

Only run commands supported by the current story and repository state. Do not claim a command passed if it was not run.

## Open blockers

- The database decision is approved (D-001). This was recorded on 2026-11-18. Leadership approval remains open for payment, WhatsApp, LLM, refund, attendance, payout and recording decisions.
- Google Meet REST API and Workspace Events availability must be confirmed before classroom implementation.
- The v2 monorepo and `packages/domain/catalog` reference module are not yet present in this legacy checkout.
- Migration source conflicts require business owners for commerce, attendance, tutors and payouts.
- Production secret rotation requires coordination with the technology lead and should not be performed from this progress file.

## Current status summary

| Area | Owner | Status |
|---|---|---|
| Planning baseline | Shared | DONE |
| Legacy Phase 0 security | Kartik | TODO |
| v2 monorepo scaffold | Kartik | TODO |
| UI shells and mocks | Bhavesh | TODO |
| IAM | Kartik | TODO |
| Catalogue and pricing | Kartik | TODO |
| Website and CMS | Bhavesh | TODO |
| CRM | Bhavesh | TODO |
| AI assistant | Bhavesh | TODO |
| Commerce and billing | Kartik | TODO |
| Tutors and scheduling | Kartik | TODO |
| Portals and admin | Bhavesh | TODO |
| Attendance and media | Kartik | TODO |
| LMS and support | Bhavesh | TODO |
| Payouts | Kartik | TODO |
| Migration and cutover | Kartik | TODO |
| UAT and performance | Bhavesh | TODO |
