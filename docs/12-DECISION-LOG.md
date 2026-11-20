# 12 — Decision Log

Owners approve, change, defer or reject each decision; Codex records the outcome. An open decision blocks only the tasks listed in its “Needed by” field.

## Summary

| ID | Decision | Owner | Needed by | Status |
|---|---|---|---|---|
| D-001 | PostgreSQL 16 as the v2 system of record | Tech Lead; Director / Super Admin | TTV2-A03, TTV2-A04 | Approved |
| D-002 | Express 5 TypeScript modular monolith and v2 platform stack | Tech Lead | TTV2-A03, TTV2-B02 | Approved with changes |
| D-003 | v2 monorepo location | Tech Lead | TTV2-A03, TTV2-B02 | Approved |
| D-004 | Domestic payment gateway | Finance Head; Director / Super Admin | TTV2-A08 | Proposed |
| D-005 | International payment gateway | Finance Head; Director / Super Admin | TTV2-A08 | Proposed |
| D-006 | GST, invoice series and international tax | Finance Head | TTV2-A08 | Proposed |
| D-007 | WhatsApp provider | Marketing Head; Tech Lead | TTV2-A07, TTV2-B05 | Proposed |
| D-008 | LLM hosting | Tech Lead; Director / Super Admin | TTV2-B05, TTV2-A13 | Proposed |
| D-009 | Refund policy | Finance Head; Director / Super Admin | TTV2-A08 | Proposed |
| D-010 | Reschedule and late-cancellation policy | Operations Head | TTV2-A11 | Proposed |
| D-011 | No-show rules | Operations Head; Finance Head | TTV2-A11, TTV2-A13, TTV2-A14 | Proposed |
| D-012 | Attendance thresholds | Operations Head | TTV2-A13 | Proposed |
| D-013 | Tutor late-join and no-show penalties | Operations Head; Finance Head | TTV2-A13, TTV2-A14 | Proposed |
| D-014 | Payout cycle and dispute window | Finance Head | TTV2-A14 | Proposed |
| D-015 | Rate override order | Finance Head | TTV2-A14 | Proposed |
| D-016 | TDS on tutor payouts | Finance Head | TTV2-A14 | Proposed |
| D-017 | Recording retention and access | Director / Super Admin; Operations Head | TTV2-A13 | Proposed |
| D-018 | Transcript visibility and retention | Director / Super Admin; Operations Head | TTV2-A13, TTV2-B07 | Proposed |
| D-019 | Google Workspace edition and Meet artefacts check | Tech Lead | TTV2-A12 | Proposed |
| D-020 | ADR-003: Google Meet stays | Tech Lead | TTV2-A12 | Proposed |
| D-021 | ADR-004: in-house auth | Tech Lead | TTV2-A05 | Proposed |
| D-022 | ADR-005: Payload CMS | Tech Lead; Marketing Head | TTV2-B03 | Proposed |
| D-023 | ADR-006: S3 recordings and HLS | Tech Lead | TTV2-A13 | Proposed |
| D-024 | ADR-007: in-house CRM | Tech Lead; Marketing Head | TTV2-B04 | Proposed |
| D-025 | ADR-008: AI gateway, Claude and pgvector | Tech Lead | TTV2-B05 | Proposed |

### D-001 PostgreSQL system of record

- Question: Will PostgreSQL 16 be the v2 system of record?
- Options: PostgreSQL 16; MongoDB Atlas; Firestore.
- Recommended default: PostgreSQL 16, as recommended by [ADR-002](./03-ARCHITECTURE.md) and required by the SRS constraint [C1](./02-SRS.md).
- Today: MongoDB and Firestore are both systems of record for students, tutors, sessions, attendance, fees and salary, and they are not synchronised ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Tech Lead; Director / Super Admin
- Needed by: TTV2-A03, TTV2-A04.
- Status: Approved
- Decision: PostgreSQL 16 is the v2 system of record. Existing MongoDB and Firestore workflows stay live until each domain has passed migration, reconciliation and rollback checks.
- Decided by: Bhavesh Kanoje (Tech Lead; final Admin decision authority for this project, covering the Director / Super Admin sign-off, as stated in his email of 18 November 2026)
- Effective date: 2026-11-18
- System impact: Choosing a non-default database would change the persistence, ledger, scheduling-constraint and migration choices across the db, billing, scheduling and attendance modules.

### D-002 Monorepo and platform stack

- Question: Will v2 use the proposed NestJS modular monolith, workers and shared monorepo stack?
- Options: NestJS modular monolith with workers or microservices; pnpm workspaces with Turborepo; three Next.js front-end apps or one app; BullMQ on Valkey or SQS plus EventBridge Scheduler; Drizzle ORM or another ORM.
- Recommended default: NestJS modular monolith with workers; pnpm plus Turborepo; three front-end apps; BullMQ on Valkey; and Drizzle ORM, as specified in [Technology choices](./03-ARCHITECTURE.md) and [ADR-001, ADR-009 and ADR-010](./03-ARCHITECTURE.md).
- Today: The legacy backend is Node.js with Express 5, MongoDB/Mongoose and plain JavaScript, while the separate web and attendance systems use Next.js, Firebase and Firestore ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Tech Lead
- Needed by: TTV2-A03, TTV2-B02.
- Status: Approved with changes
- Decision: Keep Express 5 for the API and organise new v2 code as a TypeScript modular monolith. Use pnpm workspaces and Drizzle for new PostgreSQL modules. Add a dedicated worker and BullMQ/Valkey when the first durable job requires them. Keep the existing frontend running; split the public, portal and admin apps as those surfaces are migrated. Do not rewrite working Express routes just to change frameworks. NestJS and Turborepo are deferred unless a specific need justifies them.
- Decided by: Bhavesh Kanoje (Tech Lead)
- Effective date: 2026-11-18
- System impact: Any non-default stack would change the repository scaffold, deployment topology, queue adapters, persistence layer and boundaries for the api, worker and three front-end apps.

### D-003 v2 repository location

- Question: Will the v2 monorepo live in a new private repository or under a v2 folder in the legacy repository?
- Options: New private repository `eQOURSE/tutrain`; `v2/` folder in `tutrain-backend`.
- Recommended default: New private repository `eQOURSE/tutrain`, which the root [AGENTS.md](../AGENTS.md) assumes and the target layout in [03-ARCHITECTURE.md](./03-ARCHITECTURE.md) names as `tutrain/`.
- Today: The audit describes the legacy backend and separate frontend and attendance systems, not a v2 repository layout ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Tech Lead
- Needed by: TTV2-A03, TTV2-B02.
- Status: Approved
- Decision: v2 uses a new private repository, eQOURSE/tutrain. The current backend and frontend remain in service during migration.
- Decided by: Bhavesh Kanoje (Tech Lead)
- Effective date: 2026-11-18
- System impact: Choosing the folder option would make the legacy repository host v2 source and could change CI, ownership, deployment paths and the scope of the monorepo scaffold.

### D-004 Domestic payment gateway

- Question: Which gateway or gateways will serve domestic INR payments?
- Options: Razorpay; CCAvenue; both, selected per market or payment flow.
- Recommended default: No default in the documents; the Finance Head and Director / Super Admin must choose Razorpay, CCAvenue or both under the configurable provider abstraction in [FR-COM-06](./02-SRS.md).
- Today: CCAvenue handles every online payment; the unused Razorpay integration was removed in TTV2-A01 part 1 because no production payment used it, and manual and partial payments also exist ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Finance Head; Director / Super Admin
- Needed by: TTV2-A08.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: The selected gateway set will determine commerce configuration, payment adapters, webhook verification, reconciliation and the domestic checkout flows.

### D-005 International payment gateway

- Question: Which gateway will serve non-INR markets?
- Options: Stripe; another equivalent international gateway.
- Recommended default: No default in the documents; the Finance Head and Director / Super Admin must choose Stripe or an equivalent provider under [FR-COM-06](./02-SRS.md).
- Today: Not covered by the audit.
- Owner: Finance Head; Director / Super Admin
- Needed by: TTV2-A08.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: The selected provider will add an international billing adapter, market configuration, settlement and reconciliation rules, and non-INR checkout behavior.

### D-006 GST and international tax treatment

- Question: What GST treatment, invoice series and international tax position will v2 apply?
- Options: Finance-defined GST treatment; Finance-defined invoice series per financial year and legal entity; Finance-defined international tax position.
- Recommended default: No default in the documents; the Finance Head must choose the GST treatment, invoice series and international tax position before Phase 2 go-live, as required by [AS4 and §8](./02-SRS.md).
- Today: Legacy invoices are PDF documents with a yearly counter, but the audit does not describe the GST treatment or international tax position ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Finance Head
- Needed by: TTV2-A08.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: The decision will configure billing tax profiles, invoice numbering, credit notes, export invoices and finance reporting.

### D-007 WhatsApp provider

- Question: Which WhatsApp Business provider will v2 use?
- Options: Keep AiSensy; move to Gupshup; move to Interakt.
- Recommended default: No default in the documents; the Marketing Head and Tech Lead must choose the provider, while [AS3](./02-SRS.md) records AiSensy as the current provider and [Technology choices](./03-ARCHITECTURE.md) requires an adapter.
- Today: Not covered by the audit.
- Owner: Marketing Head; Tech Lead
- Needed by: TTV2-A07, TTV2-B05.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: A non-default provider changes the WhatsApp notification adapter, template identifiers, webhook verification and delivery-status handling.

### D-008 LLM hosting

- Question: Will the AI gateway host Claude through the Anthropic API or AWS Bedrock?
- Options: Anthropic API; AWS Bedrock.
- Recommended default: No default in the documents; the Tech Lead and Director / Super Admin must choose Anthropic API or AWS Bedrock, while retaining the Claude primary-model and AI-gateway direction in [ADR-008](./03-ARCHITECTURE.md).
- Today: Not covered by the audit.
- Owner: Tech Lead; Director / Super Admin
- Needed by: TTV2-B05, TTV2-A13.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: The hosting choice changes the LLM adapter, data-region controls, credentials, observability, cost controls and AI gateway deployment settings.

### D-009 Refund policy

- Question: How will v2 calculate refunds and decide which refunds need elevated approval?
- Options: Policy based on consumed sessions or credits, elapsed time and fees; Finance approval; Super Admin approval above a configured threshold.
- Recommended default: No default in the documents; the Finance Head and Director / Super Admin must choose the calculation and approval limits. The “unused minus 10% fee” wording in [SPECS.md §8 AC5](../SPECS.md) is a test example, not an approved policy; the SRS requires a policy-driven calculation in [FR-COM-09](./02-SRS.md).
- Today: A refund request is raised and an admin computes the refund ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Finance Head; Director / Super Admin
- Needed by: TTV2-A08.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: The selected policy will configure the commerce refund service, approval permissions, credit reversal, gateway refund amount and credit-note ledger behavior.

### D-010 Reschedule and late-cancellation policy

- Question: What notice window, limits and approval behavior will govern reschedules and late cancellations?
- Options: Configurable notice window; configurable monthly limits; configured initiators; auto-approval within policy; operations approval outside policy.
- Recommended default: No default in the documents; the Operations Head must choose the policy values and approval boundaries. [FR-SCH-05](./02-SRS.md) and [SPECS.md §10](../SPECS.md) define the configurable behavior, not final values.
- Today: Students and tutors can request reschedules or cancellations, and admins approve them; the audit does not record final policy values ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Operations Head
- Needed by: TTV2-A11.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: The policy will configure scheduling evaluation, self-service availability, credit effects, pending operations queues and notification behavior.

### D-011 No-show rules

- Question: What learner and tutor outcomes, credits and earnings apply to no-shows?
- Options: Learner no-show after the tutor waits the configured period; tutor no-show with no credit effect and a make-up request; no-data reconciliation followed by operations review; batch per-learner handling.
- Recommended default: Use the policy-configurable outcome table in [§4.5](./06-ATTENDANCE-RECORDING-PIPELINE.md): learner no-show consumes or forfeits one credit per policy with a configurable no-show rate, tutor no-show creates a make-up request with no credit effect and no earning, and no-data remains in reconciliation until review.
- Today: The audit describes session statuses and separate attendance pipelines, but does not describe a reliable learner or tutor no-show policy ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Operations Head; Finance Head
- Needed by: TTV2-A11, TTV2-A13, TTV2-A14.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: A different policy changes scheduling outcomes, credit-ledger entries, make-up creation, attendance review and payout earnings.

### D-012 Attendance thresholds

- Question: What configurable attendance thresholds determine present, partial and absent?
- Options: Present at or above 75%; partial at or above 25% and below present; absent below 25%; per-product or per-enrollment overrides.
- Recommended default: Present at 75% or more, partial at 25% to below 75% with review, and absent below 25%, using the configurable scheduled-duration percentage model in [FR-ATT-04](./02-SRS.md) and [§4.4](./06-ATTENDANCE-RECORDING-PIPELINE.md).
- Today: The backend uses a hard-coded 45-minute threshold regardless of session length ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Operations Head
- Needed by: TTV2-A13.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: A non-default threshold changes attendance policy snapshots, review-queue volume, session outcomes, credit consumption and downstream earnings.

### D-013 Tutor late-join and no-show penalties

- Question: What lateness and no-show penalties apply to tutor attendance and earnings?
- Options: Tutor present at 90% or more with lateness up to 10 minutes; tutor late above 10 minutes; configurable late penalty; configurable no-show penalty; no earning for tutor no-show.
- Recommended default: Use the tutor rules in [§4.4 and §4.5](./06-ATTENDANCE-RECORDING-PIPELINE.md): 90% attendance with at most 10 late minutes is present, later joins are late, late earnings use a configurable penalty, and tutor no-show has no earning; final penalty values remain for owner choice.
- Today: Tutor late join, no-show and early leave are not computed, so tutor pay and quality cannot use reliable attendance data ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Operations Head; Finance Head
- Needed by: TTV2-A13, TTV2-A14.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: The selected penalties change attendance outcome calculations, earning entries, payout statements and tutor quality signals.

### D-014 Payout cycle and dispute window

- Question: What payout cadence and tutor dispute window will v2 use?
- Options: Monthly payout cycle; another Finance-approved cadence; a configurable tutor review and dispute window of N days; Finance approval before payout.
- Recommended default: Monthly payout cycle with a configurable tutor review and dispute window, followed by Finance approval, as specified in [FR-FIN-06](./02-SRS.md) and [SPECS.md §12](../SPECS.md); the documents do not set N.
- Today: The audit identifies separate fees and salary systems and revenue dashboards but does not describe a payout cadence or dispute window ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Finance Head
- Needed by: TTV2-A14.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: The selected cadence changes payout-cycle scheduling, statement periods, dispute ticket timing, approval queues and payout locks.

### D-015 Rate override order

- Question: In what order will v2 resolve tutor earning rates?
- Options: Enrollment override; tutor override; rate table by grade and board or language level; product default; another Finance-approved precedence.
- Recommended default: Enrollment override, then tutor override, then rate table, then default, with the rate snapshotted on the earning entry, as required by [FR-FIN-05](./02-SRS.md) and [SPECS.md §12](../SPECS.md).
- Today: Legacy data contains plan, tutor and tutor-salary overrides, but the audit does not establish a single precedence rule ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Finance Head
- Needed by: TTV2-A14.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: A different order changes the payouts rate resolver, earning snapshots, migration mapping and finance audit explanations.

### D-016 TDS on tutor payouts

- Question: What TDS treatment will apply to tutor payouts?
- Options: Finance advice under Section 194J; Finance advice under Section 194C; another treatment advised by Finance and tax counsel.
- Recommended default: No default in the documents; the Finance Head must choose the applicable TDS treatment, as [AS4](./02-SRS.md) and [§8](./02-SRS.md) require confirmation before Phase 2 go-live.
- Today: Not covered by the audit.
- Owner: Finance Head
- Needed by: TTV2-A14.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: The selected treatment changes payout calculation, statements, ledger entries, statutory reporting and the payout file or API.

### D-017 Recording retention and access

- Question: How long will recordings be retained and who may view or download them?
- Options: Hot retention for 180 days then archive for 2 years then delete; configurable retention holds; learner, guardian, tutor and `recording:view` staff access; downloads disabled by default.
- Recommended default: Hot 180 days, archive 2 years and then delete, with configurable holds and downloads disabled by default, as required by [FR-ATT-07](./02-SRS.md) and [§5](./06-ATTENDANCE-RECORDING-PIPELINE.md).
- Today: Recordings are exposed through Drive links or an access-checked function, and the audit reports permission and sharing problems rather than a governed retention policy ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Director / Super Admin; Operations Head
- Needed by: TTV2-A13.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: A non-default choice changes media lifecycle rules, playback authorisation, signed-cookie settings, storage cost and privacy controls.

### D-018 Transcript visibility and retention

- Question: Who may view transcripts and how long will they be retained?
- Options: Tutor visibility; learner and guardian visibility configurable per session; staff with `transcript:view`; 2-year retention; a shorter or longer owner-approved retention period.
- Recommended default: Make transcripts visible to the tutor, the learner or guardian when configured, and staff with `transcript:view`, with 2-year retention, as specified in [§6](./06-ATTENDANCE-RECORDING-PIPELINE.md) and [§7](./02-SRS.md).
- Today: Not covered by the audit.
- Owner: Director / Super Admin; Operations Head
- Needed by: TTV2-A13, TTV2-B07.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: A non-default choice changes transcript access serializers, AI retrieval eligibility, retention jobs and the tutor, learner and guardian portals.

### D-019 Google Workspace edition and Meet artefacts check

- Question: Does the Tutrain Google Workspace edition include the Meet REST API, Workspace Events, recordings and transcripts needed by v2?
- Options: Confirmed; not available; partially available and requiring the fallback mode.
- Recommended default: No default in the documents; the Tech Lead must verify the tenant edition, API availability, recording and transcript access, subscription lifetimes, quotas and fallback before classroom implementation, as required by [AS1](./02-SRS.md) and [§9](./06-ATTENDANCE-RECORDING-PIPELINE.md).
- Today: The legacy systems use Meet links, Admin SDK Reports, Drive files and a Cloud Function rather than the specified Meet REST API and Workspace Events flow ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Tech Lead
- Needed by: TTV2-A12.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: A partial or negative result changes classroom integration, reconciliation scheduling, recording and transcript ingestion, and may activate the documented fallback mode.

### D-020 ADR-003 Google Meet stays

- Question: Will Google Meet remain the v2 conferencing provider?
- Options: Keep Google Meet; move to Zoom; use embedded WebRTC such as 100ms, LiveKit or Daily.
- Recommended default: Keep Google Meet behind a `ConferencingProvider` interface, as recommended by [ADR-003](./03-ARCHITECTURE.md) and the SRS constraint [C2](./02-SRS.md).
- Today: Admins paste Google Meet links into assigned tutors and the backend parses the meeting code ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Tech Lead
- Needed by: TTV2-A12.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: Choosing another provider changes classroom adapters, space creation, calendar and event ingestion, participant identity, attendance evidence and media artefacts.

### D-021 ADR-004 in-house auth

- Question: Will v2 use the proposed in-house authentication module?
- Options: In-house OTP, magic link, Google OIDC and Workspace SSO; Auth0; Clerk; Cognito; Firebase Auth.
- Recommended default: Use the in-house auth module, as recommended by [ADR-004](./03-ARCHITECTURE.md), with guardian-learner linking and DPDP consent in the domain.
- Today: The legacy backend has separate student, tutor and admin JWTs, while the separate application uses Firebase Auth ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Tech Lead
- Needed by: TTV2-A05.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: Choosing a vendor changes IAM integration, session and cookie management, guardian scope enforcement, consent handling and migration of identities.

### D-022 ADR-005 Payload CMS

- Question: Will Payload CMS 3 be the v2 marketing-content system?
- Options: Payload CMS 3; Sanity; Strapi; Contentful; keep a custom CMS controller.
- Recommended default: Use Payload CMS 3 inside the public Next.js app with the Postgres adapter, as recommended by [ADR-005](./03-ARCHITECTURE.md).
- Today: The legacy API includes CMS responsibilities and Mongo page data is mapped to the target CMS in the audit ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Tech Lead; Marketing Head
- Needed by: TTV2-B03.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: Choosing another CMS changes the public-site integration, content migration, preview and publishing workflows, localisation and SEO content ownership.

### D-023 ADR-006 S3 recordings and HLS

- Question: Will v2 copy recordings to S3 and serve HLS through CloudFront signed cookies?
- Options: S3 plus MediaConvert HLS plus CloudFront signed cookies; proxy Drive; share Drive links.
- Recommended default: Copy recordings to S3 and stream HLS through CloudFront signed cookies, as recommended by [ADR-006](./03-ARCHITECTURE.md) and detailed in [§5](./06-ATTENDANCE-RECORDING-PIPELINE.md).
- Today: The legacy systems use Drive webViewLink URLs or an access-checked Drive streaming function, which the audit says can fail permissions or be shared too widely ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Tech Lead
- Needed by: TTV2-A13.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: Choosing Drive delivery changes the media module, storage lifecycle, adaptive playback, signed access and recording privacy controls.

### D-024 ADR-007 in-house CRM

- Question: Will v2 build the CRM in-house and integrate messaging and telephony vendors through adapters?
- Options: Build in-house; LeadSquared; HubSpot; Zoho CRM.
- Recommended default: Build the CRM in-house and integrate vendors through events, as recommended by [ADR-007](./03-ARCHITECTURE.md).
- Today: The audit says the lead CRM exists only in the separate student-management system’s `leads` collection ([current-state audit](./01-CURRENT-STATE-AUDIT.md)).
- Owner: Tech Lead; Marketing Head
- Needed by: TTV2-B04.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: Choosing a CRM vendor changes ownership of lead, demo, campaign and learner-lifecycle data and adds synchronisation jobs and connector contracts.

### D-025 ADR-008 AI gateway, Claude and pgvector

- Question: Will v2 use an internal AI gateway, Claude as the main model family and pgvector for retrieval?
- Options: Internal AI gateway with Claude and pgvector; direct SDK calls per feature with a managed vector database.
- Recommended default: Use the internal AI gateway, Claude as the primary model family and pgvector for RAG, as recommended by [ADR-008](./03-ARCHITECTURE.md) and the AI platform boundary in [07-AI-PLATFORM.md](./07-AI-PLATFORM.md).
- Today: Not covered by the audit.
- Owner: Tech Lead
- Needed by: TTV2-B05.
- Status: Proposed
- Decision:
- Decided by:
- Effective date:
- System impact: Choosing the alternative changes AI call sites, guardrails, PII redaction, cost caps, provider failover, retrieval storage and evaluation ownership.
