
"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { audienceRegisterSchema, type AudienceRegisterFormValues } from "@/src/lib/validations/auth";
import { EyeIcon } from "@/src/features/auth/components/register/AuthIcons";
import { cn } from "@/src/lib/utils";
import {
  AuthLogoBrandPanel,
  AuthLogoMobile,
} from "@/src/features/auth/components/AuthLogo";
import { authApi } from "@/src/features/auth/api/authentication";
import Spinner from "@/src/features/auth/components/apinner";

// ─────────────────────────────────────────────────────────────────────────────
// Field styles
// ─────────────────────────────────────────────────────────────────────────────

const fieldLabel = "block text-small font-medium text-white/80 mb-1";

const fieldInput =
  "w-full bg-white/8 border border-white/15 text-white text-small px-3 py-2.5 " +
  "placeholder:text-white/30 focus:outline-none focus:border-gold/60 " +
  "transition-colors duration-150";

const fieldError = "text-caption text-error mt-1";
const fieldHint = "text-caption text-white/40 mt-1";

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────

interface NavyInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

function NavyInput({
  label,
  error,
  hint,
  id,
  required,
  className,
  ...props
}: NavyInputProps) {
  const fieldId = id ?? props.name ?? "";

  return (
    <div>
      <label htmlFor={fieldId} className={fieldLabel}>
        {label}
        {required && (
          <span className="ml-1 text-gold/60" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <input
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${fieldId}-err`
            : hint
              ? `${fieldId}-hint`
              : undefined
        }
        className={cn(fieldInput, error && "border-error", className)}
        {...props}
      />

      {error ? (
        <p id={`${fieldId}-err`} className={fieldError} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className={fieldHint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Password strength
// ─────────────────────────────────────────────────────────────────────────────

function getStrength(pw: string) {
  if (!pw) {
    return {
      score: 0 as 0 | 1 | 2 | 3 | 4,
      label: "",
      color: "",
    };
  }

  let score = 0;

  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;

  const levels: Record<
    number,
    { label: string; color: string }
  > = {
    1: {
      label: "Weak",
      color: "bg-error",
    },
    2: {
      label: "Fair",
      color: "bg-gold",
    },
    3: {
      label: "Good",
      color: "bg-success",
    },
    4: {
      label: "Strong",
      color: "bg-success",
    },
  };

  return {
    score: score as 0 | 1 | 2 | 3 | 4,
    ...(levels[score] ?? {
      label: "",
      color: "",
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: 1,
    label: "Personal",
  },
  {
    number: 2,
    label: "Secure",
  },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div
      className="flex items-center mb-8"
      role="list"
      aria-label="Registration steps"
    >
      {STEPS.map((step, index) => {
        const done = step.number < current;
        const active = step.number === current;

        return (
          <div
            key={step.number}
            className="flex items-center flex-1"
            role="listitem"
          >
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center " +
                    "text-caption font-bold transition-all duration-200",

                  done && "bg-gold text-navy",

                  active &&
                    "bg-gold text-navy ring-2 ring-gold/30 " +
                      "ring-offset-2 ring-offset-navy",

                  !done &&
                    !active &&
                    "bg-white/10 text-white/35",
                )}
              >
                {done ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>

              <span
                className={cn(
                  "text-[0.65rem] uppercase tracking-[0.1em] " +
                    "font-semibold leading-none",

                  active
                    ? "text-gold"
                    : done
                      ? "text-gold/60"
                      : "text-white/25",
                )}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div className="flex-1 mx-2 mt-[-0.8rem]">
                <div
                  className={cn(
                    "h-px transition-all duration-300",
                    done ? "bg-gold/50" : "bg-white/12",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand panel
// ─────────────────────────────────────────────────────────────────────────────

function BrandPanel() {
  return (
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
        style={{
          background:
            "linear-gradient(to bottom, transparent 80%, rgba(15,30,54,0.6) 100%)",
        }}
      />

      <AuthLogoBrandPanel />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

function AudienceRegisterInner() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<AudienceRegisterFormValues>({
    resolver: zodResolver(audienceRegisterSchema),
  });

  const password = useWatch({
    control,
    name: "password",
  }) ?? "";

  const strength = getStrength(password);

  // ───────────────────────────────────────────────────────────────────────────
  // Step navigation
  // ───────────────────────────────────────────────────────────────────────────

  async function goToStep2() {
    const valid = await trigger([
      "firstName",
      "lastName",
      "email",
      "phone",
      "middleName",
    ]);

    if (!valid) {
      return;
    }

    setStep(2);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Submit
  // ───────────────────────────────────────────────────────────────────────────

  async function onSubmit(data: AudienceRegisterFormValues) {
    try {
      await authApi.registerAudience({
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        phone: data.phone || null,
      });

      toast.success(
        "Account created! Please sign in to continue.",
      );

      router.push("/login/audience");
    } catch (error) {
      if (error instanceof ApiError) {
        const code = error.code;
        const message = error.userMessage;

        if (code === "EMAIL_TAKEN") {
          toast.error(message);
          setStep(1);
          return;
        }

        if (code === "VALIDATION_ERROR") {
          const fields = (
            error.body as Record<string, unknown>
          )?.fields as Record<string, string[]> | undefined;

          const firstFieldError = fields
            ? Object.values(fields).flat()[0]
            : null;

          toast.error(firstFieldError ?? message);
          return;
        }

        if (error.status >= 500) {
          toast.error(
            "Something went wrong. Please try again.",
          );
          return;
        }

        toast.error(message);
        return;
      }

      toast.error(
        "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <BrandPanel />

      <div className="flex-1 lg:w-7/12 xl:w-[55%] bg-navy flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden h-14 flex items-center px-6 border-b border-white/8">
          <AuthLogoMobile />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 md:px-16 lg:px-12 xl:px-16 py-10">
          <div className="w-full max-w-[420px]">

            {/* Heading */}
            <div className="mb-6">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-3">
                Audience account
              </p>

              <div className="w-6 h-px bg-gold/35 mb-5" />

              <h1 className="font-serif font-bold text-white text-[1.5rem] leading-tight mb-1">
                {step === 1
                  ? "Join the audience"
                  : "Secure your account"}
              </h1>

              <p className="text-small text-white/50">
                {step === 1
                  ? "Create your account to follow live pageants and cast votes."
                  : "Set a password and finish creating your account."}
              </p>
            </div>

            <StepIndicator current={step} />

            {/* ═════════════════════════════════════════════════════════════════
                STEP 1 — Personal details
            ═════════════════════════════════════════════════════════════════ */}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <NavyInput
                    id="a-first"
                    type="text"
                    label="First name"
                    placeholder="Juan"
                    autoComplete="given-name"
                    error={errors.firstName?.message}
                    required
                    {...register("firstName")}
                  />

                  <NavyInput
                    id="a-last"
                    type="text"
                    label="Last name"
                    placeholder="Cruz"
                    autoComplete="family-name"
                    error={errors.lastName?.message}
                    required
                    {...register("lastName")}
                  />
                </div>

                <NavyInput
                  id="a-middle"
                  type="text"
                  label="Middle name (optional)"
                  placeholder="de la"
                  autoComplete="additional-name"
                  error={errors.middleName?.message}
                  hint="Optional"
                  {...register("middleName")}
                />

                <NavyInput
                  id="a-email"
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  required
                  {...register("email")}
                />

                <NavyInput
                  id="a-phone"
                  type="tel"
                  label="Phone number (optional)"
                  placeholder="+639171234567"
                  autoComplete="tel"
                  error={errors.phone?.message}
                  {...register("phone")}
                />

                <button
                  type="button"
                  onClick={goToStep2}
                  className={
                    "w-full h-10 bg-gold text-navy text-small font-semibold " +
                    "hover:bg-gold-hover flex items-center justify-center gap-2 " +
                    "transition-colors mt-2"
                  }
                >
                  Continue

                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>

                <p className="text-center text-small text-white/45 pt-1">
                  Already have an account?{" "}
                  <Link
                    href="/login/audience"
                    className="text-gold font-semibold hover:underline underline-offset-2"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════
                STEP 2 — Password + terms
            ═════════════════════════════════════════════════════════════════ */}

            {step === 2 && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-4"
              >
                {/* Password */}
                <div>
                  <div className="relative">
                    <NavyInput
                      id="a-pw"
                      type={showPassword ? "text" : "password"}
                      label="Password"
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      error={errors.password?.message}
                      required
                      {...register("password")}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-[2.1rem] text-white/40 hover:text-white/80 transition-colors"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>

                  {password.length > 0 && (
                    <div
                      className="mt-2 space-y-1"
                      aria-live="polite"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "h-1 flex-1 transition-colors duration-200",
                              level <= strength.score
                                ? strength.color
                                : "bg-white/15",
                            )}
                          />
                        ))}
                      </div>

                      {strength.label && (
                        <p className="text-caption text-white/40">
                          {strength.label}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="relative">
                  <NavyInput
                    id="a-cpw"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    label="Confirm password"
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    error={errors.confirmPassword?.message}
                    required
                    {...register("confirmPassword")}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value,
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-[2.1rem] text-white/40 hover:text-white/80 transition-colors"
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="a-terms"
                      {...register("terms")}
                      className="mt-0.5 w-4 h-4 accent-gold shrink-0"
                      aria-describedby="a-terms-err"
                    />

                    <span className="text-small text-white/55 leading-relaxed">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-gold hover:underline"
                      >
                        Terms &amp; Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-gold hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  {errors.terms && (
                    <p
                      id="a-terms-err"
                      className={fieldError}
                      role="alert"
                    >
                      {errors.terms.message}
                    </p>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={
                      "h-10 px-5 bg-white/8 border border-white/15 " +
                      "text-white/70 text-small font-medium " +
                      "hover:bg-white/12 hover:text-white " +
                      "flex items-center gap-2 transition-colors"
                    }
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                      />
                    </svg>

                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={
                      "flex-1 h-10 bg-gold text-navy text-small font-semibold " +
                      "hover:bg-gold-hover disabled:opacity-50 " +
                      "disabled:cursor-not-allowed flex items-center " +
                      "justify-center gap-2 transition-colors"
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner />
                        Creating…
                      </>
                    ) : (
                      "Create account"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Legal */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {(
                [
                  ["Terms", "/terms"],
                  ["Privacy", "/privacy"],
                  ["Contact", "/contact"],
                ] as [string, string][]
              ).map(([label, href], index, items) => (
                <span
                  key={href}
                  className="flex items-center gap-3"
                >
                  <Link
                    href={href}
                    className="text-caption text-white/30 hover:text-white/60 transition-colors"
                  >
                    {label}
                  </Link>

                  {index < items.length - 1 && (
                    <span
                      className="text-white/20 text-caption"
                      aria-hidden="true"
                    >
                      ✦
                    </span>
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

// ─────────────────────────────────────────────────────────────────────────────
// Page export
// ─────────────────────────────────────────────────────────────────────────────

export default function AudienceRegisterPage() {
  return (
    <Suspense>
      <AudienceRegisterInner />
    </Suspense>
  );
}
