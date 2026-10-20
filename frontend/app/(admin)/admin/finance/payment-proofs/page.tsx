"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { adminApi } from "@/src/features/admin/api/admin";
import type { SubscriptionPaymentProof } from "@/src/types";

function ProofCard({
  proof,
  note,
  onNoteChange,
  onReview,
  isReviewing,
  view,
  onRevoke,
}: {
  proof: SubscriptionPaymentProof;
  note: string;
  onNoteChange: (value: string) => void;
  onReview: (approved: boolean) => void;
  isReviewing: boolean;
  view: "pending" | "history";
  onRevoke: () => void;
}) {
  return (
    <article className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] bg-surface border border-border overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-small font-bold text-charcoal">{proof.organizationName}</h2>
            <p className="text-caption text-muted mt-1">{proof.planName} · {proof.currency} {Number(proof.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
          </div>
          <span className={`inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border ${proof.status === "PENDING" ? "border-gold/30 text-gold bg-gold/10" : proof.status === "APPROVED" ? "border-success/25 text-success bg-success/8" : proof.status === "REVOKED" ? "border-error/30 text-error bg-error/8" : "border-border text-muted bg-border/30"}`}>{proof.status === "PENDING" ? "Awaiting review" : proof.status}</span>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-5">
          <div><dt className="text-caption text-muted">Payment method</dt><dd className="text-small font-medium text-charcoal mt-0.5">{proof.paymentMethod}</dd></div>
          <div><dt className="text-caption text-muted">Reference number</dt><dd className="text-small font-medium text-charcoal mt-0.5 font-mono">{proof.referenceNumber}</dd></div>
          <div><dt className="text-caption text-muted">Amount paid</dt><dd className="text-small font-medium text-charcoal mt-0.5">{proof.currency} {Number(proof.amountPaid).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</dd></div>
          <div><dt className="text-caption text-muted">Submitted</dt><dd className="text-small text-charcoal mt-0.5">{new Date(proof.submittedAt).toLocaleString("en-PH")}</dd></div>
          <div><dt className="text-caption text-muted">Organization ID</dt><dd className="text-caption text-muted mt-0.5 font-mono break-all">{proof.organizationId}</dd></div>
        </dl>

        {proof.reviewNote && <p className="mt-4 border-l-2 border-border pl-3 text-caption text-muted">Review note: {proof.reviewNote}</p>}
        {proof.revocationNote && <p className="mt-3 border-l-2 border-error pl-3 text-caption text-error">Revocation reason: {proof.revocationNote}</p>}

        <div className="mt-5">
          <label htmlFor={`review-note-${proof.id}`} className="block text-caption font-medium text-charcoal mb-1.5">Review note (optional)</label>
          <textarea id={`review-note-${proof.id}`} rows={2} maxLength={1000} value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Add a note for the organization, especially if rejecting the proof." className="w-full px-3 py-2 bg-white border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy resize-y" />
        </div>
        <div className="flex gap-2 mt-4">
          {proof.status === "PENDING" && view === "pending" && <>
            <Button variant="secondary" size="sm" loading={isReviewing} onClick={() => onReview(true)}>Approve payment</Button>
            <Button variant="danger" size="sm" disabled={isReviewing} onClick={() => onReview(false)}>Reject proof</Button>
          </>}
          {proof.status === "APPROVED" && <Button variant="danger" size="sm" disabled={isReviewing} onClick={onRevoke}>Revoke approval</Button>}
          {proof.status === "REVOKED" && proof.revocationNote && <span className="self-center text-caption text-error">Revoked: {proof.revocationNote}</span>}
        </div>
      </div>

      {proof.proofUrl ? (
        <a href={proof.proofUrl} target="_blank" rel="noreferrer" className="block bg-slate/30 min-h-56 lg:min-h-full border-t lg:border-t-0 lg:border-l border-border">
          <img src={proof.proofUrl} alt={`Payment receipt from ${proof.organizationName}`} className="w-full h-full max-h-[420px] object-contain" />
          <span className="sr-only">Open full receipt image in a new tab</span>
        </a>
      ) : (
        <div className="flex min-h-32 items-center justify-center border-t border-border bg-slate/30 text-caption text-muted lg:min-h-full lg:border-l lg:border-t-0">No receipt image attached</div>
      )}
    </article>
  );
}

export default function PaymentProofsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [view, setView] = useState<"pending" | "history">("pending");
  const proofsQuery = useQuery({
    queryKey: ["admin", "subscription-payment-proofs", view],
    queryFn: view === "pending" ? adminApi.listPendingSubscriptionPaymentProofs : adminApi.listSubscriptionPaymentProofHistory,
  });
  const reviewMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      adminApi.reviewSubscriptionPaymentProof(id, { approved, note: notes[id]?.trim() || null }),
    onSuccess: (_proof, variables) => {
      toast.success(variables.approved ? "Payment approved and subscription activated." : "Payment proof rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subscription-payment-proofs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.userMessage : "Could not review this payment proof."),
  });
  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.revokeSubscriptionPaymentApproval(id, { reason }),
    onSuccess: () => {
      toast.success("Approval revoked and the active subscription cancelled.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subscription-payment-proofs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.userMessage : "Could not revoke this approval."),
  });

  return (
    <AdminPageShell
      title="Payment Proofs"
      subtitle="Approve or reject submitted proofs, then review payment history and revoke an approval if needed. Revocation cancels the subscription; it does not process a refund."
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Finance" }, { label: "Payment Proofs" }]}
    >
      <div className="mb-5 flex gap-2">
        <Button variant={view === "pending" ? "secondary" : "ghost"} size="sm" onClick={() => setView("pending")}>Pending review</Button>
        <Button variant={view === "history" ? "secondary" : "ghost"} size="sm" onClick={() => setView("history")}>Payment history</Button>
      </div>
      {proofsQuery.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((key) => <div key={key} className="h-64 bg-surface border border-border animate-pulse" />)}</div>
      ) : proofsQuery.isError ? (
        <div className="bg-surface border border-error/30 p-5 text-small text-error">Could not load payment proofs. Refresh and try again.</div>
      ) : proofsQuery.data?.length ? (
        <div className="space-y-4">
          <p className="text-caption text-muted">{view === "pending" ? `${proofsQuery.data.length} payment${proofsQuery.data.length === 1 ? "" : "s"} awaiting review` : `${proofsQuery.data.length} payment records`}</p>
          {proofsQuery.data.map((proof) => (
            <ProofCard
              key={proof.id}
              proof={proof}
              note={notes[proof.id] ?? ""}
              onNoteChange={(value) => setNotes((current) => ({ ...current, [proof.id]: value }))}
              onReview={(approved) => reviewMutation.mutate({ id: proof.id, approved })}
              view={view}
              onRevoke={() => {
                const reason = window.prompt("Why are you revoking this approval? The subscription will be cancelled. The recorded payment will not be marked as refunded.");
                if (reason?.trim()) revokeMutation.mutate({ id: proof.id, reason: reason.trim() });
              }}
              isReviewing={(reviewMutation.isPending && reviewMutation.variables?.id === proof.id) || (revokeMutation.isPending && revokeMutation.variables?.id === proof.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border px-5 py-10 text-center">
          <p className="text-small font-semibold text-charcoal">{view === "pending" ? "No payment proofs to review" : "No payment history yet"}</p>
          <p className="text-caption text-muted mt-1">{view === "pending" ? "Proofs appear here after an organization submits a receipt. Subscription requests waiting for proof are listed separately." : "Submitted proofs and their review actions will appear here."}</p>
          {view === "pending" && <Link href="/admin/finance/subscriptions" className="mt-3 inline-block text-small font-semibold text-navy underline underline-offset-2">View pending subscription requests</Link>}
        </div>
      )}
    </AdminPageShell>
  );
}
