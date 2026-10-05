/**
 * General utility helpers.
 */

/**
 * Format a number as Philippine Peso using the browser's Intl API.
 * Always use this — never concatenate a ₱ sign manually.
 *
 * @example formatPeso(449) → "₱449.00"
 */
export function formatPeso(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

/**
 * Combine class names, filtering out falsy values.
 * Lightweight alternative to clsx for simple cases.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a date string (RFC3339 or ISO) to a human-readable date.
 * @example formatDate("2025-06-15T00:00:00Z") → "June 15, 2025"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr));
}

/**
 * Format a date string to a shorter display.
 * @example formatDateShort("2025-06-15") → "Jun 15, 2025"
 */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

/**
 * Format a datetime string to date + time.
 * @example formatDateTime("2025-06-15T14:30:00Z") → "Jun 15, 2025, 10:30 PM"
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

/**
 * Truncate a string to a maximum length, adding "…" if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/**
 * Generate initials from a full name (up to 2 characters).
 * @example getInitials("Juan dela Cruz") → "JD"
 */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
