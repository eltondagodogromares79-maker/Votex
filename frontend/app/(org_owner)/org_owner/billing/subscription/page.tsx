"use client";

import { useState } from "react";
import Link from "next/link";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import { Button } from "@/src/components/ui/Button";
import { ConfirmModal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { useCancelSubscription, usePaymentProofHistory, useSubscription, useSubscriptionUsage } from "@/src/features/org_owner/hooks/useSubscription";

function formatAmount(amount: string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${currency} ${amount}`;
  return new Intl.NumberFormat("en-PH", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Not set";
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? "Not set" : value.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function UsageBar({ label, used, limit, hasPlan = true }: { label: string; used: number; limit: number | null; hasPlan?: boolean }) {
  const pct = limit == null || limit <= 0 ? 0 : Math.min((used / limit) * 100, 100);
  const isHigh = limit != null && pct >= 80;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-small font-medium text-charcoal">{label}</p>
        <p className="text-caption font-semibold tabular-nums text-charcoal">
          {used} <span className="font-normal text-muted">/ {!hasPlan ? "No plan" : limit == null ? "Unlimited" : limit}</span>
        </p>
      </div>
      <div className="h-2 overflow-hidden bg-border">
        <div className={`h-full transition-all ${isHigh ? "bg-error" : "bg-navy"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-caption text-muted">{!hasPlan ? "An active plan is required to create more resources." : limit == null ? "No plan cap" : `${Math.round(pct)}% of plan limit used`}</p>
    </div>
  );
}

export default function SubscriptionPage() {
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";
  const subscriptionQuery = useSubscription(orgId);
  const usageQuery = useSubscriptionUsage(orgId);
  const proofHistoryQuery = usePaymentProofHistory(orgId);
  const cancelSubscription = useCancelSubscription(orgId);
  const { toast } = useToast();
  const [showCancel, setShowCancel] = useState(false);
  const subscription = subscriptionQuery.data;
  const usage = usageQuery.data;
  const isLoading = subscriptionQuery.isLoading || usageQuery.isLoading;
  const queryError = subscriptionQuery.isError || usageQuery.isError;
  const badgeVariant = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING" ? "success"
    : subscription?.status === "PAST_DUE" ? "warning"
    : subscription?.status === "PAUSED" ? "gold" : "muted";
  const canCancel = !!subscription && ["TRIALING", "ACTIVE", "PAST_DUE", "PAUSED"].includes(subscription.status);

  async function onCancelSubscription() {
    if (!subscription) return;
    try {
      await cancelSubscription.mutateAsync(subscription.id);
      setShowCancel(false);
      toast.success("Subscription canceled.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : "Could not cancel the subscription.");
    }
  }

  return (
    <OrgPageShell
      title="My Subscription"
      subtitle="View your current plan and live usage against its limits."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Billing", href: "/org_owner/billing" },
        { label: "My Subscription" },
      ]}
    >
      <div className="max-w-full space-y-6">
        {isLoading ? (
          <div className="h-48 animate-pulse border border-border bg-surface" />
        ) : queryError ? (
          <div className="border border-error/25 bg-surface p-5 text-small text-error">Could not load subscription usage. Refresh the page to try again.</div>
        ) : (
          <>
            <section className="overflow-hidden bg-navy">
              <div className="flex flex-col justify-between gap-5 px-6 py-6 sm:flex-row sm:items-start">
                <div>
                  <p className="mb-1 text-caption font-semibold uppercase tracking-[0.16em] text-gold/70">Current Plan</p>
                  <h2 className="font-serif text-[2rem] font-bold leading-tight text-white">{subscription?.planName ?? "No active plan"}</h2>
                  <p className="mt-2 text-small text-white/55">
                    {subscription ? `${formatAmount(subscription.priceAmount, subscription.currency)} · Started ${formatDate(subscription.startsAt)}` : "Choose a plan to create pageants and manage event resources."}
                  </p>
                </div>
                <OrgBadge variant={badgeVariant}>{subscription?.status.replaceAll("_", " ") ?? "No subscription"}</OrgBadge>
              </div>
              {subscription && <div className="grid grid-cols-1 gap-4 border-t border-white/10 px-6 py-4 sm:grid-cols-3">
                <div><p className="text-caption text-white/40">Plan code</p><p className="mt-0.5 text-small font-semibold text-white">{subscription.planCode}</p></div>
                <div><p className="text-caption text-white/40">Access started</p><p className="mt-0.5 text-small font-semibold text-white">{formatDate(subscription.startsAt)}</p></div>
                <div><p className="text-caption text-white/40">Access ends</p><p className="mt-0.5 text-small font-semibold text-white">{formatDate(subscription.endsAt)}</p></div>
              </div>}
            </section>

            <section className="overflow-hidden border border-border bg-surface">
              <div className="border-b border-border px-6 py-4">
                <h2 className="font-serif text-h3 font-semibold text-charcoal">Plan Usage</h2>
                <p className="mt-0.5 text-small text-muted">Live counts compared with the limits on your current plan.</p>
              </div>
              <div className="grid gap-6 p-6 lg:grid-cols-2">
                <UsageBar label="Pageants across organization" used={usage?.pageantsUsed ?? 0} limit={usage?.maxPageants ?? null} hasPlan={!!usage?.planName} />
                <UsageBar label="Unique tabulator users" used={usage?.tabulatorUsersUsed ?? 0} limit={usage?.maxTabulatorUsers ?? null} hasPlan={!!usage?.planName} />
              </div>
              <div className="border-t border-border px-6 py-5">
                <h3 className="text-small font-semibold text-charcoal">Per pageant limits</h3>
                {usage?.pageants.length ? (
                  <div className="mt-4 divide-y divide-border">
                    {usage.pageants.map((pageant) => (
                      <div key={pageant.pageantId} className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_repeat(2,minmax(120px,1fr))] sm:items-center">
                        <p className="truncate text-small font-semibold text-charcoal" title={pageant.pageantName}>{pageant.pageantName}</p>
                        <UsageBar label="Judges" used={pageant.judgesUsed} limit={usage.maxJudgesPerPageant} hasPlan={!!usage.planName} />
                        <UsageBar label="Rounds" used={pageant.roundsUsed} limit={usage.maxRoundsPerPageant} hasPlan={!!usage.planName} />
                        <div className="border border-border px-3 py-2.5">
                          <p className="text-caption text-muted">Categories across rounds</p>
                          <p className="mt-1 text-small font-semibold text-charcoal">{pageant.categoriesUsed} active</p>
                          <p className="mt-0.5 text-[11px] text-muted">Limit: {!usage.planName ? "no active plan" : usage.maxCategoriesPerRound ?? "unlimited"} per round</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-small text-muted">No non-archived pageants yet. Create one to see its judge, round, and category usage.</p>
                )}
              </div>
            </section>

            <section className="overflow-hidden border border-border bg-surface">
              <div className="border-b border-border px-6 py-4">
                <h2 className="font-serif text-h3 font-semibold text-charcoal">Payment review history</h2>
                <p className="mt-0.5 text-small text-muted">See the decision on each submitted payment proof and any reason provided by the admin.</p>
              </div>
              {proofHistoryQuery.isLoading ? (
                <div className="h-24 animate-pulse bg-slate/20" />
              ) : proofHistoryQuery.isError ? (
                <p className="px-6 py-5 text-small text-error">Could not load payment review history.</p>
              ) : proofHistoryQuery.data?.length ? (
                <div className="divide-y divide-border">
                  {proofHistoryQuery.data.map((proof) => {
                    const rejected = proof.status === "REJECTED";
                    const revoked = proof.status === "REVOKED";
                    const stateClass = rejected || revoked
                      ? "border-error/25 bg-error/8 text-error"
                      : proof.status === "APPROVED"
                        ? "border-success/25 bg-success/8 text-success"
                        : "border-warning/25 bg-warning/8 text-warning";
                    const reason = revoked ? proof.revocationNote : rejected ? proof.reviewNote : null;
                    const reviewedAt = revoked ? proof.revokedAt : proof.reviewedAt;
                    return (
                      <article key={proof.id} className="px-6 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-small font-semibold text-charcoal">{proof.planName} · {formatAmount(proof.amountPaid, proof.currency)}</p>
                            <p className="mt-0.5 text-caption text-muted">Submitted {new Date(proof.submittedAt).toLocaleString("en-PH")}</p>
                          </div>
                          <span className={`inline-flex border px-2.5 py-1 text-caption font-semibold ${stateClass}`}>
                            {proof.status.charAt(0) + proof.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                        {reason && (
                          <div className={`mt-3 border-l-2 px-3 py-2 ${revoked ? "border-error bg-error/5" : "border-error bg-error/5"}`}>
                            <p className="text-caption font-semibold text-error">{revoked ? "Reason for revocation" : "Rejection reason"}</p>
                            <p className="mt-0.5 whitespace-pre-wrap text-small text-charcoal">{reason}</p>
                          </div>
                        )}
                        {(rejected || revoked) && !reason && (
                          <p className="mt-2 text-caption text-muted">The admin did not include a reason.</p>
                        )}
                        {reviewedAt && <p className="mt-2 text-caption text-muted">Reviewed {new Date(reviewedAt).toLocaleString("en-PH")}</p>}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="px-6 py-5 text-small text-muted">No payment proofs have been submitted yet.</p>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface p-5">
              <div><p className="text-small font-semibold text-charcoal">Need more capacity?</p><p className="mt-0.5 text-caption text-muted">Compare plans and choose the plan that fits your organization.</p></div>
              <Link href="/org_owner/billing/plans" className="inline-flex h-9 items-center bg-navy px-4 text-small font-semibold text-white hover:bg-navy/90">View plans</Link>
            </div>
            {canCancel && <section className="flex flex-col gap-4 border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-small font-semibold text-charcoal">Cancel subscription</p>
                <p className="mt-1 text-caption text-muted">{usage?.hasCreatedPageant ? "This organization has created a pageant, so its subscription can no longer be canceled." : "You can cancel while your organization has never created a pageant."}</p>
              </div>
              <Button variant="danger" size="sm" disabled={usageQuery.isLoading || usage?.hasCreatedPageant !== false} onClick={() => setShowCancel(true)}>
                Cancel Subscription
              </Button>
            </section>}
          </>
        )}
      </div>
      <ConfirmModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={onCancelSubscription}
        title="Cancel subscription"
        description="Cancel this organization subscription? You will need to subscribe again before creating pageants."
        confirmLabel="Cancel Subscription"
        loading={cancelSubscription.isPending}
        destructive
      />
    </OrgPageShell>
  );
}
