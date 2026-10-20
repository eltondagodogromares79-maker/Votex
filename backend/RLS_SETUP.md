# PostgreSQL Row-Level Security

VoteX enforces database row policies on organization and pageant data through the
API's non-owner PostgreSQL runtime role. Rust authorization remains enabled and
continues to enforce role-specific actions.

## Database roles

Keep the schema migration credentials separate from the application credentials.
The migration login must own the schema objects and have `CREATEROLE` permission
for migration 053. The runtime login must not own RLS-protected tables and must
not be a superuser or have `BYPASSRLS`.

For a local database, create a dedicated runtime login as a database
administrator (replace the password before running this):

```sql
CREATE ROLE votex_runtime
  LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS
  PASSWORD 'replace-with-a-long-random-password';
GRANT CONNECT ON DATABASE votex TO votex_runtime;
```

<!-- set -a
source .env
set +a
DATABASE_URL="$MIGRATOR_DATABASE_URL" sqlx migrate run -->

The migration creates the `votex_app` group role, grants it the required table,
sequence, and policy-helper privileges, then grants membership to the role named
by `DATABASE_RUNTIME_ROLE`. It refuses to apply if that login does not exist.

Set the backend environment variables:

```dotenv
DATABASE_URL=postgres://votex_runtime:<runtime-password>@localhost:5432/votex
MIGRATOR_DATABASE_URL=postgres://<schema-owner>:<migration-password>@localhost:5432/votex
DATABASE_RUNTIME_ROLE=votex_runtime
```

Use the database account that currently owns the schema for
`MIGRATOR_DATABASE_URL`. Keep it private and use the non-owner account for
`DATABASE_URL`. At startup, VoteX runs migrations through the migration pool,
closes it, opens the runtime pool, and refuses to serve requests if that runtime
role can bypass RLS, owns a protected table, or is not a member of `votex_app`.

## Request identity and policies

The authentication middleware scopes the verified user ID and role to the
request. SQLx applies that context when it checks out a connection and clears it
before returning the connection to the pool. A failed context update or cleanup
discards the connection. This keeps one user's context from leaking to the next
pool borrower. The current design uses a checked-out connection scope because
the existing workflows perform some individual SQL statements directly through
`PgPool` while others use explicit transactions.

Public registration has no authenticated request identity. Its database
workflow sets the newly created user ID transaction-locally before inserting
that user's audience or organization records. The setting automatically resets
when the registration transaction commits or rolls back. Organization inserts
are additionally restricted to rows whose `owner_id` matches that identity.
After login credentials or a refresh token are verified, role resolution also
runs with that verified user ID so RLS can read the user's active memberships.
Email verification similarly installs the token owner's identity transaction-
locally only after a valid, unexpired token is found, allowing the matching
audience voter record to be updated without opening that update to anonymous
requests. Account deletion deactivates its organization and pageant assignments
through `votex_deactivate_own_assignments()`: this `SECURITY DEFINER` function
accepts no target user ID and derives the only rows it may change from the
authenticated request context.

The internal PayMongo webhook receives the system context only after its
signature has been verified. The unauthenticated public catalog receives no
user context and can read only rows covered by explicit public-read policies.

Policies cover organizations and memberships, pageants and their configuration,
contestants, scoring and tabulation records, vote records, subscriptions and
payment proofs, activity/transaction logs, notifications, legal policies, and
contact messages. Pageant staff can read their assigned pageant; organization
owners/coordinators manage organization data; judges can save their assigned
scores; tabulators can manage tabulation records; and platform administrators
retain administrative access. Public pageant, contestant, voting catalog, plan,
and legal-policy reads have separate policies.

Global authentication and identity tables (`users`, login providers, password
reset/email verification tokens, refresh tokens, roles, and permission catalogs)
remain outside these tenant RLS policies. Their flows perform global email/token
lookups before an authenticated user context exists, and staff account reuse
requires looking up accounts across organizations. Those tables continue to
depend on the existing Rust application checks. Do not describe this migration
as RLS protection for those global tables.

## Isolation integration check

The opt-in integration test creates two private organizations and pageants using
the fixture/migration account, then queries both pageant IDs through the runtime
role under each owner's request context. Each owner must see only their own
pageant.

Set `RLS_TEST_MIGRATOR_DATABASE_URL` to the schema-owner URL and
`RLS_TEST_DATABASE_URL` to the restricted runtime URL, ensure migrations have
been applied, then run:

```sh
cargo test -p core_infra --test tenant_rls_isolation -- --nocapture
```

Without both test URLs, the test reports a skip. Run it against a disposable
local/test database, not production.
