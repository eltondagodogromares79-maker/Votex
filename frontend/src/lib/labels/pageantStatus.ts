/**
 * Labels and color classes for PageantStatus.
 *
 * Source: backend domain model src/domain/models/pageants.rs — PageantStatus
 * Variants (snake_case): draft | configuring | ready | live | paused | completed | archived
 */

import type { PageantStatus } from "@/src/types";

export const PAGEANT_STATUS_LABEL: Record<PageantStatus, string> = {
  draft:       "Draft",
  configuring: "Configuring",
  ready:       "Ready",
  live:        "Live",
  paused:      "Paused",
  completed:   "Completed",
  archived:    "Archived",
};

export const PAGEANT_STATUS_COLOR: Record<
  PageantStatus,
  { bg: string; text: string }
> = {
  draft:       { bg: "bg-border",      text: "text-muted" },
  configuring: { bg: "bg-gold/10",     text: "text-gold" },
  ready:       { bg: "bg-navy/10",     text: "text-navy" },
  live:        { bg: "bg-success/15",  text: "text-success" },
  paused:      { bg: "bg-gold/20",     text: "text-charcoal" },
  completed:   { bg: "bg-charcoal/10", text: "text-charcoal" },
  archived:    { bg: "bg-border",      text: "text-muted" },
};
