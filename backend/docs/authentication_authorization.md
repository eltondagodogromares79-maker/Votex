# Authentication and authorization checks

Protected routes use `JwtAuthentication` to validate a bearer access token and add an `AuthenticatedUser` to request extensions. Add `AuthorizationGuard` to a route to require one permission from the RBAC migrations:

```rust
web::resource("/organizations/{organization_id}")
    .wrap(AuthorizationGuard::organization("organization.read", "organization_id"))
    .route(web::get().to(handler))
```

Use `AuthorizationGuard::system(permission)` or `AuthorizationGuard::pageant(permission, path_param)` for those scopes. Permission names come from `permissions.code`; the requested scope UUID must be a route path parameter.

## Sample endpoints

All examples are under `/api/v1/test` and require a valid access token:

- `GET /authorization/{organization_id}` requires `organization.read` for that organization.
- `GET /pageant-authorization/{pageant_id}` requires `score.submit` for that pageant.
- `GET /system-authorization` requires system permission `audit.read`.

Send `Authorization: Bearer <access-token>`. A successful check returns 200, a missing or invalid token returns 401, a denied permission returns 403, and a malformed scope UUID returns 400.

## Organization-owner endpoints

These endpoints are registered by the `org_owner` portal. Both require a bearer access token and an active role assignment in the organization:

- `GET /api/v1/organizations/{organization_id}/pageants` lists the organization's pageants; `GET /api/v1/organizations/{organization_id}/pageants/{pageant_id}` reads one pageant. Both require `pageant.read`.
- `POST /api/v1/organizations/{organization_id}/pageants` requires `pageant.create` and creates a draft pageant plus its default settings in one transaction.
- `PUT /api/v1/organizations/{organization_id}/pageants/{pageant_id}` requires `pageant.update` and replaces the editable pageant fields.
- `DELETE /api/v1/organizations/{organization_id}/pageants/{pageant_id}` requires `pageant.delete` and archives the pageant (`status = ARCHIVED`) to preserve its event data.
- `GET` and `POST /api/v1/organizations/{organization_id}/coordinators` require `role.assign` and list or assign coordinators.
- `GET`, `PUT`, and `DELETE /api/v1/organizations/{organization_id}/coordinators/{user_id}` also require `role.assign`. `PUT` replaces the assigned coordinator with another existing active user using `{ "email": "new-coordinator@example.com" }`; `DELETE` revokes the `ORG_COORDINATOR` role.

Pageant creation accepts `name` and `slug` plus optional `description`, `logo_url`, `event_date` (`YYYY-MM-DD`), `start_time`/`end_time` (`HH:MM:SS`), `venue`, and `is_public`. The slug must contain lowercase letters, numbers, and hyphens. Slugs must be unique within an organization.

Run migrations `017_org_owner_pageant_create.sql`, `020_org_owner_pageant_crud.sql`, and the role-permission seed migration to grant owners the required permissions. Coordinator assignment targets existing active user accounts; the schema does not include coordinator invitations. Removing a coordinator preserves their organization membership if they still have another organization role or active pageant assignment.

## Platform-admin subscription plans

The admin portal manages the catalog of subscription plans using the existing `subscription_plans` table. All endpoints require a valid bearer token and the system-level `billing.manage` permission, granted to `PLATFORM_ADMIN` by `016_seed_role_permissions.sql`:

- `GET /api/v1/admin/subscription-plans` lists plans, including inactive plans.
- `POST /api/v1/admin/subscription-plans` creates a plan.
- `GET /api/v1/admin/subscription-plans/{id}` gets plan details.
- `PUT /api/v1/admin/subscription-plans/{id}` replaces the plan fields.
- `DELETE /api/v1/admin/subscription-plans/{id}` deactivates the plan. Plans are retained because organization subscriptions reference them.

Create and update accept `code`, `name`, `kind` (`PER_EVENT`, `MONTHLY`, `YEARLY`, `ENTERPRISE`, or `CUSTOM`), `price_amount`, `currency`, and optional `billing_interval_months`, `max_pageants`, and `max_tabulator_users`, plus `customization_enabled` and `is_active`. Codes are normalized to uppercase letters, numbers, and underscores; currency is normalized to a three-letter uppercase code. `is_active` defaults to `true` when omitted. Plan management defines the catalog only; organization subscription checkout and lifecycle management are separate workflows.

Platform admins can also inspect the user and organization directories:

- `GET /api/v1/admin/users` lists users; `GET /api/v1/admin/users/{id}` reads one user. Both require system permission `user.read`.
- `GET /api/v1/admin/organizations` lists organizations; `GET /api/v1/admin/organizations/{id}` reads one organization, including its owner summary. Both require system permission `organization.read`.

Directory lists support `limit` (default 50, capped at 100) and `offset` (default 0) query parameters. User responses intentionally omit password hashes and authentication tokens. Apply `021_admin_directory_read.sql` to grant `user.read` to `PLATFORM_ADMIN`.

`GET /api/v1/admin/revenue` requires system permission `billing.read` and reports gross income from completed subscription payment transactions (`subscription_id` is present). It returns totals grouped by currency and organization breakdowns, so currencies are never combined into one number. Optional filters are `organization_id`, `from`, and `to` (RFC 3339 timestamps; `from` is inclusive and `to` is exclusive). It reports collected income rather than net profit because the schema does not track expenses.

Platform admins can inspect application activity logs with system-level permissions already granted in `016_seed_role_permissions.sql`:

- `GET /api/v1/admin/audit-logs` and `GET /api/v1/admin/audit-logs/{id}` require `audit.read`.
- `GET /api/v1/admin/transaction-logs` and `GET /api/v1/admin/transaction-logs/{id}` require `transaction.read`.

Both list endpoints accept `organization_id`, `pageant_id`, `actor_user_id`, and an RFC 3339 `from`/`to` time range (`from` inclusive, `to` exclusive), plus `limit` and `offset` (default 50, max 100). Audit logs additionally filter on `action`, `resource_type`, and `success`; transaction logs filter on `transaction_type`, `status`, `reference_type`, and `reference_id`. These endpoints read the `audit_logs` and `transaction_logs` records; they do not create log records themselves.

## Pageant vote packages

Owners with the organization-level `voting.manage` permission can manage vote bundles for a pageant:

- `GET /api/v1/organizations/{organization_id}/pageants/{pageant_id}/vote-packages` lists active and inactive packages.
- `POST` to the same path creates a package. Example: `{ "name": "10 Votes", "vote_quantity": 10, "price_amount": 30, "currency": "PHP" }`.
- `PUT /api/v1/organizations/{organization_id}/pageants/{pageant_id}/vote-packages/{package_id}` replaces its editable fields.
- `DELETE` on that item path deactivates the package without deleting its record.

Run migration `018_pageant_vote_packages.sql` before using these endpoints. Package management defines the options and prices; audience checkout, payment confirmation, and applying purchased votes to a selected contestant are separate flows and are not implemented by these endpoints.

## Pageant judges and tabulators

Organization owners can manage pageant staff using their organization-level assignment permissions:

- `GET` and `POST /api/v1/organizations/{organization_id}/pageants/{pageant_id}/judges`
- `DELETE /api/v1/organizations/{organization_id}/pageants/{pageant_id}/judges/{user_id}`
- `GET` and `POST /api/v1/organizations/{organization_id}/pageants/{pageant_id}/tabulators`
- `DELETE /api/v1/organizations/{organization_id}/pageants/{pageant_id}/tabulators/{user_id}`
- `GET` and `POST /api/v1/organizations/{organization_id}/pageants/{pageant_id}/coordinators`
- `DELETE /api/v1/organizations/{organization_id}/pageants/{pageant_id}/coordinators/{user_id}`

The `POST` body is `{ "email": "person@example.com" }` and targets an existing active user. Assignment adds or reactivates that user's organization membership, then grants the pageant-scoped role. Every operation verifies that the pageant belongs to the organization in the URL. Apply `019_org_owner_staff_assignment.sql` to grant `judge.assign` and `tabulator.assign` to `ORG_OWNER`.

Pageant coordinator assignment requires that the target already has the organization-level `ORG_COORDINATOR` role. It grants or reactivates the pageant-scoped `PAGEANT_COORDINATOR` assignment, which is what makes the pageant appear in the coordinator portal.

## Coordinator portal

Coordinator routes require a bearer token. `GET /api/v1/coordinator/pageants` lists only pageants where the authenticated user has an active `PAGEANT_COORDINATOR` assignment. `GET /api/v1/coordinator/pageants/{pageant_id}` additionally requires pageant permission `pageant.read`; `PUT` on that item requires `pageant.update` and updates the pageant's editable event details. Coordinators cannot create or archive pageants through this portal. Each item operation verifies the active coordinator assignment in the database as well as the RBAC permission.

For an assigned pageant, coordinators can also manage judges:

- `GET` and `POST /api/v1/coordinator/pageants/{pageant_id}/judges` require pageant permission `judge.assign`. The `POST` body is `{ "email": "judge@example.com" }` and assigns an existing active user (or reactivates the judge assignment).
- `DELETE /api/v1/coordinator/pageants/{pageant_id}/judges/{user_id}` revokes the active judge assignment and requires the same permission.

These operations also verify that the caller has an active `PAGEANT_COORDINATOR` assignment for the pageant. Judge assignment records the coordinator as the assigner and ensures the judge has an active organization membership.

Coordinators can manage contestants in their assigned pageants:

- `GET` and `POST /api/v1/coordinator/pageants/{pageant_id}/contestants` require `contestant.read` and `contestant.create` respectively.
- `GET`, `PUT`, and `DELETE /api/v1/coordinator/pageants/{pageant_id}/contestants/{contestant_id}` require `contestant.read`, `contestant.update`, and `contestant.delete` respectively.

Create and update accept `contestant_number`, `first_name`, `last_name`, and optional `middle_name`, `display_name`, `gender`, `photo_url`, `biography`, and `user_id`. If `display_name` is omitted or blank, it is built from the name fields. A supplied `user_id` must belong to an active account. Delete deactivates the contestant to preserve historical scores and votes. The workflow checks the coordinator's active pageant assignment on reads and writes.

Coordinators can manage pageant categories and judging criteria under their active pageant assignments. All endpoints require pageant permission `criteria.manage`:

- Categories: `GET` and `POST /api/v1/coordinator/pageants/{pageant_id}/categories`, then `GET`, `PUT`, or `DELETE /api/v1/coordinator/pageants/{pageant_id}/categories/{category_id}`.
- Criteria: `GET` and `POST /api/v1/coordinator/pageants/{pageant_id}/criteria`, then `GET`, `PUT`, or `DELETE /api/v1/coordinator/pageants/{pageant_id}/criteria/{criterion_id}`.

Category bodies contain `code`, `name`, optional `description`, and optional `display_order` (defaults to zero). Criterion bodies contain `code`, `name`, optional `description`, `default_maximum_score`, and `default_minimum_score`. Codes are normalized to uppercase letters, numbers, and underscores. Scores must fit `NUMERIC(8,3)`, with a positive maximum and a minimum no greater than the maximum. Delete deactivates each record to preserve category references and judging history.

Coordinators can manage round definitions for assigned pageants using pageant permission `round.manage`:

- `GET` and `POST /api/v1/coordinator/pageants/{pageant_id}/rounds`
- `GET`, `PUT`, and `DELETE /api/v1/coordinator/pageants/{pageant_id}/rounds/{round_id}`

Round creation accepts `name`, `round_number`, `round_type` (`PRELIMINARY`, `SWIMWEAR`, `FORMAL_WEAR`, `TALENT`, `QUESTION_AND_ANSWER`, `FINAL`, or `CUSTOM`), optional `advancement_count`, `starts_at`, and `ends_at`. New rounds always start as `DRAFT`. Update accepts the same fields and a `status`; statuses can move forward `DRAFT` → `OPEN` → `CLOSED` → `FINALIZED`, and finalized rounds are immutable. A round can only be deleted while it is a draft and has no contestant registration, judge assignment, advancement, tabulation, or voting records. The API checks the caller's active coordinator assignment in addition to the route permission.

Run HTTP middleware integration coverage with:

```sh
cargo test -p core_auth --lib api::routes::tests::authorization_middleware
```

The PostgreSQL authorization workflow tests exercise the schema and role-permission joins using the configured test database:

```sh
cargo test -p core_auth --lib infrastructure::postgres::tests::authorization_workflow_tests
```
