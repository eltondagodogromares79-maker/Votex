-- Paid plan selection creates a non-entitling request until a payment provider confirms it.
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
