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
| POST | `/api/v1/auth/login` | Public | Login — returns access token + sets HttpOnly refresh cookie |
| POST | `/api/v1/auth/refresh` | Public (cookie) | Refresh access token using HttpOnly cookie |
| POST | `/api/v1/auth/logout` | Public (cookie) | Logout — clears refresh cookie |
| GET  | `/api/v1/auth/me` | Bearer | Get own profile |
| PUT  | `/api/v1/auth/me` | Bearer | Update own profile |
| POST | `/api/v1/auth/change-password` | Bearer | Change own password |

---

## Organization Owner — `/api/v1/organizations/{organization_id}`

All routes require Bearer token and `organization_id` path param.

### Subscription & Billing

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/organizations/{organization_id}/subscription-plans` | `billing.read` | List available subscription plans |
| GET | `/api/v1/organizations/{organization_id}/subscription` | `billing.read` | Get current subscription |
| GET | `/api/v1/organizations/{organization_id}/subscriptions` | `billing.manage` | List subscription history |
| POST | `/api/v1/organizations/{organization_id}/subscriptions` | `billing.manage` | Subscribe to a plan |
| DELETE | `/api/v1/organizations/{organization_id}/subscriptions/{subscription_id}` | `billing.manage` | Cancel a subscription |

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
| DELETE | `/api/v1/organizations/{organization_id}/pageants/{pageant_id}` | `pageant.delete` | Archive a pageant |

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

### Categories

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/coordinator/pageants/{pageant_id}/categories` | `criteria.manage` | List categories |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/categories` | `criteria.manage` | Create a category |
| GET | `/api/v1/coordinator/pageants/{pageant_id}/categories/{category_id}` | `criteria.manage` | Get a category |
| PUT | `/api/v1/coordinator/pageants/{pageant_id}/categories/{category_id}` | `criteria.manage` | Update a category |
| DELETE | `/api/v1/coordinator/pageants/{pageant_id}/categories/{category_id}` | `criteria.manage` | Deactivate a category |

### Criteria

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/coordinator/pageants/{pageant_id}/criteria` | `criteria.manage` | List criteria |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/criteria` | `criteria.manage` | Create a criterion |
| GET | `/api/v1/coordinator/pageants/{pageant_id}/criteria/{criterion_id}` | `criteria.manage` | Get a criterion |
| PUT | `/api/v1/coordinator/pageants/{pageant_id}/criteria/{criterion_id}` | `criteria.manage` | Update a criterion |
| DELETE | `/api/v1/coordinator/pageants/{pageant_id}/criteria/{criterion_id}` | `criteria.manage` | Deactivate a criterion |

### Rounds

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/coordinator/pageants/{pageant_id}/rounds` | `round.manage` | List rounds |
| POST | `/api/v1/coordinator/pageants/{pageant_id}/rounds` | `round.manage` | Create a round |
| GET | `/api/v1/coordinator/pageants/{pageant_id}/rounds/{round_id}` | `round.manage` | Get a round |
| PUT | `/api/v1/coordinator/pageants/{pageant_id}/rounds/{round_id}` | `round.manage` | Update a round |
| DELETE | `/api/v1/coordinator/pageants/{pageant_id}/rounds/{round_id}` | `round.manage` | Delete a round |

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
| GET | `/api/v1/admin/transaction-logs` | `transaction.read` | List transaction logs |
| GET | `/api/v1/admin/transaction-logs/{id}` | `transaction.read` | Get a transaction log entry |

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
    "code": "XXXXXX"
  }'
