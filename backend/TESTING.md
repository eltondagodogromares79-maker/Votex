# Backend testing guide

This guide lists the backend tests currently in the workspace, what they protect, and how to run them. The Rust workspace is rooted in this directory.

## Run tests

Run all unit, integration, and database-backed tests:

```sh
cargo test --workspace
```

Run a single crate:

```sh
cargo test -p core_auth
cargo test -p core_infra
cargo test -p admin
cargo test -p org_owner
cargo test -p coordinator
cargo test -p judge
cargo test -p tabulator
cargo test -p audience
```

Run only database-backed auth authorization tests:

```sh
cargo test -p core_auth authorization_workflow_tests
```

The PostgreSQL integration tests use `#[sqlx::test]`. SQLx creates a temporary database for each case and applies the migrations, so the test connection needs a dedicated local/test migration role that can connect to its bootstrap database, create the SQLx test schema there, create/drop databases, and run migrations. Do not use the restricted `votex_runtime` role: it intentionally lacks those privileges, and granting them would weaken RLS. Do not point tests at production or a shared database.

Migration 053 also needs `votex.runtime_role` available when SQLx runs migrations. From `backend/`, load the local environment and override `DATABASE_URL` for this test command with the migration role URL plus the PostgreSQL startup option below (assuming the URL has no existing query string):

```sh
set -a
source .env
set +a
DATABASE_URL="${MIGRATOR_DATABASE_URL}?options=-c%20votex.runtime_role%3Dvotex_runtime" cargo test --workspace
```

Use a dedicated test database URL and migration role with the required local test privileges. The override applies only to this command; the app's normal `DATABASE_URL` must remain the restricted runtime role. Other unit/contract tests do not require a database, PayMongo account, SMTP server, Cloudinary, or external network access.

If SQLx compile-time query macros cannot find a database, set `DATABASE_URL` to the development schema or use the repository's SQLx offline metadata if available. Never place credentials in this document or commit them.

## Test inventory

### `core_auth`

- `src/application/tests/authorization_tests.rs`: application authorization forwards system and organization scope and permission; denied permission returns `Forbidden`; workflow errors propagate.
- `src/api/routes/tests/authorization_middleware.rs`: Actix route integration verifies valid bearer + permission succeeds, forbidden users are rejected, and missing tokens are unauthorized.
- `src/infrastructure/postgres/tests/authorization_workflow_tests.rs`: PostgreSQL integration coverage for system role grants/denials, organization membership scope and inactive membership, pageant role scope and inactive assignment.
- `src/utils/voter_identity.rs`: voter identity HMAC is stable for the same user/secret and changes when either changes.
- `src/utils/password_validation.rs`: password boundaries and uppercase/lowercase/digit/special-character requirements.
- `src/utils/password.rs`: Argon2 hashing, matching-password verification, wrong-password rejection, and malformed hash handling.
- `src/utils/refresh_token.rs`: generated refresh token shape/randomness and one-way stable hashing.
- `src/utils/verification.rs`: six-digit code format and secret-bound HMAC.
- `src/utils/temporary_password.rs`: generated temporary passwords satisfy the password policy.
- `tests/credential_utility_contract.rs`: public utility integration checks for safe credential hashing and password validation.

### `core_infra`

- `src/infrastructure/in_memory_rate_limit_store.rs`: per-key request limits, isolation, zero limit, and window reset.
- `src/infrastructure/realtime.rs`: short-lived ticket is one-time use; pageant events publish to subscribers with pageant scope.
- `src/infrastructure/payments/paymongo.rs`: signed test webhook verification binds the exact body and timestamp; wrong mode/signature/timestamp is rejected.
- `src/domain/payments.rs`: valid checkout webhook parsing and malformed/incomplete payload rejection.
- `tests/core_security_contract.rs`: public contracts for webhook payload validation, rate-limit key isolation/reset, and one-time WebSocket tickets.

### `admin`

- `src/application/subscription_plans.rs`: plan code/name/currency normalization; invalid code, negative price, and non-positive entitlements are rejected.
- `tests/subscription_plan_contract.rs`: stable plan-kind database codes.

### `org_owner`

- `src/application/vote_packages.rs`: vote package price/quantity/currency validation, including precision and zero/negative boundaries.
- `src/application/subscriptions.rs`: proof URL must use HTTPS and the Cloudinary resource host.
- `tests/payment_proof_contract.rs`: payment proof serialization retains review and revocation notes and state.
- `tests/entitlements_postgres.rs`: pageant creation is blocked at the organization plan limit; judge assignments are blocked at the pageant limit; tabulator limits are shared across an organization's pageants; rejected writes leave no extra assignments or accounts.

### `coordinator`

- `src/domain/round.rs`: round status wire/database values and allowed lifecycle transitions.
- `src/application/contestants.rs`: required gender values and compatibility for matching legacy values on update.
- `src/application/pageant_setup.rs`: category/criterion code and name normalization, eligibility scope validation, and blank note normalization.
- `src/application/pageant_setup.rs`: round setup rejects out-of-range category weights, criterion-weight totals other than 100 per category, and duplicate category selections.
- `tests/round_status_contract.rs`: round status API serialization and DB representation stay aligned.
- `tests/entitlements_postgres.rs`: coordinators cannot create rounds beyond the pageant limit; category limits apply independently within each round and do not consume another round's quota.

### `judge`

- `tests/score_request_contract.rs`: score payload accepts the frontend's camelCase field names and rejects a missing `roundCriterionId`.

### `tabulator`

- `tests/round_result_contract.rs`: unscored candidates remain representable with nullable score/category fields and camelCase output names.

### `audience`

- `src/application/voting.rs`: idempotency header is required, non-blank, and capped at 200 characters.
- `tests/vote_request_contract.rs`: vote request requires both candidate and package identifiers.

## Test organization

Integration tests that only use public crate APIs live in each crate's `tests/` directory. Tests that need private helper functions or internal module state stay next to the implementation under `src/` in `#[cfg(test)]` modules. Moving those into an external `tests/` crate would make private behavior inaccessible and either force unnecessary public APIs or weaken the tests. The existing auth tests were retained and expanded rather than duplicated or relocated.

## Current coverage boundaries

Database integration coverage now exercises core auth authorization, organization pageant/staff limits, and coordinator round/category limits. Other portal PostgreSQL workflows, full end-to-end API flows, external SMTP delivery, PayMongo checkout HTTP requests, and live WebSocket transport are not exercised against external services by these deterministic tests. The checkout webhook signature/parser and rate-limit/realtime primitives are tested without network services. Add isolated database fixtures and provider test doubles before treating those untested boundaries as covered.
