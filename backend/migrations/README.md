# VoteX PostgreSQL Schema

Execute the SQL files in this order:

001_users_and_authentication.sql
002_organizations.sql
003_billing_and_subscriptions.sql
004_rbac_schema.sql
005_pageants_schema.sql
006_contestants_schema.sql
007_categories_and_criteria.sql
008_rounds_and_advancements.sql
009_judging_and_scoring.sql
010_tabulation_and_tie_breaks.sql
011_audience_voting.sql
012_results_and_publication.sql
013_audit_transaction_idempotency.sql
014_integrity_and_operational_support.sql
015_login_failure_window.sql
016_seed_role_permissions.sql
017_org_owner_pageant_create.sql
018_pageant_vote_packages.sql
019_org_owner_staff_assignment.sql
020_org_owner_pageant_crud.sql

Notes:
- This schema is intended for a fresh PostgreSQL database.
- Backend validation is still required for complex cross-table business rules.
- Run migrations through Django migrations, Flyway, Liquibase, or another migration tool in production.
- Do not rerun files blindly against an already populated database.
