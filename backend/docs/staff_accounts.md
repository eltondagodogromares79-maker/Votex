# Coordinator, judge, and tabulator accounts

Creating a coordinator uses `POST /api/v1/organizations/{organization_id}/coordinators` with `email`, `first_name`, and `last_name`. Org owners create judge and tabulator accounts by posting the same fields to the pageant's `/judges` or `/tabulators` endpoint. Coordinators use `POST /api/v1/coordinator/pageants/{pageant_id}/judges` or `/tabulators`.

New staff accounts receive a cryptographically random initial password by email. The database stores only the Argon2 password hash, and each new staff email is marked verified because the mailbox receives the account credentials. Existing active accounts can be assigned to another pageant without replacing their password or emailing credentials again.

After login, staff can change their password with `POST /api/v1/auth/change-password` and a bearer token. Request JSON: `{"current_password":"…","new_password":"…"}`. A successful password change revokes all refresh tokens for that user.
