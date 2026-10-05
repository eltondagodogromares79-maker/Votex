"use client";

/**
 * Admin Payments page — placeholder.
 *
 * The admin payment review endpoints (GET /billing/requests,
 * POST /billing/admin/requests/:id/review) are NOT yet implemented in the
 * Rust backend. The old PaymentRequestResponse / PaymentRequestStatus types
 * referenced here do not exist in the real backend schema.
 *
 * This page is kept as a shell so the route compiles.
 */

import { PageShell } from "@/src/components/layout/PageShell";
import { EmptyState, ListEmptyIcon } from "@/src/components/ui/EmptyState";

export default function AdminPaymentsPage() {
  return (
    <PageShell
      title="Payment Requests"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Payments" }]}
    >
      <EmptyState
        icon={<ListEmptyIcon />}
        heading="Payment management coming soon"
        description="The billing API is not yet implemented in the backend. This page will be connected when the endpoints are available."
      />
    </PageShell>
  );
}
