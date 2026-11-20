# 10 — Delivery Roadmap, Team and Migration Plan

> The estimates assume the team below working with AI coding agents under `AGENTS.md`. Re-plan after the Phase 1 spikes.

## 1. Suggested team

| Role | Count | Focus |
|---|---|---|
| Tech lead / architect | 1 | Architecture, reviews, ADRs, security |
| Backend engineers (TS/NestJS/Postgres) | 2–3 | Domain modules, integrations, pipeline |
| Front-end engineers (Next.js) | 2 | www + CMS, app, admin |
| Full-stack / integrations | 1 | Payments, Google, WhatsApp, migration ETL |
| DevOps / SRE (part-time or shared) | 0.5–1 | AWS, Terraform, CI/CD, observability |
| QA / test automation | 1 | Playwright suites, test data, UAT coordination |
| Product/UX designer | 1 | Design system, flows |
| AI engineer (can be one of the backend engineers) | 0.5–1 | Gateway, chatbot, evals |
| Business owners (part-time) | Ops, Finance, Sales, Marketing leads | Requirements, UAT sign-off |

## 2. Phases

```mermaid
gantt
  title Tutrain v2 (indicative)
  dateFormat  YYYY-MM-DD
  axisFormat  %b
  section Phase 0
  Security hotfixes on legacy           :p0, 2026-11-02, 14d
  section Phase 1 Foundation
  Monorepo, infra, CI/CD, IAM, config   :p1a, 2026-11-09, 35d
  Spikes: Meet API/Events, Payload, Bedrock :p1s, 2026-11-09, 14d
  Catalog + DB + ETL shadow             :p1b, after p1s, 35d
  section Phase 1 Website + CRM
  www + CMS + SEO templates + redirects :p1c, 2026-12-07, 49d
  Chatbot + consent booking + CRM core  :p1d, 2026-12-21, 49d
  section Phase 2 Core ops
  Commerce + billing + invoices         :p2a, 2027-01-25, 42d
  Scheduling + classroom + attendance   :p2b, 2027-02-08, 56d
  Media pipeline (S3/HLS) + transcripts :p2c, 2027-03-01, 35d
  Portals app (guardian/learner/tutor)  :p2d, 2027-02-15, 63d
  Admin console (ops/finance/support)   :p2e, 2027-02-15, 63d
  Payouts                               :p2f, 2027-04-05, 28d
  section Phase 3
  LMS depth (homework, tests, reports)  :p3a, 2027-04-19, 49d
  AI copilots + logged-in assistant     :p3b, 2027-04-19, 49d
  Marketing automation + attribution    :p3c, 2027-05-10, 42d
  Decommission legacy                   :p3d, 2027-06-21, 21d
```

### Phase 0 — Stabilise legacy (2 weeks)
All items in [09](./09-SECURITY-COMPLIANCE.md) §1. Also: move crons to a single PM2 process; add uptime monitoring and Sentry to legacy.
**Exit:** P0 findings closed. Secrets rotated.

### Phase 1 — Foundation, website, CRM (≈ 12 weeks)
- Monorepo, Terraform (dev/staging/prod), CI/CD, observability, error tracking.
- IAM (OTP, Google, Workspace SSO, RBAC), config/master data, catalogue + price books.
- ETL shadow sync (nightly) Mongo + Firestore → Postgres with reconciliation reports.
- Spikes (in the first 2 weeks), each with a written result:
  1. Meet REST API + Workspace Events on the Tutrain tenant (create space, subscribe, receive events, list participants, fetch recording);
  2. Payload CMS inside Next 16 on ECS;
  3. LLM provider choice (Anthropic API vs Bedrock in-region), embeddings provider, latency from India;
  4. WhatsApp BSP capabilities (interactive messages, webhooks, OTP template).
- www launch: CMS, landing templates, SEO (metadata, JSON-LD, sitemaps, hreflang), redirects registry, consent banner, forms → CRM.
- Chatbot v1 (knowledge + catalogue + slots + consented demo booking + handoff).
- CRM core: leads, assignment, timeline, demos, proposals + payment links (using the legacy checkout until Phase 2 commerce is live).

**Exit:** www served by v2 at 100%. CWV targets met. All leads in the v2 CRM. Legacy demo/query forms switched off.

### Phase 2 — Core operations (≈ 14 weeks)
- Commerce + billing (Razorpay/CCAvenue + international gateway, webhooks, invoices/GST, refunds, instalments).
- Scheduling (enrollments, series, availability, reschedule policies, credit ledger).
- Classroom + attendance pipeline ([06](./06-ATTENDANCE-RECORDING-PIPELINE.md)), media pipeline (S3/HLS), transcripts.
- Guardian/learner/tutor portal (`app`). Admin console for Ops, Finance, Support, Super Admin.
- Payouts.
- Cutovers in order: commerce → scheduling/classroom → payouts, each with a freeze window, ETL delta and sign-off.

**Exit:** all new purchases, sessions, attendance and payouts on v2. student-management and the legacy dashboards are read-only.

### Phase 3 — Learning depth, AI, growth (≈ 10 weeks, then continuous)
- LMS: homework, question bank, tests, progress reports, PTM flows.
- AI: recaps, session-log prefill, quiz generation, QA audits, logged-in assistant, WhatsApp assistant, ticket triage, lead scoring.
- Marketing automation, attribution and offline conversions, referral programme.
- Decommission legacy after 90 days read-only.

## 3. Cutover runbook template (per domain)
1. T−7d: final dry run on staging with a production snapshot. Reconciliation report signed by the domain owner.
2. T−1d: announce the freeze window to staff (and to customers if they are affected).
3. T0: freeze legacy writes for the domain (feature flag / maintenance banner). Run the final ETL delta. Reconcile counts and money.
4. Flip the routing flag (CloudFront/path or app flag). Smoke-test the critical journeys.
5. T+1h: monitor the error budget. Rollback = flip the flag back + replay v2 writes to legacy (only for the commerce domain, via a prepared script) or accept data entry by hand for the small window.
6. T+7d: close the cutover. Legacy domain becomes read-only.

## 4. Definition of Done (every story)
- Acceptance criteria in `SPECS.md` pass. Tests are tagged with requirement IDs.
- Lint, typecheck, unit and integration tests are green. Coverage thresholds are met for domain modules.
- OpenAPI updated and the client regenerated. No unapproved breaking change.
- Audit logging for privileged writes. Permissions added to the seed and the policy tests.
- Observability: logs with request IDs, metrics/alerts for new async flows.
- Docs updated (module README, runbook if operational).
- UI: responsive (320–1920), keyboard accessible, axe clean, empty/loading/error states.
- Reviewed by a human (an AI agent cannot be the only reviewer of money, auth or data-deletion code).

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Workspace edition lacks Meet API/Events features | Medium | High | Spike in week 1. Drive-report fallback source ([06](./06-ATTENDANCE-RECORDING-PIPELINE.md) §9) |
| Data-migration conflicts between Mongo and Firestore | High | Medium | Shadow ETL from Phase 1. Conflict reports. Owners resolve before cutover |
| Scope creep in LMS/AI | High | Medium | Phase gates. P3 items stay behind flags |
| SEO traffic loss during the www switch | Medium | High | URL registry, 301 tests, pre/post crawl diff, staged rollout by path, Search Console monitoring |
| Payment edge cases (partial payments, legacy dues) | Medium | High | Import legacy balances as instalments. Finance UAT with real cases |
| AI hallucination on prices/policies | Medium | High | Tool-grounded prices, claim checker, evals, human handoff |
| Team unfamiliar with PostgreSQL and Drizzle | Medium | Medium | Starter templates, AGENTS.md, pairing, reference module implemented first (`catalog`) |
