"use client";

/**
 * Forgot-password page.
 *
 * NOTE: The backend does not yet expose a password-reset endpoint.
 * This page collects the email and shows a confirmation message.
 * Wire it to a real API call when POST /api/v1/auth/password-reset
 * (or equivalent) is implemented.
 */

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/src/lib/validations/auth";
import { cn } from "@/src/lib/utils";
import { AuthLogoBrandPanel, AuthLogoMobile } from "@/src/features/auth/components/AuthLogo";

// ── Shared navy field styles ──────────────────────────────────────────────────
const fieldLabel = "block text-small font-medium text-white/80 mb-1";
const fieldInput =
  "w-full bg-white/8 border border-white/15 text-white text-small px-3 py-2.5 " +
  "placeholder:text-white/30 focus:outline-none focus:border-gold/60 " +
  "transition-colors duration-150";
const fieldError = "text-caption text-error mt-1";

interface NavyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}
function NavyInput({ label, error, id, required, className, ...props }: NavyInputProps) {
  const fid = id ?? (props.name ?? "");
  return (
    <div>
      <label htmlFor={fid} className={fieldLabel}>
        {label}
        {required && <span className="ml-1 text-gold/60" aria-hidden="true">*</span>}
      </label>
      <input
        id={fid}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${fid}-err` : undefined}
        className={cn(fieldInput, error && "border-error", className)}
        {...props}
      />
      {error && (
        <p id={`${fid}-err`} className={fieldError} role="alert">{error}</p>
      )}
    </div>
  );
}

// ── Inner (needs Suspense wrapper) ────────────────────────────────────────────
function ForgotPasswordInner() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    // Simulate network delay — replace with real API call when available:
    // await authApi.requestPasswordReset({ email: data.email });
    await new Promise((r) => setTimeout(r, 1000));
    setSubmittedEmail(data.email);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT brand panel ───────────────────────────────────────── */}
      <div className="hidden lg:block lg:w-5/12 xl:w-[45%] relative bg-navy overflow-hidden">
        <Image
          src="/auth-image.jpg"
          alt=""
          fill
          priority
          sizes="45vw"
          className="object-cover object-center"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent 80%, rgba(15,30,54,0.6) 100%)" }}
        />
        <AuthLogoBrandPanel />
      </div>

      {/* ── RIGHT form panel ───────────────────────────────────────── */}
      <div className="flex-1 lg:w-7/12 xl:w-[55%] bg-navy flex flex-col">

        {/* Mobile top bar */}
        <div className="lg:hidden h-14 flex items-center px-6 border-b border-white/8">
          <AuthLogoMobile />
        </div>

        <div className="flex-1 flex items-center justify-center
                        px-6 sm:px-10 md:px-16 lg:px-12 xl:px-16 py-12">
          <div className="w-full max-w-[380px]">

            {/* Back link */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-caption text-white/40
                         hover:text-white/70 transition-colors mb-8 group"
            >
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to sign in
            </Link>

            {submitted ? (
              /* ── Success state ─────────────────────────────────── */
              <div>
                <div className="mb-8">
                  <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-3">
                    Check your inbox
                  </p>
                  <div className="w-6 h-px bg-gold/35 mb-5" />
                  <h1 className="font-serif font-bold text-white text-[1.5rem] leading-tight mb-1">
                    Reset link sent
                  </h1>
                  <p className="text-small text-white/50 leading-relaxed">
                    If an account exists for{" "}
                    <span className="text-white/80 font-medium">{submittedEmail}</span>,
                    you&apos;ll receive a password reset link shortly.
                  </p>
                </div>

                {/* Envelope illustration */}
                <div className="flex items-center justify-center w-16 h-16 bg-gold/10 border border-gold/25 mx-auto mb-8">
                  <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>

                <div className="space-y-3">
                  <p className="text-caption text-white/35 text-center leading-relaxed">
                    Didn&apos;t receive it? Check your spam folder, or{" "}
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="text-gold hover:underline underline-offset-2"
                    >
                      try again
                    </button>
                    .
                  </p>
                  <p className="text-caption text-white/35 text-center">
                    Remember your password?{" "}
                    <Link href="/login" className="text-gold hover:underline underline-offset-2">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              /* ── Form state ────────────────────────────────────── */
              <>
                <div className="mb-8">
                  <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-3">
                    Reset password
                  </p>
                  <div className="w-6 h-px bg-gold/35 mb-5" />
                  <h1 className="font-serif font-bold text-white text-[1.5rem] leading-tight mb-1">
                    Forgot your password?
                  </h1>
                  <p className="text-small text-white/50 leading-relaxed">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                  <NavyInput
                    id="fp-email"
                    type="email"
                    label="Email address"
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={errors.email?.message}
                    required
                    {...register("email")}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 bg-gold text-navy text-small font-semibold
                               hover:bg-gold-hover disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </button>

                  <p className="text-center text-small text-white/45 pt-1">
                    Remember your password?{" "}
                    <Link href="/login" className="text-gold font-semibold hover:underline underline-offset-2">
                      Sign in
                    </Link>
                  </p>
                </form>
              </>
            )}

            {/* Legal */}
            <div className="flex items-center justify-center gap-3 mt-10">
              {(
                [["Terms", "/terms"], ["Privacy", "/privacy"], ["Contact", "/contact"]] as [string, string][]
              ).map(([label, href], i, a) => (
                <span key={href} className="flex items-center gap-3">
                  <Link href={href} className="text-caption text-white/30 hover:text-white/60 transition-colors">
                    {label}
                  </Link>
                  {i < a.length - 1 && (
                    <span className="text-white/20 text-caption" aria-hidden="true">✦</span>
                  )}
                </span>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordInner />
    </Suspense>
  );
}
