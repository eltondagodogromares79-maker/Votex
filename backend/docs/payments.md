# PayMongo checkout

The API uses PayMongo hosted Checkout Sessions for audience vote packages and, optionally, paid organization plans. Secret keys stay in the API process. `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET_KEY`, `PAYMONGO_SUCCESS_URL`, `PAYMONGO_CANCEL_URL`, and optionally `PAYMONGO_PAYMENT_METHOD_TYPES` must be set in the server environment.

Set `SUBSCRIPTION_PAYMENT_MODE=MANUAL` to use bank/mobile-wallet transfer references and optional receipt uploads with administrator review. Set it to `AUTOMATED` to send new paid organization-plan subscriptions to PayMongo hosted checkout. The default is `MANUAL`. Audience vote payments always use PayMongo, regardless of this subscription-only switch. Use only the backend `.env`; never expose PayMongo secret or webhook keys to the browser. Changing this setting affects new subscriptions; pending payments keep the method they were created with.

For local development, use an HTTPS tunnel for the frontend and point `PAYMONGO_SUCCESS_URL` and `PAYMONGO_CANCEL_URL` at its plans page with `?checkout=success` and `?checkout=cancelled`. These redirects only show status guidance; the subscription becomes active only after the signed webhook is received. `PAYMONGO_BASE_URL` is not needed: the backend calls PayMongo's fixed API host, while the webhook must be registered in PayMongo to reach your publicly accessible backend.

Apply migration `025_paymongo_checkout_idempotency.sql` before enabling checkout. Register one HTTPS webhook in the PayMongo dashboard at:

```text
POST /api/v1/payments/paymongo/webhook
```

Subscribe it to `checkout_session.payment.paid`. Configure the test endpoint with the test secret and signing secret, and the live endpoint with the live secrets. The handler verifies PayMongo's `Paymongo-Signature` over the raw request bytes and checks live/test mode. It allows delayed signed retries because payment fulfillment is idempotent in the database. Only the signed paid event marks a subscription active or credits vote totals; browser redirects are not treated as payment confirmation.

## API usage

- Organization plan purchase: `POST /api/v1/organizations/{organization_id}/subscriptions`, body `{"plan_id":"..."}`, and a unique `Idempotency-Key` request header. In `MANUAL` mode, paid plans require transfer details and administrator review. In `AUTOMATED` mode, paid plans return a `checkout_url`; `POST /api/v1/organizations/{organization_id}/subscriptions/{subscription_id}/checkout` resumes that PayMongo checkout. Existing pending payments retain their original payment method when the mode changes.
- Audience catalog: `GET /api/v1/audience/pageants/{pageant_id}/vote-packages` and `GET /api/v1/audience/pageants/{pageant_id}/contestants`.
- Audience purchase: `POST /api/v1/audience/pageants/{pageant_id}/votes`, body `{"contestant_id":"...","package_id":"..."}`, and a unique `Idempotency-Key` header. The response contains the hosted checkout URL and a vote purchase ID.
- Audience payment status: `GET /api/v1/audience/votes/{vote_id}`. Votes appear in totals after the paid webhook is processed.
- Audience transaction history: `GET /api/v1/audience/transactions?limit=50&offset=0`. This returns only the authenticated audience account's vote purchases, including their status and payment reference.
- Organization transaction history: `GET /api/v1/organizations/{organization_id}/transactions?limit=50&offset=0`. This includes subscription payments and organization business transactions; optional `pageant_id`, `candidate_id`, `from`, and `to` filters are supported. It requires the organization's `billing.read` permission.

Both history endpoints default to 50 records per page and cap `limit` at 200. The audience endpoint requires authentication. The organization endpoint requires authentication and organization authorization.

Audience idempotency keys are scoped to the verified audience account. Reusing a key for different candidate/package input returns a conflict. PayMongo receives a stable internal transaction UUID as its own idempotency key so an interrupted checkout creation can safely be retried.

If a payment settles after configured vote limits have already been consumed, the purchase is marked `REVIEW` and the transaction log records that a refund review is required; it is not added to vote totals. Refund execution is not automated by this integration.

Pending organization checkouts cannot be canceled through the subscription endpoint. PayMongo checkout sessions remain payable until explicitly expired; canceling the local record without expiring the provider session could collect money without activating the subscription.
