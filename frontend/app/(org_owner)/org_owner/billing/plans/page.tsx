"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { useSession } from "@/src/features/auth/context/SessionContext";
import {
  useAvailablePlans,
  useSubscribe,
  useSubscription,
  usePendingSubscriptionPayment,
  useSubmitSubscriptionPaymentProof,
  useSubscriptionPaymentMode,
  useCreateSubscriptionCheckout,
} from "@/src/features/org_owner/hooks/useSubscription";
import { ApiError, api } from "@/src/lib/api/client";
import type { AvailablePlan, ManualPaymentMethod, OrganizationSubscription } from "@/src/types";

const PAYMENT_DESTINATIONS: Record<ManualPaymentMethod, { label: string; name?: string; number?: string }> = {
  GCASH: { label: "GCash", name: process.env.NEXT_PUBLIC_GCASH_ACCOUNT_NAME, number: process.env.NEXT_PUBLIC_GCASH_NUMBER },
  MAYA: { label: "Maya", name: process.env.NEXT_PUBLIC_MAYA_ACCOUNT_NAME, number: process.env.NEXT_PUBLIC_MAYA_NUMBER },
  MARIBANK: { label: "MariBank", name: process.env.NEXT_PUBLIC_MARIBANK_ACCOUNT_NAME, number: process.env.NEXT_PUBLIC_MARIBANK_NUMBER },
};

function subscribeToCheckoutReturn(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getCheckoutReturnSnapshot() {
  return new URLSearchParams(window.location.search).get("checkout");
}

function getCheckoutReturnServerSnapshot() {
  return null;
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function limit(value: number | null): string {
  return value == null ? "Unlimited" : value.toLocaleString();
}

function formatPrice(plan: AvailablePlan): string {
  const amount = Number(plan.priceAmount);
  if (!Number.isFinite(amount)) return plan.priceAmount;

  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: plan.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${plan.currency} ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  }
}

function PlanCard({
  plan,
  isCurrent,
  isSubscribing,
  canSubscribe,
  paymentMode,
  onSubscribe,
}: {
  plan: AvailablePlan;
  isCurrent: boolean;
  isSubscribing: boolean;
  canSubscribe: boolean;
  paymentMode?: "MANUAL" | "AUTOMATED";
  onSubscribe: () => void;
}) {
  const kindLabels: Record<string, string> = {
    ONE_TIME: "One Time",
    PREMIUM: "Premium",
    CUSTOM: "Custom",
  };

  return (
    <article className="bg-surface border border-border flex flex-col overflow-hidden">
      <div className={`h-0.5 w-full ${isCurrent ? "bg-gold" : "bg-border"}`} />
      <div className="bg-navy px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h2 className="text-small font-bold text-white truncate">{plan.name}</h2>
            <p className="text-caption text-white/40 font-mono mt-0.5">{plan.code}</p>
          </div>
          <span className="inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border border-white/20 text-white/70 shrink-0">
            {kindLabels[plan.kind] ?? plan.kind}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif font-bold text-[2rem] text-gold leading-none tabular-nums">
            {formatPrice(plan)}
          </span>
        </div>
        {plan.billingIntervalMonths != null && (
          <p className="text-caption text-white/40 mt-1">
            every {plan.billingIntervalMonths} month{plan.billingIntervalMonths === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="px-5 py-4 flex-1 space-y-2">
        <p className="text-[9px] uppercase tracking-[0.12em] text-muted mb-2">Limits per org</p>
        <LimitRow label="Pageants" value={limit(plan.maxPageants)} />
        <LimitRow label="Tabulators" value={limit(plan.maxTabulatorUsers)} />

        <p className="text-[9px] uppercase tracking-[0.12em] text-muted mb-2 pt-2">Limits per pageant</p>
        <LimitRow label="Judges" value={limit(plan.maxJudgesPerPageant)} />
        <LimitRow label="Rounds" value={limit(plan.maxRoundsPerPageant)} />
        <LimitRow label="Categories / round" value={limit(plan.maxCategoriesPerRound)} />

        <p className="text-[9px] uppercase tracking-[0.12em] text-muted mb-2 pt-2">Features</p>
        <FeatureRow label="Public Voting" enabled={plan.publicVotingEnabled} />
        <FeatureRow label="Customization" enabled={plan.customizationEnabled} />
      </div>

      <div className="px-5 py-3 border-t border-border">
        {isCurrent ? (
          <Button variant="ghost" size="sm" fullWidth disabled>
            Current Plan
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            loading={isSubscribing}
            disabled={!canSubscribe}
            onClick={onSubscribe}
          >
            {isSubscribing ? "Processing…" : canSubscribe ? Number(plan.priceAmount) > 0 && paymentMode === "AUTOMATED" ? "Pay securely" : "Get this plan" : "Payment pending"}
          </Button>
        )}
      </div>
    </article>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 shrink-0 text-success/70"><CheckIcon /></span>
      <span className="text-caption text-muted">{label}</span>
      <span className="ml-auto text-caption font-medium text-charcoal">{value}</span>
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 shrink-0 ${enabled ? "text-success/70" : "text-error"}`}>
        {enabled ? <CheckIcon /> : <CrossIcon />}
      </span>
      <span className="text-caption text-muted">{label}</span>
      <span className={`ml-auto text-caption font-medium ${enabled ? "text-success/80" : "text-error"}`}>
        {enabled ? "Yes" : "No"}
      </span>
    </div>
  );
}

export default function PlansPage() {
  const { currentUser } = useSession();
  const { toast } = useToast();
  const checkoutReturn = useSyncExternalStore(
    subscribeToCheckoutReturn,
    getCheckoutReturnSnapshot,
    getCheckoutReturnServerSnapshot,
  );
  const [checkingCheckoutStatus, setCheckingCheckoutStatus] = useState(false);
  const [checkoutStatusMessage, setCheckoutStatusMessage] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<AvailablePlan | null>(null);
  const [autoCheckoutPlan, setAutoCheckoutPlan] = useState<AvailablePlan | null>(null);
  const [manualSubscription, setManualSubscription] = useState<OrganizationSubscription | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<ManualPaymentMethod>("GCASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    type: "processing" | "success" | "error";
    message: string;
    action?: "retry" | "verify" | "checkout";
  } | null>(null);
  const orgId = currentUser?.organizationId ?? "";
  const plansQuery = useAvailablePlans(orgId);
  const paymentModeQuery = useSubscriptionPaymentMode(orgId);
  const subscriptionQuery = useSubscription(orgId);
  const pendingPaymentQuery = usePendingSubscriptionPayment(orgId);
  const subscribeMutation = useSubscribe(orgId);
  const checkoutMutation = useCreateSubscriptionCheckout(orgId);
  const paymentMode = paymentModeQuery.data?.mode;
  const plans = plansQuery.data ?? [];
  const pendingPayment = pendingPaymentQuery.data;
  const activePaymentSubscription = manualSubscription ?? pendingPayment?.subscription ?? null;
  const paymentPlan = selectedPlan ?? (activePaymentSubscription ? plans.find((plan) => plan.id === activePaymentSubscription.planId) ?? null : null);
  const proofMutation = useSubmitSubscriptionPaymentProof(orgId, activePaymentSubscription?.id ?? "");
  const selectedDestination = PAYMENT_DESTINATIONS[paymentMethod];
  const hasDestination = Boolean(selectedDestination.name && selectedDestination.number);
  const currentPlanId = subscriptionQuery.data?.planId;
  const checkoutConfirmed = checkoutReturn === "success"
    && pendingPaymentQuery.isFetched
    && pendingPayment === null
    && subscriptionQuery.data?.status === "ACTIVE";

  async function checkCheckoutStatus() {
    setCheckingCheckoutStatus(true);
    setCheckoutStatusMessage(null);
    try {
      const [subscriptionResult, pendingResult] = await Promise.all([
        subscriptionQuery.refetch(),
        pendingPaymentQuery.refetch(),
      ]);
      if (subscriptionResult.data?.status === "ACTIVE" && pendingResult.data === null) {
        setCheckoutStatusMessage("Payment confirmed. Your subscription is active.");
      } else {
        setCheckoutStatusMessage("It is still pending. Wait for PayMongo to deliver the paid webhook, then check again.");
      }
    } catch {
      setCheckoutStatusMessage("Could not refresh payment status. Please try again.");
    } finally {
      setCheckingCheckoutStatus(false);
    }
  }

  async function uploadAndSubmitProof() {
    const planId = selectedPlan?.id ?? activePaymentSubscription?.planId;
    const expectedAmount = selectedPlan?.priceAmount ?? activePaymentSubscription?.priceAmount;
    const amount = Number(amountPaid);
    if (!planId || !expectedAmount || !referenceNumber.trim() || !Number.isFinite(amount) || amount <= 0) {
      setPaymentModalOpen(false);
      setSubmissionFeedback({ type: "error", message: "Enter a valid payment reference number and amount paid.", action: "retry" });
      return;
    }
    if (Math.round(amount * 100) !== Math.round(Number(expectedAmount) * 100)) {
      setPaymentModalOpen(false);
      setSubmissionFeedback({ type: "error", message: `Amount paid must match the plan price of ${expectedAmount}.`, action: "retry" });
      return;
    }
    if (proofFile && (!proofFile.type.startsWith("image/") || proofFile.size > 10 * 1024 * 1024)) {
      setPaymentModalOpen(false);
      setSubmissionFeedback({ type: "error", message: "Choose an image file that is no larger than 10 MB.", action: "retry" });
      return;
    }
    setPaymentModalOpen(false);
    setSubmissionFeedback({ type: "processing", message: "Submitting payment details. Keep this page open while we upload your proof and send it for review." });
    setUploadingProof(true);
    try {
      let proofUrl: string | undefined;
      if (proofFile) {
        const signatureResponse = await api.post<{ cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }>("/api/cloudinary/signature");
        const signature = signatureResponse.data;
        const form = new FormData();
        form.append("file", proofFile);
        form.append("api_key", signature.apiKey);
        form.append("timestamp", String(signature.timestamp));
        form.append("folder", signature.folder);
        form.append("signature", signature.signature);
        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: "POST", body: form });
        const uploaded = await uploadResponse.json();
        if (!uploadResponse.ok || typeof uploaded.secure_url !== "string") throw new Error(uploaded.error?.message ?? "The proof image could not be uploaded.");
        proofUrl = uploaded.secure_url;
      }

      if (selectedPlan) {
        await subscribeMutation.mutateAsync({
          planId: selectedPlan.id,
          paymentMethod,
          referenceNumber: referenceNumber.trim(),
          amountPaid: amount,
          proofUrl,
        });
      } else {
        await proofMutation.mutateAsync({ paymentMethod, referenceNumber: referenceNumber.trim(), amountPaid: amount, proofUrl });
      }
      setSelectedPlan(null);
      setManualSubscription(null);
      setReferenceNumber("");
      setAmountPaid("");
      setProofFile(null);
      setSubmissionFeedback({ type: "success", message: "Payment details submitted. Your subscription is pending until an administrator reviews them." });
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.userMessage : "";
      const needsEmailVerification = error instanceof ApiError && (
        error.code === "EMAIL_NOT_VERIFIED"
        || /email address has not been verified|verify your email before subscribing/i.test(errorMessage)
      );
      setSubmissionFeedback({
        type: "error",
        message: error instanceof ApiError
          ? error.userMessage
          : error instanceof Error ? error.message : "Could not submit your payment proof.",
        action: needsEmailVerification ? "verify" : "retry",
      });
    } finally {
      setUploadingProof(false);
    }
  }

  async function startAutomatedCheckout(plan: AvailablePlan) {
    setAutoCheckoutPlan(plan);
    setSubmissionFeedback({ type: "processing", message: "Creating your secure PayMongo checkout. You’ll be redirected as soon as it is ready." });
    try {
      const subscription = await subscribeMutation.mutateAsync({ planId: plan.id });
      if (!subscription.checkoutUrl) throw new Error("Secure checkout is not available yet. Retry in a moment or contact support.");
      const checkoutUrl = new URL(subscription.checkoutUrl);
      if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.paymongo.com") {
        throw new Error("The payment provider returned an invalid checkout link.");
      }
      window.location.assign(checkoutUrl.toString());
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.userMessage : error instanceof Error ? error.message : "Could not start secure checkout.";
      const needsEmailVerification = error instanceof ApiError && (error.code === "EMAIL_NOT_VERIFIED" || /email address has not been verified|verify your email before subscribing/i.test(errorMessage));
      setSubmissionFeedback({ type: "error", message: errorMessage, action: needsEmailVerification ? "verify" : "checkout" });
      void pendingPaymentQuery.refetch();
    }
  }

  async function retryPendingCheckout() {
    const subscriptionId = pendingPayment?.subscription.id;
    if (!subscriptionId) return;
    setSubmissionFeedback({ type: "processing", message: "Preparing your secure PayMongo checkout." });
    try {
      const subscription = await checkoutMutation.mutateAsync(subscriptionId);
      if (!subscription.checkoutUrl) throw new Error("Secure checkout is not available yet. Retry in a moment.");
      const checkoutUrl = new URL(subscription.checkoutUrl);
      if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.paymongo.com") {
        throw new Error("The payment provider returned an invalid checkout link.");
      }
      window.location.assign(checkoutUrl.toString());
    } catch (error) {
      setSubmissionFeedback({ type: "error", message: error instanceof ApiError ? error.userMessage : error instanceof Error ? error.message : "Could not open secure checkout.", action: "checkout" });
    }
  }

  async function subscribeTo(plan: AvailablePlan) {
    if (Number(plan.priceAmount) > 0 && paymentMode === "AUTOMATED") {
      await startAutomatedCheckout(plan);
      return;
    }
    if (Number(plan.priceAmount) > 0) {
      if (paymentModeQuery.isLoading || paymentModeQuery.isError || !paymentMode) {
        toast.error("Payment options are unavailable. Refresh the page and try again.");
        return;
      }
      setSubmissionFeedback(null);
      setSelectedPlan(plan);
      setManualSubscription(null);
      setReferenceNumber("");
      setAmountPaid(plan.priceAmount);
      setProofFile(null);
      setPaymentModalOpen(true);
      return;
    }
    try {
      const subscription = await subscribeMutation.mutateAsync({ planId: plan.id });
      if (subscription.checkoutUrl) {
        window.location.assign(subscription.checkoutUrl);
        return;
      }
      if (subscription.status === "PENDING_PAYMENT") {
        setSelectedPlan(null);
        setManualSubscription(subscription);
        setAmountPaid(subscription.priceAmount);
        setPaymentModalOpen(true);
        return;
      }
      toast.success(`You're now subscribed to ${plan.name}.`);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.userMessage
          : `Could not subscribe to ${plan.name}. Please try again.`,
      );
    }
  }

  return (
    <OrgPageShell
      title="Plans & Pricing"
      subtitle="Review the available plans and choose the one that fits your organization's needs."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Billing", href: "/org_owner/billing" },
        { label: "Plans & Pricing" },
      ]}
    >
      {checkoutReturn === "success" ? <div role="status" className="mb-6 flex flex-col gap-3 border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{checkoutConfirmed ? "Payment confirmed" : "PayMongo returned you to VoteX"}</p><p className="mt-1 text-sm text-emerald-800">{checkoutConfirmed ? "Your subscription is active." : "We’re confirming the payment securely. Your subscription activates after PayMongo’s signed confirmation is received."}</p>{checkoutStatusMessage ? <p className="mt-2 text-sm font-medium" aria-live="polite">{checkoutStatusMessage}</p> : null}</div>{!checkoutConfirmed ? <Button variant="secondary" size="sm" loading={checkingCheckoutStatus} disabled={checkingCheckoutStatus} onClick={() => void checkCheckoutStatus()}>{checkingCheckoutStatus ? "Checking…" : "Check status"}</Button> : null}</div> : null}
      {checkoutReturn === "cancelled" ? <div role="status" className="mb-6 border border-amber-200 bg-amber-50 px-5 py-4"><p className="text-sm font-semibold text-amber-900">Checkout was not completed</p><p className="mt-1 text-sm text-amber-800">Your payment remains pending. Continue the secure checkout below when you’re ready.</p></div> : null}
      {paymentModeQuery.isError ? <div role="alert" className="mb-6 border border-error/25 bg-error/5 px-4 py-3 text-sm text-error">Payment options could not be loaded. Refresh this page before subscribing.</div> : null}
      {submissionFeedback && (
        <div
          role={submissionFeedback.type === "error" ? "alert" : "status"}
          className={`mb-6 flex items-start gap-3 border px-5 py-4 sm:py-5 ${
            submissionFeedback.type === "processing"
              ? "border-navy border-l-4 border-l-gold bg-navy text-white shadow-lg"
              : submissionFeedback.type === "success"
                ? "border-success/30 bg-success/10 text-success"
                : "border-error/30 bg-error/10 text-error"
          }`}
        >
          {submissionFeedback.type === "processing" ? (
            <span aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-gold" />
          ) : (
            <span aria-hidden="true" className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-sm font-bold">
              {submissionFeedback.type === "success" ? "✓" : "!"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {submissionFeedback.type === "processing" ? "Processing payment" : submissionFeedback.type === "success" ? "Payment submitted" : submissionFeedback.action === "verify" ? "Verify your account to continue" : "Could not submit payment"}
            </p>
            <p className={`mt-1 text-sm leading-relaxed ${submissionFeedback.type === "processing" ? "text-white/80" : "opacity-85"}`}>{submissionFeedback.message}</p>
            {submissionFeedback.type === "error" && submissionFeedback.action === "verify" && (
              <Link href="/org_owner/settings/accounts#email-verification" className="mt-3 inline-flex min-h-9 items-center bg-error px-3.5 text-xs font-semibold text-white transition-colors hover:bg-error/90">
                Verify my account
              </Link>
            )}
          {submissionFeedback.type === "error" && submissionFeedback.action !== "verify" && (
                submissionFeedback.action === "checkout" ? (
                  <button type="button" onClick={() => { if (pendingPayment?.subscription.id) void retryPendingCheckout(); else if (autoCheckoutPlan) void startAutomatedCheckout(autoCheckoutPlan); }} className="mt-2 text-xs font-semibold underline underline-offset-2">
                    Retry secure checkout
                  </button>
                ) : (
                  <button type="button" onClick={() => setPaymentModalOpen(true)} className="mt-2 text-xs font-semibold underline underline-offset-2">
                    Reopen payment details
                  </button>
                )
            )}
          </div>
          {submissionFeedback.type !== "processing" && (
            <button type="button" aria-label="Dismiss payment status" onClick={() => setSubmissionFeedback(null)} className="shrink-0 px-1 text-lg leading-none opacity-60 hover:opacity-100">×</button>
          )}
        </div>
      )}

      {plansQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-label="Loading plans">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-80 bg-surface border border-border animate-pulse" />
          ))}
        </div>
      ) : plansQuery.isError ? (
        <div className="bg-surface border border-error/30 px-5 py-4">
          <p className="text-small font-semibold text-error">Could not load plans</p>
          <p className="text-caption text-muted mt-1">Please refresh the page and try again.</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-surface border border-border px-5 py-8 text-center">
          <p className="text-small font-semibold text-charcoal">No plans are currently available</p>
          <p className="text-caption text-muted mt-1">Please check back later or contact your platform administrator.</p>
        </div>
      ) : (
        <>
          {pendingPayment && (
            <div className="mb-6 bg-gold/10 border border-gold/30 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-small font-semibold text-charcoal">
                  {pendingPayment.subscription.planName} subscription payment pending
                </p>
                <p className="text-caption text-muted mt-1">
                  {pendingPayment.latestProof?.status === "PENDING"
                    ? "Your proof has been submitted and is being reviewed by an administrator."
                    : pendingPayment.latestProof?.status === "REJECTED"
                      ? `The last proof was rejected${pendingPayment.latestProof.reviewNote ? `: ${pendingPayment.latestProof.reviewNote}` : ". Submit a new proof to try again."}`
                      : "Finish payment through PayMongo. VoteX activates the subscription after PayMongo confirms it."}
                </p>
              </div>
              {!pendingPayment.latestProof ? pendingPayment.subscription.checkoutUrl ? (
                <a href={pendingPayment.subscription.checkoutUrl} className="inline-flex min-h-10 items-center justify-center border border-navy bg-navy px-4 text-xs font-semibold text-white transition hover:bg-navy/90">Continue secure checkout</a>
              ) : (
                <Button variant="secondary" size="sm" loading={checkoutMutation.isPending} onClick={() => void retryPendingCheckout()}>Retry checkout</Button>
              ) : pendingPayment.latestProof?.status !== "PENDING" && (
                <Button variant="secondary" size="sm" onClick={() => setPaymentModalOpen(true)}>
                  {pendingPayment.latestProof?.status === "REJECTED" ? "Resubmit proof" : "Submit payment proof"}
                </Button>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={plan.id === currentPlanId}
                isSubscribing={subscribeMutation.isPending || uploadingProof}
                canSubscribe={!pendingPayment && !pendingPaymentQuery.isLoading && !paymentModeQuery.isLoading && !paymentModeQuery.isError && !!paymentMode && !uploadingProof && submissionFeedback?.type !== "processing"}
                paymentMode={paymentMode}
                onSubscribe={() => void subscribeTo(plan)}
              />
            ))}
          </div>
        </>
      )}

      <Modal
        open={paymentModalOpen}
        onClose={() => { if (!uploadingProof) setPaymentModalOpen(false); }}
        title="Payment details"
        description={paymentPlan ? `Payment submission for ${paymentPlan.name}. The receipt image is optional.` : undefined}
        size="xl"
        footer={(
          <>
            <Button variant="ghost" size="sm" disabled={uploadingProof} onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button
              variant="secondary"
              size="sm"
              loading={uploadingProof}
              disabled={uploadingProof || !referenceNumber.trim() || !amountPaid.trim() || !paymentPlan || !hasDestination}
              onClick={() => void uploadAndSubmitProof()}
            >
              Subscribe and send for review
            </Button>
          </>
        )}
      >
        <div className="space-y-5 sm:space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-white/10 bg-white/5 p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">Selected plan</p>
              <p className="mt-2 font-serif text-lg font-semibold text-white">{paymentPlan?.name ?? "Subscription"}</p>
              <p className="mt-1 text-sm font-semibold text-gold">{paymentPlan ? formatPrice(paymentPlan) : ""}</p>
            </div>
            <div className="border border-white/10 bg-white/5 p-4 sm:p-5">
              <label htmlFor="payment-method" className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">Payment method</label>
              <select id="payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as ManualPaymentMethod)} className="mt-2 w-full h-10 px-3 bg-navy border border-white/20 text-small text-white focus:outline-none focus:border-gold/60">
                <option value="GCASH">GCash</option>
                <option value="MAYA">Maya</option>
                <option value="MARIBANK">MariBank</option>
              </select>
            </div>
          </div>

          <div className="border border-gold/20 bg-gold/5 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">Transfer payment to</p>
              {hasDestination ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-white">{selectedDestination.name}</p>
                  <p className="mt-0.5 font-mono text-sm text-white/70">{selectedDestination.number}</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-warning">Recipient details for {selectedDestination.label} are not configured.</p>
              )}
            </div>
            {hasDestination ? <span className="mt-3 inline-flex shrink-0 border border-gold/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold sm:mt-0">{selectedDestination.label}</span> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="payment-reference" className="block text-small font-medium text-white/80 mb-1.5">Reference number <span className="text-gold">*</span></label>
              <input id="payment-reference" required value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} maxLength={120} className="w-full h-10 px-3 bg-white/8 border border-white/20 text-small text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60" placeholder="Enter transfer reference" />
            </div>
            <div>
              <label htmlFor="payment-amount" className="block text-small font-medium text-white/80 mb-1.5">Amount paid ({paymentPlan?.currency ?? activePaymentSubscription?.currency ?? "PHP"}) <span className="text-gold">*</span></label>
              <input id="payment-amount" type="number" min="0.01" step="0.01" required value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} className="w-full h-10 px-3 bg-white/8 border border-white/20 text-small text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60" placeholder="0.00" />
              <p className="mt-1 text-[11px] text-white/40">Enter the exact plan price.</p>
            </div>
          </div>

          <div className="border border-dashed border-white/20 p-4 sm:p-5">
            <label htmlFor="payment-proof-file" className="block text-small font-medium text-white/80">Proof of payment <span className="font-normal text-white/45">(optional)</span></label>
            <input id="payment-proof-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} className="mt-2 w-full text-small text-white/70 file:mr-3 file:h-9 file:px-3 file:border-0 file:bg-white/10 file:text-white file:font-medium" />
            <p className="mt-1 text-[11px] text-white/40">PNG, JPG, or WebP up to 10 MB. The reference number and amount are required.</p>
          </div>
        </div>
      </Modal>
    </OrgPageShell>
  );
}
