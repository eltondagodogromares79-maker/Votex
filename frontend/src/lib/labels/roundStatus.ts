/**
 * Labels and color classes for RoundStatus.
 *
 * Source: backend/portals/coordinator/src/domain/round.rs.
 */

import type { RoundStatus } from "@/src/types";

export const ROUND_STATUS_LABEL: Record<RoundStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
  FINALIZED: "Finalized",
};

export const ROUND_STATUS_COLOR: Record<
  RoundStatus,
  { bg: string; text: string }
> = {
  DRAFT: { bg: "bg-border", text: "text-muted" },
  OPEN: { bg: "bg-gold/20", text: "text-charcoal" },
  CLOSED: { bg: "bg-charcoal/10", text: "text-charcoal" },
  FINALIZED: { bg: "bg-success/15", text: "text-success" },
};
