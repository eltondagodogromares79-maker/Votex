"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// import { useAuth } from "@/src/hooks/useAuth";
import { useToast } from "@/src/components/ui/Toast";

import { ApiError } from "@/src/lib/api/client";
import { COPY } from "@/src/content/copy";

import {
  RegisterOrganizationFormValues,

  registerOrganizationSchema,
} from "@/src/lib/validations/auth";



import { AuthLogoBrandPanel } from "@/src/features/auth/components/AuthLogo";



import Spinner from "@/src/features/auth/components/apinner";
import { RegistrationSteps } from "@/src/features/auth/components/register/RegistrationSteps";
import { AuthInput } from "@/src/features/auth/components/register/AuthInput";
import { PasswordInput } from "@/src/features/auth/components/register/PasswordInput";
import { useRegisterOrganization } from "@/src/features/auth/hooks/useRegisterOrganization";

const STEPS = [
  { number: 1, label: "Personal" },
  { number: 2, label: "Organization" },
  { number: 3, label: "Security" },
];

function getPasswordStrength(password: string) {
  if (!password) {
    return {
      score: 0,
      label: "",
      color: "",
    };
  }

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) {
    score++;
  }

  const labels: Record<
    number,
    {
      label: string;
      color: string;
    }
  > = {
    1: {
      label: COPY.auth.passwordStrengthWeak,
      color: "bg-error",
    },
    2: {
      label: COPY.auth.passwordStrengthFair,
      color: "bg-gold",
    },
    3: {
      label: COPY.auth.passwordStrengthGood,
      color: "bg-success",
    },
    4: {
      label: COPY.auth.passwordStrengthStrong,
      color: "bg-success",
    },
  };

  return {
    score: score as 0 | 1 | 2 | 3 | 4,
    ...(labels[score] ?? {
      label: "",
      color: "",
    }),
  };
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

export default function RegisterPage() {
  const router = useRouter();


  const { toast } = useToast();

  const registerOrganization = useRegisterOrganization();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [slugEdited, setSlugEdited] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<RegisterOrganizationFormValues>({
    resolver: zodResolver(registerOrganizationSchema),
    mode: "onTouched",
  });

  const password = useWatch({
    control,
    name: "password",
  }) ?? "";

  const passwordStrength = getPasswordStrength(password);


  // ─────────────────────────────────────────────────────────────
  // Organization slug
  // ─────────────────────────────────────────────────────────────

  function handleOrganizationNameChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    if (!slugEdited) {
      setValue(
        "orgSlug",
        toSlug(event.target.value),
        {
          shouldValidate: false,
          shouldDirty: true,
        },
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Step navigation
  // ─────────────────────────────────────────────────────────────

  async function goToStep2() {
    const valid = await trigger([
      "firstName",
      "lastName",
      "middleName",
      "email",
      "phone",
    ]);

    if (!valid) {
      return;
    }

    setStep(2);
  }

  async function goToStep3() {
    const valid = await trigger([
      "orgName",
      "orgSlug",
    ]);

    if (!valid) {
      return;
    }

    setStep(3);
  }

  // ─────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────

  async function onSubmit(data: RegisterOrganizationFormValues) {
    try {
      await registerOrganization.mutateAsync({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,

        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        phone: data.phone || null,

        orgName: data.orgName,
        orgSlug: data.orgSlug,
        orgAddress: null,
        orgDescription: null,
        orgEmail: null,
        orgPhone: null,
      });

      toast.success(
        "Account created! Please sign in to continue.",
      );

      router.push("/login");
    } catch (error) {
      if (error instanceof ApiError) {
        const code = error.code;
        const message = error.userMessage;

        if (code === "EMAIL_TAKEN") {
          toast.error(message);
          setStep(1);
          return;
        }

        if (code === "SLUG_TAKEN") {
          toast.error(message);
          setStep(2);
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
          toast.error(COPY.errors.generic);
          return;
        }

        toast.error(message);
        return;
      }

      toast.error(COPY.errors.generic);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Headings
  // ─────────────────────────────────────────────────────────────

  const stepHeadings = {
    1: {
      label: "Personal details",
      sub: "Tell us about yourself",
    },
    2: {
      label: "Organization",
      sub: "Set up your pageant organization",
    },
    3: {
      label: "Secure your account",
      sub: "Choose a strong password",
    },
  } as const;

  const currentHeading = stepHeadings[step];

  // ─────────────────────────────────────────────────────────────
  // Page
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* =========================================================
          LEFT BRAND PANEL
      ========================================================= */}

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

      {/* =========================================================
          RIGHT FORM PANEL
      ========================================================= */}

      <div className="flex-1 lg:w-7/12 xl:w-[55%] bg-navy flex flex-col">
        <div
          className="
            flex-1
            flex
            items-center
            justify-center
            px-6
            sm:px-10
            md:px-16
            lg:px-12
            xl:px-16
            py-10
          "
        >
          <div className="w-full max-w-[420px]">
            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="mb-6">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-3">
                Create account
              </p>

              <div className="w-6 h-px bg-gold/35 mb-5" />

              <h1 className="font-serif font-bold text-white text-[1.5rem] leading-tight mb-1">
                {currentHeading.label}
              </h1>

              <p className="text-small text-white/50">
                {currentHeading.sub}
              </p>
            </div>

            {/* =====================================================
                STEP INDICATOR
            ===================================================== */}

            <RegistrationSteps
              steps={STEPS}
              currentStep={step}
            />

            {/* =====================================================
                STEP 1 — PERSONAL
            ===================================================== */}

            {step === 1 && (
              <div className="space-y-4">
                {/* First + Last */}

                <div className="grid grid-cols-2 gap-3">
                  <AuthInput
                    id="r-first"
                    type="text"
                    label={COPY.auth.firstNameLabel}
                    placeholder={COPY.auth.firstNamePlaceholder}
                    autoComplete="given-name"
                    error={errors.firstName?.message}
                    required
                    {...register("firstName")}
                  />

                  <AuthInput
                    id="r-last"
                    type="text"
                    label={COPY.auth.lastNameLabel}
                    placeholder={COPY.auth.lastNamePlaceholder}
                    autoComplete="family-name"
                    error={errors.lastName?.message}
                    required
                    {...register("lastName")}
                  />
                </div>

                {/* Middle name */}

                <AuthInput
                  id="r-middle"
                  type="text"
                  label={COPY.auth.middleNameLabel}
                  placeholder={COPY.auth.middleNamePlaceholder}
                  autoComplete="additional-name"
                  error={errors.middleName?.message}
                  {...register("middleName")}
                />

                {/* Email */}

                <AuthInput
                  id="r-email"
                  type="email"
                  label={COPY.auth.emailLabel}
                  placeholder={COPY.auth.emailPlaceholder}
                  autoComplete="email"
                  error={errors.email?.message}
                  required
                  {...register("email")}
                />

                {/* Phone */}

                <AuthInput
                  id="r-phone"
                  type="tel"
                  label={COPY.auth.phoneLabel}
                  placeholder={COPY.auth.phonePlaceholder}
                  autoComplete="tel"
                  error={errors.phone?.message}
                  {...register("phone")}
                />

                {/* Continue */}

                <button
                  type="button"
                  onClick={goToStep2}
                  className="
                    w-full
                    h-10
                    bg-gold
                    text-navy
                    text-small
                    font-semibold
                    hover:bg-gold-hover
                    flex
                    items-center
                    justify-center
                    gap-2
                    transition-colors
                    mt-2
                  "
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

                {/* Login */}

                <p className="text-center text-small text-white/45 pt-1">
                  {COPY.auth.hasAccount}{" "}

                  <Link
                    href="/login"
                    className="
                      text-gold
                      font-semibold
                      hover:underline
                      underline-offset-2
                    "
                  >
                    {COPY.auth.signIn}
                  </Link>
                </p>
              </div>
            )}

            {/* =====================================================
                STEP 2 — ORGANIZATION
            ===================================================== */}

            {step === 2 && (
              <div className="space-y-4">
                {/* Organization name */}

                <AuthInput
                  id="r-org-name"
                  type="text"
                  label={COPY.auth.organizationNameLabel}
                  placeholder={COPY.auth.organizationNamePlaceholder}
                  autoComplete="organization"
                  error={errors.orgName?.message}
                  required
                  {...register("orgName", {
                    onChange: handleOrganizationNameChange,
                  })}
                />

                {/* Organization slug */}

                <AuthInput
                  id="r-org-slug"
                  type="text"
                  label={COPY.auth.organizationSlugLabel}
                  placeholder={COPY.auth.organizationSlugPlaceholder}
                  autoComplete="off"
                  hint={COPY.auth.organizationSlugHint}
                  error={errors.orgSlug?.message}
                  required
                  {...register("orgSlug", {
                    onChange: () => {
                      setSlugEdited(true);
                    },
                  })}
                />

                {/* Navigation */}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="
                      h-10
                      px-5
                      bg-white/8
                      border
                      border-white/15
                      text-white/70
                      text-small
                      font-medium
                      hover:bg-white/12
                      hover:text-white
                      flex
                      items-center
                      gap-2
                      transition-colors
                    "
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
                    type="button"
                    onClick={goToStep3}
                    className="
                      flex-1
                      h-10
                      bg-gold
                      text-navy
                      text-small
                      font-semibold
                      hover:bg-gold-hover
                      flex
                      items-center
                      justify-center
                      gap-2
                      transition-colors
                    "
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
                </div>
              </div>
            )}

            {/* =====================================================
                STEP 3 — SECURITY
            ===================================================== */}

            {step === 3 && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-4"
              >
                {/* Password */}

                <div>
                  <PasswordInput
                    id="r-pw"
                    label={COPY.auth.passwordLabel}
                    placeholder={COPY.auth.newPasswordPlaceholder}
                    autoComplete="new-password"
                    error={errors.password?.message}
                    required
                    {...register("password")}
                  />

                  {/* Password strength */}

                  {password.length > 0 && (
                    <div
                      className="mt-2 space-y-1"
                      aria-live="polite"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((item) => (
                          <div
                            key={item}
                            className={`
                              h-1
                              flex-1
                              transition-colors
                              duration-200
                              ${
                                item <= passwordStrength.score
                                  ? passwordStrength.color
                                  : "bg-white/15"
                              }
                            `}
                          />
                        ))}
                      </div>

                      {passwordStrength.label && (
                        <p className="text-caption text-white/40">
                          {passwordStrength.label}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm password */}

                <PasswordInput
                  id="r-cpw"
                  label={COPY.auth.confirmPasswordLabel}
                  placeholder={COPY.auth.confirmPasswordPlaceholder}
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  required
                  {...register("confirmPassword")}
                />

                {/* Navigation */}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="
                      h-10
                      px-5
                      bg-white/8
                      border
                      border-white/15
                      text-white/70
                      text-small
                      font-medium
                      hover:bg-white/12
                      hover:text-white
                      flex
                      items-center
                      gap-2
                      transition-colors
                    "
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
                    disabled={
                      isSubmitting ||
                      registerOrganization.isPending
                    }
                    className="
                      flex-1
                      h-10
                      bg-gold
                      text-navy
                      text-small
                      font-semibold
                      hover:bg-gold-hover
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      flex
                      items-center
                      justify-center
                      gap-2
                      transition-colors
                    "
                  >
                    {isSubmitting ||
                    registerOrganization.isPending ? (
                      <>
                        <Spinner />
                        Creating...
                      </>
                    ) : (
                      COPY.auth.registerButton
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* =====================================================
                LEGAL FOOTER
            ===================================================== */}

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
                    className="
                      text-caption
                      text-white/30
                      hover:text-white/60
                      transition-colors
                    "
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
