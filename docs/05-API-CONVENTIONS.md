# 05 — API Conventions

Every HTTP endpoint in `apps/api` MUST follow these rules. AI coding agents: treat this file as binding.

## 1. Basics
- Base URL: `https://api.tutrain.com/v1`. The version is in the path. Breaking changes need `/v2` or a new resource.
- JSON only, `application/json; charset=utf-8`. Field names are **snake_case** in JSON. Generated TS clients map them to camelCase types.
- Resources are plural nouns: `/v1/learners/{id}/enrollments`. Actions that are not CRUD use a sub-resource verb: `POST /v1/sessions/{id}:reschedule` (Google AIP style, with a colon).
- IDs are UUIDv7 strings. Human-readable numbers (order no., ticket no.) are separate fields.
- Timestamps are RFC 3339 in UTC (`2026-10-23T09:30:00Z`). Dates are `YYYY-MM-DD`. Time zones are IANA names.
- Money: `{ "amount_minor": 249900, "currency": "INR" }`. Never floats, never formatted strings.

## 2. Auth
- Browser apps send the access token cookie (`__Host-tt_at`, HttpOnly, Secure, SameSite=Lax, 15 min) and refresh through `POST /v1/auth/refresh` (refresh cookie scoped to `/v1/auth`).
- CSRF: double-submit token header `X-CSRF-Token` on state-changing requests from browsers. Origin check against an allowlist.
- Server-to-server: `Authorization: Bearer <api_key>` (scoped, hashed at rest) or OAuth client credentials.
- Webhooks from vendors: verified by provider signature (Razorpay HMAC, Stripe signature) or OIDC JWT (Google Pub/Sub push), with ±5 min replay protection.

## 3. Requests
- Validation with Zod at the edge. Unknown fields are rejected (`strict()`).
- `Idempotency-Key` (UUID) is **required** on: `POST /orders`, `/payments*`, `/refunds`, `/demos`, `/sessions/*:reschedule`, `/payouts*`. The server stores (key, user, route, request hash) → response for 24 h. The same key with a different body returns `409`.
- Pagination: cursor-based. `?limit=50&cursor=<opaque>`. Response: `{ "data": [...], "next_cursor": "..." | null }`. `limit` max 200.
- Filtering: `?filter[status]=active&filter[tutor_id]=...`. Sorting: `?sort=-scheduled_start`. Field selection: `?fields=id,status` (optional).
- Search: `GET /v1/search?q=...&types=learner,lead` (permission-scoped).

## 4. Responses and errors
- Success: `200` (read/update), `201` (create, with `Location`), `202` (accepted async, with a job/resource link), `204` (no body).
- Errors use RFC 9457 Problem Details:

```json
{
  "type": "https://docs.tutrain.com/errors/slot-unavailable",
  "title": "Slot unavailable",
  "status": 409,
  "code": "SLOT_UNAVAILABLE",
  "detail": "Tutor already has a session in the requested time range.",
  "request_id": "01JC...",
  "errors": [{ "path": "proposed_start", "message": "Overlaps an existing session" }]
}
```

- `401` = not authenticated. `403` = authenticated but not allowed. `404` = not found **or** not visible to the caller (don't leak existence). `409` = conflict/state. `422` = validation. `429` = rate limited (with `Retry-After`).
- Never return stack traces, SQL or vendor raw errors to clients.

## 5. Authorisation in handlers
```ts
@Post(':id:reschedule')
@RequirePermission('session:reschedule')          // coarse check
async reschedule(@Param('id') id: string, @Body() body: RescheduleDto, @Actor() actor: Actor) {
  return this.scheduling.requestReschedule(actor, id, body); // service runs the policy check (ownership/scope)
}
```
- The controller is thin. All business rules and scope checks live in the domain service, so the API and workers get the same behaviour.
- Responses pass through permission-aware serializers. Finance fields are dropped without `finance:read`.

## 6. Events (outbox)
- Name: `<module>.<entity>.<past_tense_verb>` e.g. `scheduling.session.rescheduled`. Shorthand in docs: `session.rescheduled`.
- Envelope:
```json
{ "id": "uuid", "type": "scheduling.session.rescheduled", "version": 1,
  "occurred_at": "2026-10-23T09:30:00Z", "actor": {"type":"user","id":"..."},
  "subject": {"type":"session","id":"..."}, "data": { ... }, "trace_id": "..." }
```
- Event schemas live in `packages/contracts/events`. Adding fields is non-breaking. Removing or renaming a field needs `version` + 1.
- Consumers MUST be idempotent (store processed `event.id` per consumer, or rely on natural unique keys).

## 7. Webhook endpoints (inbound)

| Path | Source | Notes |
|---|---|---|
| `POST /v1/webhooks/razorpay` | Razorpay | Verify `X-Razorpay-Signature`. Store in `gateway_events`. Enqueue. Return 200 fast. |
| `POST /v1/webhooks/ccavenue` | CCAvenue | Decrypt response, then **server-to-server status API confirm** before marking paid |
| `POST /v1/webhooks/stripe` | Stripe | Verify signature |
| `POST /v1/webhooks/google/workspace-events` | Pub/Sub push | Verify OIDC token audience + service account. Ack fast. Enqueue `classroom.ingest` |
| `POST /v1/webhooks/whatsapp` | WhatsApp BSP | Inbound messages/status. Route to the chatbot or the CRM thread |
| `POST /v1/webhooks/ses` | SNS | Bounces/complaints → suppress list |

## 8. Outbound integration API (Phase 3)
- `/v1/partner/*` with API keys. OpenAPI published at `docs.tutrain.com`.
- Outbound webhooks to partners: signed with HMAC-SHA256 (`X-Tutrain-Signature: t=..., v1=...`), retried with exponential backoff for 24 h.

## 9. Rate limits (defaults, per IP + per user/phone)

| Route group | Limit |
|---|---|
| OTP send | 3 per 15 min per destination, 10 per hour per IP |
| Auth verify | 5 attempts per challenge, then lockout |
| Public forms / demo booking | 10 per hour per IP + Turnstile/reCAPTCHA token |
| Chatbot messages | 30/min per conversation, token budget per anonymous session |
| Authenticated API | 600/min per user |
| Admin exports | 10/hour per user |

## 10. OpenAPI and clients
- OpenAPI 3.1 is generated from Nest decorators + Zod. `pnpm api:spec` writes `packages/contracts/openapi.json`.
- `pnpm api:client` regenerates `packages/api-client`. CI fails if the spec or client is stale, or if `oasdiff` finds a breaking change without a version bump.
