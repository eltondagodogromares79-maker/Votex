# Organization owner vote revenue

`GET /api/v1/organizations/{organization_id}/revenue/votes` reports gross income from completed audience vote payments. It accepts optional `pageant_id`, `candidate_id`, `from`, and `to` query parameters. The time range is inclusive at `from` and exclusive at `to`.

The report reads completed `VOTE` records in `transaction_logs`. To attribute a payment to a candidate, each successful payment must use `reference_type = 'AUDIENCE_VOTE'` and `reference_id = audience_vote_transactions.id`, and must populate `organization_id`, `pageant_id`, `amount`, `currency`, and `completed_at`. Only records with `status = 'COMPLETED'` contribute to income. Reported `votes_sold` sums quantities whose audience vote status is `VALID`.

The audience vote schema currently does not persist a package or captured purchase amount, and there is no vote checkout/payment workflow in the application. Until that flow writes the transaction records above, this report returns zero/empty totals. It deliberately does not estimate income from current package prices.
