/**
 * Labels and color classes for billing status types.
 *
 * SubscriptionStatus values come from OrganizationSubscription.status (string from DB).
 * PaymentStatus values come from AudienceTransaction.status (string from DB).
 */

import type { SubscriptionStatus, PaymentStatus } from "@/src/types";

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active:    "Active",
  cancelled: "Cancelled",
  expired:   "Expired",
  pending:   "Pending",
  suspended: "Suspended",
};

export const SUBSCRIPTION_STATUS_COLOR: Record<
  SubscriptionStatus,
  { bg: string; text: string }
> = {
  active:    { bg: "bg-success/15",  text: "text-success" },
  cancelled: { bg: "bg-charcoal/10", text: "text-muted" },
  expired:   { bg: "bg-charcoal/10", text: "text-muted" },
  pending:   { bg: "bg-gold/20",     text: "text-charcoal" },
  suspended: { bg: "bg-error/15",    text: "text-error" },
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending:            "Pending",
  processing:         "Processing",
  paid:               "Paid",
  failed:             "Failed",
  cancelled:          "Cancelled",
  refunded:           "Refunded",
  partially_refunded: "Partially Refunded",
};

export const PAYMENT_STATUS_COLOR: Record<
  PaymentStatus,
  { bg: string; text: string }
> = {
  pending:            { bg: "bg-gold/20",     text: "text-charcoal" },
  processing:         { bg: "bg-navy/10",     text: "text-navy" },
  paid:               { bg: "bg-success/15",  text: "text-success" },
  failed:             { bg: "bg-error/15",    text: "text-error" },
  cancelled:          { bg: "bg-charcoal/10", text: "text-muted" },
  refunded:           { bg: "bg-border",      text: "text-muted" },
  partially_refunded: { bg: "bg-gold/10",     text: "text-gold" },
};
