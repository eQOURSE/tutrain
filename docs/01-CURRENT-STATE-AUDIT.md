# 01 — Current State Audit

> Scope: `eQOURSE/tutrain-backend`, `eQOURSE/tutrain-frontend`, `bhau23/student-management` as of 23 Oct 2026.
> Purpose: record what exists today, what is worth keeping, and what has to change, so the v2 design in the other documents is grounded in the real system.

---

## 1. Systems at a glance

| | tutrain-backend | tutrain-frontend | student-management |
|---|---|---|---|
| Role | Main API: students, tutors, plans, sessions, payments, CMS, salary, tickets | Public website (~100 marketing/SEO pages) + student/tutor dashboard + admin panel | Separate attendance, recordings, fees, salary and lead-CRM app |
| Stack | Node.js, Express 5, MongoDB/Mongoose 8, plain JavaScript | Next.js 16, React 19, Tailwind 4, plain JavaScript | Next.js 16 (TypeScript), Firebase Auth, Firestore, Cloud Functions |
| Size | ~29k LOC; `admincontroller.js` is 5,188 lines, `studentCotroller.js` is 2,602 | 155 `page.*` files, 121 of them server-rendered | ~11k tracked files, including committed build output (`functions/lib`) |
| Tests | None (`npm test` exits 1) | A few `node --test` files | None |
| Hosting | PM2 on a single Utho VM, deployed by SSH and `git reset --hard` | Same VM, behind Nginx | Vercel + Firebase |
| Auth | 3 user collections (student, tutor, admin) with their own JWTs; 7-day tokens | JWT stored in JS-readable cookies (`js-cookie`) | Firebase Auth with custom claims (`role`, `linkedId`) |

There are **two systems of record** for students, tutors, sessions, attendance, fees and salary: MongoDB (tutrain-backend) and Firestore (student-management). They are not synchronised. This is the biggest structural problem: numbers on different screens drift apart, and operations staff have to keep both up to date.

---

## 2. Business workflows found in code

These are the workflows v2 must preserve. They are the requirements baseline in [02-SRS.md](./02-SRS.md).

### 2.1 Acquisition and sales
- **Demo session request** (`demo_session_request`): OTP-verified form → admin assigns tutor → reschedule/cancel/complete. Classes 4–10, boards CBSE/ICSE/State/IB/IGCSE, subjects Maths/Science (enums are hard-coded and narrower than what the website sells).
- **Query/consultation** (`query`), **notify-me** (`notify`), **newsletter**, **tutor career application** (writes to a Google Sheet of candidates).
- **Public chatbot**: an external Python/FastAPI widget loaded from `tutrain.com/chatbot/static/widget.js` after 8s or first interaction. It is not connected to plans, availability or booking.
- **Lead CRM** exists only in student-management (`leads` collection, funnel to conversion).

### 2.2 Purchase and onboarding
- **Plans** (`plans`): per subject/grade/board/course, session distribution across subjects, price vs website price, per-session/per-month price, PTM count, tests, CEFR language level, hidden plans.
- **Custom plans**: custom session counts per subject, preferred days and time, promo codes (`promo_code`, `assigned_promo`), discount percentage.
- **Payment**: CCAvenue (primary) and Razorpay; manual payments by admin; partial payments (`partially_paid`, `remaining_balance`), invoice PDFs (pdfkit) with a yearly counter.
- **Plan approval**: admin approves a purchased plan → assigns tutor per subject with a Meet link → sessions are generated (`utils/sessionGenerator.js`, plus a nightly fallback cron).
- **Batch (group) registration**: primary contact submits N students → admin approves → per-student OTP → per-student payment link → `Ready` → tutor assigned → `Active`. Fee per student comes from configurable slabs (`config.batch_slabs`).
- **Additional sessions**: student requests extra sessions (multi-subject) → admin approves → pay the balance.
- **Plan cancellation/refund**: request → admin computes refund.

### 2.3 Delivery
- **Sessions** (`session`): pending/scheduled/completed/cancelled/rescheduled/reschedule_requested; reschedule and cancellation requests by student or tutor, with admin approval; chapter name; ratings both ways.
- **Tutor availability**: weekly slots plus date-specific extra availability; `booked_slots` collection.
- **Google Meet**: Meet links are pasted by admins into `assigned_tutors[].session_link`; the meeting code is parsed from the link and stored in `session.google_event_id`.
- **Attendance and recordings (backend version)**: an hourly cron reads Admin SDK Reports `call_ended` audit events plus Drive files whose name contains the meeting code.
- **Attendance and recordings (student-management version)**: a 15-minute Cloud Function reads two Drive folders, parses the attendance XLSX and recording file names, resolves the student through `meetingCodeIndex → enrollments`, and writes idempotent `class_sessions/{code}_{date}`. Unknown codes go to `unmappedQueue`. Recordings are streamed through an access-checked function.
- **PTM**, **tests** (`test_info`), **resources** (tutor uploads, admin approval), **e-books**, **videos**, **courses**.
- **Session reminders** (cron that runs every minute, currently disabled) and a daily low-balance/fee-pending reminder.

### 2.4 Back office
- **Admin RBAC**: `Role.permissions` is a `Map<module, actions[]>` with a "Super Admin" bypass (`authorizePermission`).
- **Tutor salary**: a rate table by grade × board (academic) or CEFR level (language), per-tutor overrides, per-student overrides, and a salary snapshot on each completed session.
- **Revenue dashboards**, transactions, refunds, fees management.
- **Support tickets** with category/priority/assignee.
- **CMS**: blog pages with SEO meta and approval workflow, testimonials, ratings, Google Business reviews sync (6-hourly).
- **Activity log** (`logs_activity`).

---

## 3. What to keep

| Asset | Why it is good | v2 treatment |
|---|---|---|
| student-management **enrollment ⇄ meeting-code** model | It is the only reliable way to tell whose class a Meet artefact belongs to | Becomes the core `Enrollment` + `MeetSpace` entities ([06](./06-ATTENDANCE-RECORDING-PIPELINE.md)) |
| Idempotent session key, `unmappedQueue`, admin override preserved on re-ingest | Correct handling of re-runs and late data | Kept as design rules |
| Money stored as integer paise (student-management) | Avoids float drift | Mandatory in v2 (`amount_minor` + `currency`) |
| Audit log on finance writes; finance hidden from ordinary admins | Required for finance control | Platform-wide audit log + field-level permissions |
| Salary snapshot locked at session completion | Rate changes do not rewrite history | Kept as a ledger entry at conduct time |
| Three-level salary override precedence (student-plan → tutor → global table) | Matches how ops actually pays tutors | Kept as `RateCard` resolution order |
| Batch slabs, custom session distribution, partial payments | Real commercial needs | Modelled explicitly (Order, OrderLine, Installment) |
| SEO landing-page inventory, legacy redirects, 410 handling, security headers | SEO equity already exists | Migrated 1:1 with redirects; pages become data-driven |
| `design.md` palette tokens and frontend `agents.md` rules | Consistent brand | Carried into the v2 design system |
| AWS migration plan (ap-south-1, CloudFront, WAF, ECS Fargate, Secrets Manager) | Sound baseline | Adopted and extended in [03](./03-ARCHITECTURE.md) |

---

## 4. Findings that must be fixed

Severity: **P0** = fix now, even before v2. **P1** = fix in v2 foundation. **P2** = fix as modules are rebuilt.

### 4.1 Security

| # | Sev | Finding | Where |
|---|---|---|---|
| S1 | **P0** | A Google service-account private key (JSON) is committed to the repo. Treat it as compromised: revoke the key in Google Cloud IAM, issue a new one into a secret manager, and purge it from git history. | `student-management/functions/secret.txt` |
| S2 | **P0** | Unauthenticated `DELETE /api/tutor/sheet-rows` deletes rows from the tutor-candidates Google Sheet by name. | `tutorRouter.js:53` |
| S3 | **P0** | Payment verification trusts a client-supplied `transaction_id`. The Razorpay signature is checked for `order_id|payment_id`, but the code never checks that this order belongs to the transaction it marks as paid. Someone could pay a small order and mark a larger one as paid. It also writes `status: "paid"`, which is not in the schema enum. | `studentCotroller.verifyStudentPlanPayment`, `transactionController.verifyPayment` |
| S4 | **P0** | Tutor passwords use reversible AES-256-CBC with a static IV (`password_iv`) instead of a one-way hash. | `utils/common.js encrypt/decrypt`, `tutor.password_iv` |
| S5 | **P0** | `POST /api/admin/delete-all-students` is gated only by "is any admin", with no permission check. | `adminRouter.js:174` |
| S6 | P1 | Test endpoints (`/api/test/ccavenue*`, `/api/test/payment-scenarios`) are exposed in production. CCAvenue handlers log full headers and bodies, which can include PII and payment data. | `index.js` |
| S7 | P1 | `cors()` allows every origin. `helmet` is installed but never mounted. | `index.js` |
| S8 | P1 | JWTs last 7 days, are stored in JS-readable cookies, and have no refresh-token rotation. Logout depends on a blacklist collection. | frontend `ContextWrapper`, `AdminLogInForm` |
| S9 | P1 | `checkAuth` looks a token's id up across the student, tutor and admin collections. An id collision or a token minted for one role could authenticate as another. | `middleware/auth.js` |
| S10 | P1 | The recording stream accepts the Firebase ID token in the query string, so it leaks into logs and browser history. | `streamRecording.ts` |
| S11 | P1 | Uploads and invoices are served from the local disk (`/api/upload`, `/api/invoices`) with no access control on invoices. | `index.js` |
| S12 | P2 | Missing-token responses return 404 instead of 401. `console.log` of permissions on every request. | `middleware/auth.js` |

### 4.2 Attendance and recording correctness

| # | Finding | Impact |
|---|---|---|
| A1 | Backend Meet sync loads **all** students and matches participants by email **or by name** (`s.name === firstName`) | Wrong-student attendance when two students share a first name; slow as the number of students grows |
| A2 | The 45-minute threshold is hard-coded, whatever the session length (30, 45, 60, 90 min) | 45-minute classes almost always get flagged; 90-minute classes get "present" at 50% |
| A3 | The sync runs only for sessions with `status: 'completed'` that ended in the last 24h. Nothing reliably moves sessions to `completed` | Attendance is silently never fetched for many sessions |
| A4 | Drive search is `name contains '<code>'` in the host's whole Drive; it then picks the file closest in time | Recurring codes and multiple sessions in a day get wrong recordings |
| A5 | Recording links are Drive `webViewLink` URLs | Students either cannot open them (no permission) or they are shared too widely |
| A6 | Tutor attendance (late join, no-show, early leave) is not computed | Tutor pay and quality cannot use real data |
| A7 | student-management watermark advances to the **max** `modifiedTime` of any successful group. Failed groups with an older `modifiedTime` fall behind the watermark and are never retried | Silent data loss |
| A8 | student-management `sweepMissed` marks a session `missed` if no report arrived by 23:55, even when the report is late | False "missed" sessions that must be cleaned up by hand |
| A9 | Two separate pipelines write attendance into two different databases | Contradictory numbers |

### 4.3 Data model and code health

- `student.plan[]` embeds purchases, payments, tutor assignments, approval history, salary overrides and promo data in one array on the student document, addressed by `plan_index`. This causes the index/positional bugs that the git log shows being patched (`deleteStudentPlan` "resolve plan by business plan_index with array index fallback").
- Enums are hard-coded and contradict each other (demo classes 4–10 vs pages for grades 11–12, A-level, SAT, ACT, CUET, languages, Kathak).
- No transactions around multi-document money and session updates.
- God controllers (5k lines) with no service layer, no tests and no types.
- Crons run inside the API process (`require("./cron/...")`). They duplicate when scaled to more than one instance (the AWS plan has two or more tasks), and `SendReminderforSession` runs every minute.
- `GenerateSession.js` opens its own second Mongo connection.
- Deploy runs `git reset --hard` on the production box, with no build artefact, health gate or rollback.

### 4.4 Website, performance and SEO

- About 50 near-duplicate landing-page route folders (`grade-4-online-tutoring` … `us-online-tutoring`, `spoken-*`). Each one is a hand-built screen, so adding a country, board or subject is a code change.
- The root layout loads three font families (Poppins, Open Sans, Manrope). Heavy client libraries (`three`, `react-globe.gl`, `framer-motion`, `swiper`, FullCalendar, TinyMCE) are in the same app as the public site.
- `metadata` is exported by only about 51 pages. The default OG image is an SVG logo (social networks do not render SVG OG images).
- No JSON-LD structured data was found for Course/FAQ/Organization/Breadcrumb.
- The CSP allows `'unsafe-eval'` and `https:` for scripts.
- `next.config` `remotePatterns` includes dev tunnels and LAN IPs.
- The chatbot is a separate widget with no knowledge of live plans, prices or slots.

---

## 5. Conclusion

The business logic is rich and largely correct in intent. The platform problems are **structural**:

1. two databases of record,
2. no domain boundaries or tests,
3. fragile attendance/recording ingestion,
4. P0 security gaps, and
5. a website whose SEO surface is hand-coded.

v2 keeps the workflows and the good patterns listed in §3, and rebuilds the platform as one modular, typed, event-driven system. See [03-ARCHITECTURE.md](./03-ARCHITECTURE.md).
