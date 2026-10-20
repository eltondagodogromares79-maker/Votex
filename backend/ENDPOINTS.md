 # Votexx Backend API Endpoints

Base URL: `http://localhost:8080`

All routes return JSON. Error responses follow the shape:
```json
{ "code": "ERROR_CODE", "message": "Human readable message" }
{ "code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred", "error_id": "uuid" }
```

Auth legend:
- **Public** — no token required
- **Bearer** — requires `Authorization: Bearer <access_token>` header
- **Bearer + Role** — Bearer token AND the user must hold the named permission

---

## Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register/organization` | Public | Register a new org owner + organization |
| POST | `/api/v1/auth/register/audience` | Public | Register a new audience account |
| POST | `/api/v1/auth/verify-email` | Public | Verify email with 6-digit OTP |
| POST | `/api/v1/auth/send-verification-code` | Authenticated | Send a new verification code to the signed-in user's email |
| POST | `/api/v1/auth/login` | Public | Login — returns access token + sets HttpOnly refresh cookie |
| POST | `/api/v1/auth/refresh` | Public (cookie) | Refresh access token using HttpOnly cookie |
| POST | `/api/v1/auth/logout` | Public (cookie) | Logout — clears refresh cookie |
| GET  | `/api/v1/auth/me` | Bearer | Get own profile |
| PUT  | `/api/v1/auth/me` | Bearer | Update own profile |
| PUT  | `/api/v1/auth/me/email` | Bearer | Request an email change while the current address is unverified |
| DELETE | `/api/v1/auth/me` | Bearer + current password + `confirmation: "DELETE"` | Delete and anonymize own account; deactivates owned organizations/pageants and retains anonymized history |
| POST | `/api/v1/auth/change-password` | Bearer | Change own password |

## Realtime — `/api/v1/realtime`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/realtime/ticket` | Bearer | Issue a short-lived, one-use WebSocket ticket |
| GET | `/api/v1/realtime/pageants?pageantId={id}&ticket={ticket}` | One-use ticket + pageant assignment | Subscribe to low-detail score and pageant-change events |

---

## Organization Owner — `/api/v1/organizations/{organization_id}`

All routes require Bearer token and `organization_id` path param.

### Organization Profile

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/organizations/{organization_id}` | `organization.read` | Get organization profile |
| PUT | `/api/v1/organizations/{organization_id}` | `organization.update` | Update organization profile |

### Subscription & Billing

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/organizations/{organization_id}/subscription-plans` | `billing.read` | List available subscription plans |
| GET | `/api/v1/organizations/{organization_id}/subscription-payment-mode` | `billing.read` | Get the configured subscription payment mode (`MANUAL` or `AUTOMATED`) |
| GET | `/api/v1/organizations/{organization_id}/subscription` | `billing.read` | Get current subscription |
| GET | `/api/v1/organizations/{organization_id}/subscription/usage` | `organization.read` | Get current plan limits and live organization/pageant resource usage |
| GET | `/api/v1/organizations/{organization_id}/activity-logs` | `audit.read` | List organization-scoped activity records (50 per page, maximum 100) |
| GET | `/api/v1/organizations/{organization_id}/subscriptions` | `billing.manage` | List subscription history |
| POST | `/api/v1/organizations/{organization_id}/subscriptions` | `billing.manage` | Subscribe to a plan |
| GET | `/api/v1/organizations/{organization_id}/subscriptions/pending-payment` | `billing.read` | Get pending subscription payment and latest proof |
| POST | `/api/v1/organizations/{organization_id}/subscriptions/{subscription_id}/checkout` | `billing.manage` | Resume an existing PayMongo subscription checkout |
| POST | `/api/v1/organizations/{organization_id}/subscriptions/{subscription_id}/payment-proof` | `billing.manage` | Submit manual payment proof |
| GET | `/api/v1/admin/subscription-payment-proofs` | System `billing.manage` | List payment proofs awaiting review |
| GET | `/api/v1/admin/subscription-payment-proofs/history` | System `billing.manage` | List recent proof review history |
| POST | `/api/v1/admin/subscription-payment-proofs/{proof_id}/review` | System `billing.manage` | Approve or reject a payment proof |
| POST | `/api/v1/admin/subscription-payment-proofs/{proof_id}/revoke-approval` | System `billing.manage` | Revoke an approval and cancel its active subscription |
| GET | `/api/v1/admin/subscriptions/organizations/{organization_id}` | System `billing.manage` | View organization subscription, payment, proof, and admin action history |
| POST | `/api/v1/admin/subscriptions/{subscription_id}/cancel` | System `billing.manage` | Cancel a subscription with a required reason |
| DELETE | `/api/v1/organizations/{organization_id}/subscriptions/{subscription_id}` | `billing.manage` | Cancel a subscription only if the organization has never created a pageant |

### Revenue

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/organizations/{organization_id}/revenue/votes` | `billing.read` | Vote revenue report |
| GET | `/api/v1/organizations/{organization_id}/transactions` | `billing.read` | Transaction history |

### Pageants

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/organizations/{organization_id}/pageants` | `pageant.read` | List organization pageants |
| POST | `/api/v1/organizations/{organization_id}/pageants` | `pageant.create` | Create a pageant |
| GET | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}` | `pageant.read` | Get a pageant |
| PUT | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}` | `pageant.update` | Update a pageant |
| POST | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/publish` | `pageant.update` | Publish a draft pageant and enable its coordinator dashboard |
| DELETE | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}` | `pageant.delete` | Archive an untouched pageant; configured pageants remain and consume a plan slot |
| POST | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/restore` | `pageant.update` | Restore an archived, untouched pageant if the plan has capacity |

### Coordinators

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/organizations/{organization_id}/coordinators` | `role.assign` | List organization coordinators |
| POST | `/api/v1/organizations/{organization_id}/coordinators` | `role.assign` | Add a coordinator |
| GET | `/api/v1/organizations/{organization_id}/coordinators/{user_id}` | `role.assign` | Get a coordinator |
| PUT | `/api/v1/organizations/{organization_id}/coordinators/{user_id}` | `role.assign` | Replace a coordinator |
| DELETE | `/api/v1/organizations/{organization_id}/coordinators/{user_id}` | `role.assign` | Remove a coordinator |

### Pageant Staff (per pageant)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/coordinators` | `role.assign` | List pageant coordinators |
| POST | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/coordinators` | `role.assign` | Assign pageant coordinator |
| DELETE | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/coordinators/{user_id}` | `role.assign` | Revoke pageant coordinator |
| GET | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/judges` | `judge.assign` | List judges |
| POST | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/judges` | `judge.assign` | Assign a judge |
| DELETE | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/judges/{user_id}` | `judge.assign` | Revoke a judge |
| GET | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/tabulators` | `tabulator.assign` | List tabulators |
| POST | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/tabulators` | `tabulator.assign` | Assign a tabulator |
| DELETE | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/tabulators/{user_id}` | `tabulator.assign` | Revoke a tabulator |

### Vote Packages

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/vote-packages` | `voting.manage` | List vote packages |
| POST | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/vote-packages` | `voting.manage` | Create a vote package |
| PUT | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/vote-packages/{package_id}` | `voting.manage` | Update a vote package |
| DELETE | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/vote-packages/{package_id}` | `voting.manage` | Deactivate a vote package |
| POST | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}/vote-packages/{package_id}/activate` | `voting.manage` | Reactivate a vote package on a non-archived pageant |

---

## Coordinator — `/api/v1/coordinator`

All routes require Bearer token.

### Pageants

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/coordinator/pageants` | Bearer | List assigned pageants |
| GET | `/api/v1/coordinator/pageants/{pageant_id}` | `pageant.read` | Get assigned pageant |
| PUT | `/api/v1/coordinator/pageants/{pageant_id}` | `pageant.update` | Update assigned pageant |

### Staff (per pageant)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/coordinator/pageants/{pageant_id}/judges` | `judge.assign` | List judges |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/judges` | `judge.assign` | Assign a judge |
| DELETE | `/api/v1/coordinator/pageants/{pageant_id}/judges/{user_id}` | `judge.assign` | Revoke a judge |
| GET | `/api/v1/coordinator/pageants/{pageant_id}/tabulators` | `tabulator.assign` | List tabulators |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/tabulators` | `tabulator.assign` | Assign a tabulator |
| DELETE | `/api/v1/coordinator/pageants/{pageant_id}/tabulators/{user_id}` | `tabulator.assign` | Revoke a tabulator |

### Contestants

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/coordinator/pageants/{pageant_id}/contestants` | `contestant.read` | List contestants |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/contestants` | `contestant.create` | Add a contestant |
| GET | `/api/v1/coordinator/pageants/{pageant_id}/contestants/{contestant_id}` | `contestant.read` | Get a contestant |
| PUT | `/api/v1/coordinator/pageants/{pageant_id}/contestants/{contestant_id}` | `contestant.update` | Update a contestant |
| DELETE | `/api/v1/coordinator/pageants/{pageant_id}/contestants/{contestant_id}` | `contestant.delete` | Deactivate a contestant |
| GET | `/api/v1/coordinator/pageants/{pageant_id}/contestants/{contestant_id}/placements` | `contestant.read` | Get candidate category and round assignments |
| PUT | `/api/v1/coordinator/pageants/{pageant_id}/contestants/{contestant_id}/placements` | `contestant.update` | Replace candidate category and round assignments; progressed rounds cannot be removed |

### Categories

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/coordinator/pageants/{pageant_id}/categories` | `criteria.manage` | List categories |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/categories` | `criteria.manage` | Create a category |
| GET | `/api/v1/coordinator/pageants/{pageant_id}/categories/{category_id}` | `criteria.manage` | Get a category |
| PUT | `/api/v1/coordinator/pageants/{pageant_id}/categories/{category_id}` | `criteria.manage` | Update a category |
| DELETE | `/api/v1/coordinator/pageants/{pageant_id}/categories/{category_id}` | `criteria.manage` | Deactivate a category |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/categories/{category_id}/activate` | `criteria.manage` | Reactivate a category if the subscription has capacity |

### Criteria

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/coordinator/pageants/{pageant_id}/criteria` | `criteria.manage` | List criteria |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/criteria` | `criteria.manage` | Create a criterion |
| GET | `/api/v1/coordinator/pageants/{pageant_id}/criteria/{criterion_id}` | `criteria.manage` | Get a criterion |
| PUT | `/api/v1/coordinator/pageants/{pageant_id}/criteria/{criterion_id}` | `criteria.manage` | Update a criterion |
| DELETE | `/api/v1/coordinator/pageants/{pageant_id}/criteria/{criterion_id}` | `criteria.manage` | Deactivate a criterion |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/criteria/{criterion_id}/activate` | `criteria.manage` | Reactivate a criterion |

### Rounds

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/coordinator/pageants/{pageant_id}/rounds` | `round.manage` | List rounds |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/rounds` | `round.manage` | Create a round |
| GET | `/api/v1/coordinator/pageants/{pageant_id}/rounds/{round_id}` | `round.manage` | Get a round |
| PUT | `/api/v1/coordinator/pageants/{pageant_id}/rounds/{round_id}` | `round.manage` | Update a round |
| DELETE | `/api/v1/coordinator/pageants/{pageant_id}/rounds/{round_id}` | `round.manage` | Delete a round |
| GET | `/api/v1/coordinator/pageants/{pageant_id}/rounds/{round_id}/judging-configuration` | `criteria.manage` | Get round categories, weighted category criteria, and assigned judges |
| PUT | `/api/v1/coordinator/pageants/{pageant_id}/rounds/{round_id}/judging-configuration` | `criteria.manage` | Save round categories, category criteria (weights total 100%), and pageant judges |

---

## Judge — `/api/v1/judge`

All routes require Bearer token.

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/judge/pageants` | Bearer | List assigned pageants |
| GET | `/api/v1/judge/pageants/{pageant_id}/contestants` | `contestant.read` | List contestants for scoring |
| GET | `/api/v1/judge/pageants/{pageant_id}/rounds` | `pageant.read` | List rounds |
| GET | `/api/v1/judge/pageants/{pageant_id}/categories` | `pageant.read` | List categories |
| GET | `/api/v1/judge/pageants/{pageant_id}/criteria` | `pageant.read` | List criteria |

---

## Tabulator — `/api/v1/tabulator`

All routes require Bearer token.

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/tabulator/pageants` | Bearer | List assigned pageants |
| GET | `/api/v1/tabulator/pageants/{pageant_id}/contestants` | `contestant.read` | List contestants |
| GET | `/api/v1/tabulator/pageants/{pageant_id}/categories` | `pageant.read` | List categories |
| GET | `/api/v1/tabulator/pageants/{pageant_id}/criteria` | `pageant.read` | List criteria |
| GET | `/api/v1/tabulator/pageants/{pageant_id}/rounds` | `pageant.read` | List rounds |
| GET | `/api/v1/tabulator/pageants/{pageant_id}/rounds/{round_id}/advancements` | `pageant.read` | List advancements for a round |

---

## Audience — `/api/v1/audience`

All routes require Bearer token.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/audience/pageants/{pageant_id}/vote-packages` | List available vote packages for a pageant |
| GET | `/api/v1/audience/pageants/{pageant_id}/contestants` | List voteable contestants |
| POST | `/api/v1/audience/pageants/{pageant_id}/votes` | Start a vote checkout |
| GET | `/api/v1/audience/votes/{vote_id}` | Get vote checkout status |
| GET | `/api/v1/audience/transactions` | Get own vote transaction history |

---

## Admin — `/api/v1/admin`

All routes require Bearer token and system-level permissions.

### Directory

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/admin/users` | `user.read` | List all platform users |
| GET | `/api/v1/admin/users/{id}` | `user.read` | Get a user |
| GET | `/api/v1/admin/organizations` | `organization.read` | List all organizations |
| GET | `/api/v1/admin/organizations/{id}` | `organization.read` | Get an organization |

### Subscription Plans

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/admin/subscription-plans` | `billing.manage` | List subscription plans |
| POST | `/api/v1/admin/subscription-plans` | `billing.manage` | Create a subscription plan |
| GET | `/api/v1/admin/subscription-plans/{id}` | `billing.manage` | Get a subscription plan |
| PUT | `/api/v1/admin/subscription-plans/{id}` | `billing.manage` | Update a subscription plan |
| DELETE | `/api/v1/admin/subscription-plans/{id}` | `billing.manage` | Deactivate a subscription plan |

### Revenue & Logs

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/admin/revenue` | `billing.read` | Platform revenue report |
| GET | `/api/v1/admin/audit-logs` | `audit.read` | List audit logs |
| GET | `/api/v1/admin/audit-logs/{id}` | `audit.read` | Get an audit log entry |
| GET | `/api/v1/admin/contact-messages` | `audit.read` | List contact messages submitted by signed-in users |
| GET | `/api/v1/admin/legal-policies` | `billing.manage` | List editable Terms, Privacy, and Refund policy documents |
| PUT | `/api/v1/admin/legal-policies/{slug}` | `billing.manage` | Update and publish a policy (`terms`, `privacy`, `refund-policy`, or `cookie-policy`) |
| POST | `/api/v1/contact` | Bearer token | Submit a contact message using the authenticated account's name and email |
| GET | `/api/v1/admin/transaction-logs` | `transaction.read` | List transaction logs |
| GET | `/api/v1/admin/transaction-logs/{id}` | `transaction.read` | Get a transaction log entry |

---

## Public Legal Policies — `/api/v1/audience/public/legal-policies`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/audience/public/legal-policies/{slug}` | None (rate limited) | Read a published legal policy (`terms`, `privacy`, `refund-policy`, or `cookie-policy`) |

---

## Payments — `/api/v1/payments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/payments/paymongo/webhook` | Webhook secret (header) | PayMongo payment webhook |

---

## Test — `/api/v1/test`

Development only — verifies JWT + RBAC pipeline.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/test/authorization/{organization_id}` | Bearer + `organization.read` | Test org-scoped auth |
| GET | `/api/v1/test/pageant-authorization/{pageant_id}` | Bearer + `score.submit` | Test pageant-scoped auth |
| GET | `/api/v1/test/system-authorization` | Bearer + `audit.read` | Test system-scoped auth |


curl -X POST http://localhost:8080/api/v1/auth/register/audience `
  -H "Content-Type: application/json" `
  -d '{
    "email": "romareselton79@gmail.com",
    "password": "Softbutnotweak572024@",
    "confirm_password": "Softbutnotweak572024@",
    "first_name": "Elton",
    "last_name": "Dagodog"
  }'


curl -X POST http://localhost:8080/api/v1/auth/verify-email `
  -H "Content-Type: application/json" `
  -d '{
    "email": "romareselton79@gmail.com",
    "code": "044282"
  }'

INSERT INTO user_system_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'romareselton79@gmail.com'
  AND r.code = 'PLATFORM_ADMIN';
