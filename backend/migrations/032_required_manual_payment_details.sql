ALTER TABLE subscription_payment_proofs
    ADD COLUMN amount_paid NUMERIC(12, 2);

UPDATE subscription_payment_proofs proof
SET amount_paid = payment.amount
FROM payment_transactions payment
WHERE payment.id = proof.payment_transaction_id;

ALTER TABLE subscription_payment_proofs
    ALTER COLUMN amount_paid SET NOT NULL,
    ALTER COLUMN proof_url DROP NOT NULL,
    ADD CONSTRAINT subscription_payment_proofs_amount_paid_positive
        CHECK (amount_paid > 0);
