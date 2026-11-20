# 09 — Security, Privacy and Compliance

> This is an engineering baseline, not legal advice. Have counsel and the CA confirm the DPDP, GST, TDS and payment-regulation items before go-live.

---

## 1. Immediate actions on the current system (Phase 0, before any v2 work)

| # | Action | Owner | Done when |
|---|---|---|---|
| 0.1 | **Revoke** the Google service-account key committed at `student-management/functions/secret.txt`. Create a new key (or, better, workload identity federation) and store it in a secret manager. Remove the file. Purge it from git history (`git filter-repo`) and force-push after coordinating with the team. Review the GCP audit logs for misuse since the commit date. | Tech lead | The old key ID is disabled in GCP IAM |
| 0.2 | Add auth + permission to `DELETE /api/tutor/sheet-rows` (or remove it) | Backend | Unauthenticated call returns 401 |
| 0.3 | Payment verification: look up the transaction **by `razorpay_order_id`** (server-stored), ignore the client `transaction_id`, check the amount/currency, use status `success` (valid enum), and add the Razorpay `payment.captured` webhook as the source of truth. CCAvenue: confirm via the server-to-server status API. | Backend | Test: a mismatched order/transaction is rejected |
| 0.4 | Tutor passwords: on next login, verify with the legacy decrypt, then re-hash with bcrypt/argon2 and delete `password_iv`. Force a reset for accounts that are not migrated within 30 days. | Backend | No reversible passwords stored |
| 0.5 | `delete-all-students`: remove, or require `super_admin` + typed confirmation + audit | Backend | |
| 0.6 | Remove `/api/test/*` routes in production. Stop logging full request headers and bodies in the CCAvenue handlers. | Backend | |
| 0.7 | Restrict CORS to Tutrain origins. Mount `helmet`. | Backend | |
| 0.8 | Rotate `JWT_SECRET`, the CCAvenue working key, Razorpay secret, SMTP app password and AiSensy key if any were ever shared outside the server. Move them to a secret manager. | Tech lead | |
| 0.9 | Enable GitHub secret scanning + push protection on all three repos. Add a gitleaks pre-commit hook. | Tech lead | |

## 2. v2 security architecture

### 2.1 Identity and sessions
- Customers: OTP (WhatsApp/SMS/email), magic link, Google OIDC. Optional password (argon2id, breached-password check through k-anonymity).
- Staff and tutors: Google Workspace SSO only, with 2-step verification enforced in Workspace. Admin console sessions last 8 h with re-auth for sensitive actions (refund approval, payout approval, role changes, data export).
- Access token 15 min (JWT, `EdDSA`, `kid` rotation). Refresh token 30 days with rotation and reuse detection (revoke the whole family). `__Host-` cookies, HttpOnly, Secure, SameSite=Lax.
- Device/session management page. "Log out everywhere".

### 2.2 Authorisation
- RBAC + scopes (see [03](./03-ARCHITECTURE.md) §8.1). Deny by default. A policy test suite covers every permission × role.
- Postgres RLS on `billing.*`, `payouts.*`, `media.recordings`, `support.safeguarding_cases` as defence in depth.
- Quarterly access review report for Super Admin.

### 2.3 Data protection

| Data | Control |
|---|---|
| All databases, S3, backups | KMS encryption at rest. TLS 1.2+ in transit |
| Payout bank details, PAN, ID documents | Application-level envelope encryption (KMS data keys). Decrypted only in the payout worker. Masked in UI |
| Phone/email in analytics and logs | Hashed or redacted (pino redaction paths, OpenTelemetry attribute filters) |
| Recordings/transcripts | Private S3, signed CloudFront cookies, view logs, watermark, retention lifecycle |
| Payment card data | Never touches Tutrain servers (gateway-hosted checkout/elements), so PCI scope is SAQ-A |

### 2.4 Application security
- Input validation with Zod everywhere. Parameterised SQL only (Drizzle). No `eval`/dynamic `require`.
- File uploads: pre-signed S3 POST with content-type/size limits, malware scan, image re-encoding, served from a separate domain.
- SSRF protection for any URL fetches (allowlist).
- Rate limiting + bot protection (Cloudflare Turnstile or reCAPTCHA Enterprise) on OTP, forms, chatbot and login.
- CSP with nonces, HSTS preload, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Dependency hygiene: Renovate/Dependabot, `pnpm audit` in CI, lockfile-only installs, pinned base images, SBOM per build.
- Secrets: AWS Secrets Manager, injected into ECS tasks. No `.env` in images. Local dev uses `.env.local` (git-ignored) with non-production credentials.

### 2.5 Infrastructure
- Separate AWS accounts per environment. GitHub OIDC deploy roles. No long-lived keys.
- Private subnets for ECS, RDS and Valkey. Security groups least-privilege. VPC endpoints.
- WAF managed rules (Common, KnownBadInputs, SQLi, IP reputation) + rate rules. Shield Standard.
- CloudTrail, GuardDuty, Security Hub, AWS Config. Alerts to on-call.
- Backups: Aurora PITR (35 days) + daily snapshot copy to a second region. Restore tested quarterly.

### 2.6 Audit
- `audit.audit_log` captures every write by staff, every finance-impacting change, every permission change, data exports, impersonation and recording views (or `playback_grants`).
- Append-only at the DB-role level. Exported monthly to S3 with Object Lock (WORM).

### 2.7 Incident response
- Severity matrix, on-call rotation, runbooks (payment webhook failure, Meet pipeline down, data leak, account takeover).
- DPDP breach notification to the Data Protection Board and affected users within the timelines the Rules prescribe. Contact templates are prepared.

## 3. Privacy: DPDP Act 2023 alignment

| Requirement | Implementation |
|---|---|
| Notice | Layered privacy notice (CMS, versioned). Shown at every collection point (forms, chatbot consent card, checkout). Available in English (more languages later) |
| Consent (purpose-specific, free, informed, unambiguous) | The `consents` ledger with purpose, notice version, channel and evidence. Separate toggles for marketing. No pre-ticked boxes |
| Children (< 18) | Verifiable guardian consent: the guardian's phone/email is verified by OTP and the guardian is the account holder. No tracking-based or behavioural monitoring and no targeted ads to minors. Analytics on learner-facing portal pages limited to aggregated, non-profiling metrics. Session replay disabled for learner views |
| Withdrawal | One-click in the portal, "STOP" on WhatsApp, the unsubscribe link → suppression within 1 h. Downstream processors notified |
| Data-principal rights | Self-service export (JSON + PDFs), correction, erasure requests (with legal-hold checks for finance records), grievance officer contact, SLA tracking in Support |
| Retention | Schedule in SRS §7, enforced by scheduled purge/anonymise jobs with reports |
| Processors | Register of sub-processors (AWS, Google, payment gateways, WhatsApp BSP, SMS, email, LLM/embedding providers, analytics) with DPAs. Published on the website |
| Cross-border | Indian personal data primarily in ap-south-1. Transfers only to processors under contract, subject to Government notifications on restricted countries |
| Security safeguards | This document §2 |

International users: GDPR/UK-GDPR lawful basis mapping, cookie consent per ePrivacy, and DSAR handling through the same tooling.

## 4. Child safety and safeguarding policy (platform controls)
1. Tutor vetting: ID verification, qualification check, police/background verification where available, references, a safeguarding training module, and code-of-conduct e-sign.
2. All classes on Tutrain-owned Meet spaces, recorded by default (with consent). No private 1:1 channels outside the platform.
3. In-platform messaging is monitored for contact-detail sharing and inappropriate content (AI classifier + keyword rules). Flags go to the safeguarding officer.
4. A "Report a concern" button for learners, guardians and tutors. Safeguarding cases have restricted RLS visibility.
5. Recording retention holds for open cases.
6. Annual safeguarding audit. The policy is published (the `child-protection-and-online-safety-policy` page already exists; align it with these controls).

## 5. Payments and finance compliance
- RBI recurring-payment framework for UPI Autopay/e-mandates (pre-debit notifications, AFA where required) is handled by the gateway; the platform sends pre-debit notifications as required.
- GST: correct SAC code, place of supply, CGST/SGST vs IGST, and export of services (LUT) for international customers. E-invoicing (IRN) once the turnover threshold applies. Invoice series per FY.
- TDS on tutor payouts (e.g. Section 194J professional fees or 194C as applicable; confirm with the CA), Form 16A support, PAN validation.
- Consumer Protection (E-Commerce) Rules: display the grievance officer, refund policy and cancellation policy. Acknowledge complaints within 48 h; resolve within 1 month.
- Data retention for finance records: 8 years.

## 6. Messaging compliance
- SMS: DLT entity + header + template registration (TRAI). Templates are stored with DLT IDs.
- WhatsApp: template categories (utility/authentication/marketing) approved by Meta. Marketing only to opted-in users. Opt-out keywords honoured.
- Email: SPF, DKIM, DMARC (`p=quarantine`→`reject`), one-click unsubscribe (RFC 8058) for marketing, and bounce/complaint suppression via SES.

## 7. Security testing cadence

| Activity | Frequency |
|---|---|
| SAST/SCA/secret scan | Every PR |
| DAST baseline (ZAP) | Nightly on staging |
| Dependency updates | Weekly batch |
| Third-party pentest | Before v2 launch, then annually + after major changes |
| AI red-team suite | Weekly + on prompt/model changes |
| Restore drill | Quarterly |
| Access review | Quarterly |
