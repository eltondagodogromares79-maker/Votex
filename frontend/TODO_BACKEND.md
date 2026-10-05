# TODO_BACKEND.md

These are frontend features that need work which is currently missing or incomplete in the Rust backend.
The frontend has been built against real endpoints only — nothing here is "invented."

---

## 1. WebSocket auth is not wired

**File:** `crates/api/src/modules/realtime/ws.rs` — `ws_handler`

The `user_id` in the WebSocket handler is hardcoded to `Uuid::nil()` (a TODO placeholder).
This means all WebSocket connections are unauthenticated from the backend's perspective.

**Frontend impact:** The `usePageantRealtime` hook connects fine, but the backend will not
correctly attribute `user_joined` / `user_left` events to real users, and the idle-eviction
logic based on `last_seen` will not work correctly per user.

**What's needed:** Extract the Bearer token from the WS upgrade request (query param or
`Authorization` header) and validate it the same way `auth_extractor.rs` does for HTTP.

---

## 2. PayMongo webhook does not activate subscriptions

**File:** `crates/api/src/modules/billing/service.rs` — `process_webhook`

The webhook endpoint (`POST /api/v1/billing/webhook`) accepts PayMongo events and checks
idempotency via `paymongo_event_id`, but the actual subscription activation logic is marked
as TODO. Subscriptions are not activated after a successful PayMongo payment.

**Frontend impact:** The checkout flow (`/coordinator/billing`) redirects users to PayMongo,
but after payment the subscription status will not update. Users will need to use the
manual-payment flow instead until this is implemented.

**What's needed:** On a successful PayMongo `payment.paid` or `checkout_session.payment.paid`
event, find the matching `payment_requests` row by `paymongo_payment_link_id` or
`paymongo_payment_intent_id`, mark it as `paid`, and upsert a `subscriptions` row with
`status = 'active'`, `activated_at = now()`, and the correct `pageants_limit` / `expires_at`.

---

## 3. Manual payment admin review does not activate subscriptions

**File:** `crates/api/src/modules/billing/service.rs` — `review_payment_request`

When an admin approves a manual payment request, the `payment_requests.status` is updated
to `approved`, but no subscription row is created or updated.

**Frontend impact:** Approved manual payments do not give users access to create pageants.
The `/coordinator/billing` dashboard shows the correct approval status but subscription
`is_active` will remain false.

**What's needed:** On approval, upsert a `subscriptions` row with `status = 'active'`,
`plan`, `pageants_limit` (derived from plan), `amount_paid`, `activated_at`, and `expires_at`
based on the billing period.

---

## 4. No register endpoint

**Backend:** There is no `POST /api/v1/auth/register/` endpoint.

New users are created:
- Via `POST /api/v1/auth/google/` (Google OIDC — creates user if not found)
- Via `POST /api/v1/users/staff/` (coordinator creates judge/tabulator)

**Frontend impact:** The `/register` page currently uses Google OAuth only (no
email/password registration). If email-based self-registration is needed for Coordinator
and Public roles, a `POST /auth/register/` endpoint is required.

**What's needed:** `POST /api/v1/auth/register/` accepting `{ email, full_name, password, role: RegisterRole }`,
running Argon2id hash, creating the user row, and returning `TokenResponse`.

---

## 5. No image upload endpoint

The `Candidate.photo_url` and `Pageant.cover_image` fields accept URLs, but there is no
backend endpoint for uploading images. The frontend's candidate and pageant forms use
a text field for the URL as a workaround.

**What's needed:** Either an `POST /api/v1/uploads/` endpoint that stores the file in
object storage (S3/R2/MinIO) and returns a CDN URL, or direct upload to object storage
with a presigned URL returned from the backend.

---

## 6. No pagination metadata in round list

`GET /api/v1/pageants/{pageant_id}/rounds/` returns `Vec<RoundResponse>` (a plain array),
not a `PaginatedResponse`. For pageants with many rounds this may be acceptable, but
if pagination is needed in future, the endpoint signature would change.

**Frontend impact:** The round list loads all rounds at once. No frontend pagination needed
currently.

---

## 7. Tabulators: identical structure to judges, but no `PageantMember` extractor

**File:** `crates/api/src/middleware/auth_extractor.rs`

`PageantMember` is declared but not fully implemented. Both `judge_view` and `tabulator_view`
handlers use `Uuid::nil()` as placeholder user IDs (same TODO as the WebSocket handler).

**Frontend impact:** The judge and tabulator view endpoints (`/judges/rounds/{id}`,
`/tabulators/rounds/{id}`) may not correctly filter scores to the requesting user's judge/
tabulator ID until this extractor is implemented.

---

## 8. No contact form endpoint

The public `/contact` page submits to a placeholder handler. There is no
`POST /api/v1/contact/` or equivalent endpoint in the backend.

**Frontend impact:** The contact form logs submissions to the console in development.
A backend endpoint (or email service integration like Resend/SendGrid) is needed to
actually deliver contact messages.
