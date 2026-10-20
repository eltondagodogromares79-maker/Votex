"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { adminApi } from "@/src/features/admin/api/admin";

const inputClass = "w-full max-w-2xl border border-border bg-surface px-3 py-2 text-small text-charcoal focus:outline-none focus:border-navy";

function money(amount: string, currency: string) {
  return `${currency} ${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function statusStyle(status: string) {
  const key = status.toUpperCase();
  if (["ACTIVE", "APPROVED", "COMPLETED"].includes(key)) return "border-success/30 bg-success/10 text-success";
  if (["PENDING", "PENDING_PAYMENT"].includes(key)) return "border-warning/30 bg-warning/10 text-warning";
  if (["CANCELLED", "REJECTED", "REVOKED", "FAILED"].includes(key)) return "border-error/30 bg-error/10 text-error";
  return "border-white/20 bg-white/10 text-white/80";
}

export default function AdminSubscriptionDetailsPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = use(params);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewNote, setReviewNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const detailKey = ["admin", "subscription-details", organizationId] as const;
  const detailsQuery = useQuery({ queryKey: detailKey, queryFn: () => adminApi.getAdminSubscriptionDetails(organizationId) });
  const refreshDetails = () => {
    queryClient.invalidateQueries({ queryKey: detailKey });
    queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "transaction-logs"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "subscription-payment-proofs"] });
  };
  const reviewMutation = useMutation({
    mutationFn: ({ proofId, approved }: { proofId: string; approved: boolean }) => adminApi.reviewSubscriptionPaymentProof(proofId, { approved, note: reviewNote.trim() || null }),
    onSuccess: (_proof, vars) => { toast.success(vars.approved ? "Payment approved and subscription activated." : "Proof rejected."); refreshDetails(); },
    onError: (error) => toast.error(error instanceof ApiError ? error.userMessage : "Could not review this payment."),
  });
  const cancelMutation = useMutation({
    mutationFn: ({ subscriptionId, reason }: { subscriptionId: string; reason: string }) => adminApi.cancelAdminSubscription(subscriptionId, reason),
    onSuccess: () => { toast.success("Subscription cancelled."); setCancelReason(""); refreshDetails(); },
    onError: (error) => toast.error(error instanceof ApiError ? error.userMessage : "Could not cancel this subscription."),
  });
  const revokeMutation = useMutation({
    mutationFn: ({ proofId, reason }: { proofId: string; reason: string }) => adminApi.revokeSubscriptionPaymentApproval(proofId, { reason }),
    onSuccess: () => { toast.success("Approval revoked and subscription cancelled."); setRevokeReason(""); refreshDetails(); },
    onError: (error) => toast.error(error instanceof ApiError ? error.userMessage : "Could not revoke this approval."),
  });
  const details = detailsQuery.data;
  const subscription = details?.subscription;
  const canCancel = !!subscription && !["CANCELLED", "EXPIRED"].includes(subscription.status.toUpperCase());
  const proof = details?.proof;

  return (
    <AdminPageShell
      title="Subscription Details"
      subtitle="Review the organization, subscription, payment proof, and administrative actions."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Finance" },
        { label: "Subscriptions", href: "/admin/finance/subscriptions" },
        { label: "Details" },
      ]}
    >
      <div className="mb-5"><Link href="/admin/finance/subscriptions" className="text-small font-medium text-navy underline underline-offset-2">← Back to subscriptions</Link></div>
      {detailsQuery.isLoading ? <div className="h-48 animate-pulse border border-border bg-surface" /> : detailsQuery.isError || !details ? (
        <div className="border border-error/30 bg-surface p-5 text-small text-error">Could not load subscription details.</div>
      ) : (
        <div className="space-y-5">
          <section className="relative overflow-hidden border border-navy bg-navy p-5 text-white shadow-sm sm:p-7">
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -right-4 -top-8 h-32 w-32 rounded-full border border-white/10" />
            <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="min-w-0">
                <p className="text-caption font-semibold uppercase tracking-[0.16em] text-white/45">Organization subscription</p>
                <h2 className="mt-2 truncate font-serif text-2xl font-bold text-white sm:text-3xl">{details.organizationName}</h2>
                <p className="mt-1 text-small text-white/55">{details.ownerFirstName} {details.ownerLastName} · {details.ownerEmail}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {subscription ? <span className={`inline-flex border px-2.5 py-1 text-caption font-bold uppercase tracking-wide ${statusStyle(subscription.status)}`}>{subscription.status.replaceAll("_", " ")}</span> : <span className="inline-flex border border-white/20 bg-white/10 px-2.5 py-1 text-caption font-bold uppercase tracking-wide text-white/70">No subscription</span>}
                {proof && <span className={`inline-flex border px-2.5 py-1 text-caption font-bold uppercase tracking-wide ${statusStyle(proof.status)}`}>Proof {proof.status}</span>}
              </div>
            </div>
            {subscription && <div className="relative mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4">
              <div><p className="text-caption text-white/45">Current plan</p><p className="mt-0.5 text-h3 font-semibold text-gold">{subscription.planName}</p></div>
              <div className="text-left sm:text-right"><p className="text-caption text-white/45">Plan price</p><p className="mt-0.5 text-xl font-bold tabular-nums text-white">{money(subscription.priceAmount, subscription.currency)}</p></div>
            </div>}
          </section>

          <section className="border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-serif text-h3 font-semibold text-charcoal">Organization and subscriber</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-caption text-muted">Organization</dt><dd className="mt-0.5 text-small font-semibold text-charcoal">{details.organizationName}</dd><dd className="text-caption text-muted">/{details.organizationSlug}</dd></div>
              <div><dt className="text-caption text-muted">Owner / subscriber</dt><dd className="mt-0.5 text-small font-semibold text-charcoal">{details.ownerFirstName} {details.ownerLastName}</dd><dd className="text-caption text-muted">{details.ownerEmail}</dd><dd className="mt-1 text-[11px] font-mono text-muted">User ID: {details.ownerUserId}</dd></div>
            </dl>
          </section>

          <section className="border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-serif text-h3 font-semibold text-charcoal">Subscription</h2>
            {subscription ? (
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-caption text-muted">Plan</dt><dd className="mt-0.5 text-small font-semibold text-charcoal">{subscription.planName}</dd><dd className="text-caption text-muted">{subscription.planCode}</dd></div>
                <div><dt className="text-caption text-muted">Status</dt><dd className="mt-1"><span className="inline-flex border border-border bg-slate/40 px-2 py-1 text-caption font-semibold">{subscription.status.replaceAll("_", " ")}</span></dd></div>
                <div><dt className="text-caption text-muted">Price</dt><dd className="mt-0.5 text-small font-semibold text-charcoal">{money(subscription.priceAmount, subscription.currency)}</dd></div>
                <div><dt className="text-caption text-muted">Requested</dt><dd className="mt-0.5 text-small text-charcoal">{new Date(subscription.createdAt).toLocaleString("en-PH")}</dd></div>
                <div><dt className="text-caption text-muted">Started</dt><dd className="mt-0.5 text-small text-charcoal">{new Date(subscription.startsAt).toLocaleString("en-PH")}</dd></div>
                <div><dt className="text-caption text-muted">Ends</dt><dd className="mt-0.5 text-small text-charcoal">{subscription.endsAt ? new Date(subscription.endsAt).toLocaleString("en-PH") : "No scheduled end"}</dd></div>
              </dl>
            ) : <p className="mt-3 text-small text-muted">This organization has no subscription requests yet.</p>}
          </section>

          <section className="border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-serif text-h3 font-semibold text-charcoal">Payment</h2>
            {details.payment ? (
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-caption text-muted">Amount</dt><dd className="mt-0.5 text-small font-semibold text-charcoal">{money(details.payment.amount, details.payment.currency)}</dd></div>
                <div><dt className="text-caption text-muted">Payment status</dt><dd className="mt-0.5 text-small font-semibold text-charcoal">{details.payment.status}</dd></div>
                <div><dt className="text-caption text-muted">Method</dt><dd className="mt-0.5 text-small text-charcoal">{details.payment.paymentMethod ?? "Not submitted"}</dd></div>
                <div><dt className="text-caption text-muted">Reference number</dt><dd className="mt-0.5 break-all font-mono text-small text-charcoal">{details.payment.referenceNumber ?? "Not submitted"}</dd></div>
                <div><dt className="text-caption text-muted">Created</dt><dd className="mt-0.5 text-small text-charcoal">{new Date(details.payment.createdAt).toLocaleString("en-PH")}</dd></div>
                <div><dt className="text-caption text-muted">Paid / verified</dt><dd className="mt-0.5 text-small text-charcoal">{details.payment.paidAt ? new Date(details.payment.paidAt).toLocaleString("en-PH") : "Awaiting approval"}</dd></div>
              </dl>
            ) : <p className="mt-3 text-small text-muted">No payment transaction is associated with this subscription.</p>}
          </section>

          <section className="border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-serif text-h3 font-semibold text-charcoal">Payment proof</h2><p className="mt-1 text-caption text-muted">Receipt images are optional; the reference and amount are required.</p></div>
              {proof && <span className="border border-border bg-slate/40 px-2 py-1 text-caption font-semibold">{proof.status}</span>}
            </div>
            {proof ? (
              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div><dt className="text-caption text-muted">Amount paid</dt><dd className="mt-0.5 text-small font-semibold text-charcoal">{money(proof.amountPaid, proof.currency)}</dd></div>
                    <div><dt className="text-caption text-muted">Submitted</dt><dd className="mt-0.5 text-small text-charcoal">{new Date(proof.submittedAt).toLocaleString("en-PH")}</dd></div>
                    {proof.reviewedAt && <div><dt className="text-caption text-muted">Reviewed</dt><dd className="mt-0.5 text-small text-charcoal">{new Date(proof.reviewedAt).toLocaleString("en-PH")}</dd></div>}
                    {proof.reviewNote && <div><dt className="text-caption text-muted">Review note</dt><dd className="mt-0.5 text-small text-charcoal">{proof.reviewNote}</dd></div>}
                    {proof.revokedAt && <div><dt className="text-caption text-muted">Revoked</dt><dd className="mt-0.5 text-small text-charcoal">{new Date(proof.revokedAt).toLocaleString("en-PH")}</dd></div>}
                    {proof.revocationNote && <div><dt className="text-caption text-muted">Revocation reason</dt><dd className="mt-0.5 text-small text-error">{proof.revocationNote}</dd></div>}
                  </dl>
                  {proof.status === "PENDING" && (
                    <div className="mt-5 space-y-3">
                      <label className="block text-caption font-medium text-charcoal">Review note (required when rejecting)<textarea rows={2} maxLength={1000} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} className={`${inputClass} mt-1.5`} /></label>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ proofId: proof.id, approved: true })}>Approve payment</Button>
                        <Button variant="danger" size="sm" disabled={reviewMutation.isPending || !reviewNote.trim()} onClick={() => reviewMutation.mutate({ proofId: proof.id, approved: false })}>Reject proof</Button>
                      </div>
                    </div>
                  )}
                  {proof.status === "APPROVED" && canCancel && (
                    <div className="mt-5 space-y-3 border-t border-border pt-4">
                      <label className="block text-caption font-medium text-charcoal">Reason for revoking approval<textarea rows={2} maxLength={1000} required value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} className={`${inputClass} mt-1.5`} /></label>
                      <Button variant="danger" size="sm" disabled={!revokeReason.trim() || revokeMutation.isPending} loading={revokeMutation.isPending} onClick={() => revokeMutation.mutate({ proofId: proof.id, reason: revokeReason.trim() })}>Revoke approval and cancel subscription</Button>
                    </div>
                  )}
                </div>
                {proof.proofUrl ? <a href={proof.proofUrl} target="_blank" rel="noreferrer" className="block border border-border bg-slate/30 p-2"><img src={proof.proofUrl} alt="Submitted payment receipt" className="max-h-80 w-full object-contain" /><span className="mt-2 block text-center text-caption font-medium text-navy underline">View full proof</span></a> : <div className="flex min-h-36 items-center justify-center border border-dashed border-border text-caption text-muted">No receipt image attached</div>}
              </div>
            ) : <p className="mt-3 text-small text-muted">No proof has been submitted for this subscription yet.</p>}
          </section>

          {canCancel && (
            <section className="border border-error/30 bg-surface p-5 sm:p-6">
              <h2 className="font-serif text-h3 font-semibold text-error">Cancel subscription</h2>
              <p className="mt-1 text-caption text-muted">Cancellation removes the subscription entitlement. It does not process a refund.</p>
              <label className="mt-4 block text-caption font-medium text-charcoal">Reason<textarea rows={2} maxLength={1000} required value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className={`${inputClass} mt-1.5`} /></label>
              <Button variant="danger" size="sm" className="mt-3" disabled={!cancelReason.trim() || cancelMutation.isPending} loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate({ subscriptionId: subscription!.id, reason: cancelReason.trim() })}>Cancel subscription</Button>
            </section>
          )}

          <section className="border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-serif text-h3 font-semibold text-charcoal">Admin action history</h2>
            {details.actions.length ? <ul className="mt-4 space-y-3">{details.actions.map((action) => <li key={action.id} className="border-l-2 border-border pl-3"><p className="text-small font-semibold text-charcoal">{action.action.replaceAll("_", " ")} · {action.adminName}</p><p className="text-caption text-muted">{new Date(action.createdAt).toLocaleString("en-PH")}</p>{action.reason && <p className="mt-1 text-small text-charcoal">{action.reason}</p>}</li>)}</ul> : <p className="mt-3 text-small text-muted">No admin actions recorded yet.</p>}
          </section>
        </div>
      )}
    </AdminPageShell>
  );
}
