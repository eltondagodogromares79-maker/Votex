"use client";

import { Suspense, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import {
  AuthLogoBrandPanel,
  AuthLogoMobile,
} from "@/src/features/auth/components/AuthLogo";

import {
  loginSchema,
  type LoginFormValues,
} from "@/src/lib/validations/auth";

import { useToast } from "@/src/components/ui/Toast";
import { ROLE_HOME } from "@/src/config/permissions";
import { EyeIcon } from "@/src/features/auth/components/register/AuthIcons";
import { cn } from "@/src/lib/utils";
import type { FrontendRole } from "@/src/lib/auth/roles";

import { ApiError } from "@/src/lib/api/client";
import { useLogin } from "../../hooks/useLogin";
import { useSession } from "../../context/SessionContext";


// ─────────────────────────────────────────────────────────────────────────────
// Shared field styles
// ─────────────────────────────────────────────────────────────────────────────

const fieldLabel =
  "block text-small font-medium text-white/80 mb-1";

const fieldInput =
  "w-full bg-white/8 border border-white/15 text-white text-small px-3 py-2.5 " +
  "placeholder:text-white/30 focus:outline-none focus:border-gold/60 " +
  "transition-colors duration-150";

const fieldError =
  "text-caption text-error mt-1";

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
  const fid = id ?? props.name ?? "";

  return (
    <div>
      <label htmlFor={fid} className={fieldLabel}>
        {label}

        {required && (
          <span
            className="ml-1 text-gold/60"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>

      <input
        id={fid}
        required={required}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${fid}-err`
            : hint
              ? `${fid}-hint`
              : undefined
        }
        className={cn(
          fieldInput,
          error && "border-error",
          className,
        )}
        {...props}
      />

      {error ? (
        <p
          id={`${fid}-err`}
          className={fieldError}
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${fid}-hint`}
          className="text-caption text-white/40 mt-1"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role-specific copy
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_COPY: Record<
  FrontendRole,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    note?: string;
    registerHref?: string;
    registerLabel?: string;
  }
> = {
  org_owner: {
    eyebrow: "Organization Owner sign-in",
    title: "Welcome back",
    subtitle:
      "Sign in to manage your organization, pageants, and team.",
    registerHref: "/register",
    registerLabel: "Create an Org Owner account",
  },

  coordinator: {
    eyebrow: "Coordinator sign-in",
    title: "Welcome back",
    subtitle:
      "Sign in to manage your assigned pageant.",
    note:
      "Your account was created by your Organization Owner.",
  },

  judge: {
    eyebrow: "Judge sign-in",
    title: "Ready to score?",
    subtitle:
      "Sign in to access your assigned rounds and submit scores.",
    note:
      "Your account was created by your Organization Owner. Contact them if you need help.",
  },

  tabulator: {
    eyebrow: "Tabulator sign-in",
    title: "Live tabulation",
    subtitle:
      "Sign in to monitor scores and manage round advancement.",
    note:
      "Your account was created by your Organization Owner. Contact them if you need help.",
  },

  audience: {
    eyebrow: "Audience sign-in",
    title: "Welcome back",
    subtitle:
      "Sign in to follow live pageants and cast your votes.",
    registerHref: "/register/audience",
    registerLabel: "Create an Audience account",
  },

  admin: {
    eyebrow: "Admin sign-in",
    title: "Administration",
    subtitle:
      "Sign in to the Votex administration panel.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────────────────

interface SignInFormInnerProps {
  role: FrontendRole;
}

function SignInFormInner({
  role,
}: SignInFormInnerProps) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);

  const login = useLogin();
  const { setCurrentUser } = useSession();

  // Clear any stale role-hint cookie from a previous session so the proxy
  // doesn't redirect this role's protected routes before login completes.
  useEffect(() => {
    document.cookie = "at_hint=; path=/; Max-Age=0";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps — run once on mount, browser only

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const copy = ROLE_COPY[role];

  async function onSubmit(data: LoginFormValues) {
    try {
      const currentUser = await login.mutateAsync({
        email: data.email,
        password: data.password,
      });

      // Write the role hint cookie using the role verified by the backend
      // (not the role prop, which is just the login page's UI hint).
      const maxAge = 60 * 60 * 24; // 24 hours
      document.cookie = `at_hint=${currentUser.role}; path=/; SameSite=Lax; Max-Age=${maxAge}`;

      // Populate the session context immediately so any component that reads
      // useSession() is up-to-date before the navigation completes.
      setCurrentUser(currentUser);

      toast.success(`Welcome back, ${currentUser.firstName}!`);

      // Hard navigate so the browser sends the fresh at_hint cookie on the
      // very next request — router.push is a client transition and the proxy
      // would still see the old/missing cookie.
      window.location.href = redirect ?? ROLE_HOME[currentUser.role];
    } catch (error) {
      if (error instanceof ApiError) {
        const code = error.code;
        const message = error.userMessage;

        if (code === "INVALID_CREDENTIALS") {
          toast.error(message);
          return;
        }

        if (code === "ACCOUNT_LOCKED") {
          toast.error(message);
          return;
        }

        if (code === "ACCOUNT_INACTIVE") {
          toast.error(message);
          return;
        }

        if (code === "EMAIL_NOT_VERIFIED") {
          toast.error(message);
          return;
        }

        if (error.status >= 500) {
          toast.error(
            "Something went wrong. Please try again later.",
          );
          return;
        }

        toast.error(message);
        return;
      }

      toast.error(
        "Network error. Check your connection and try again.",
      );
    }
  }

  const submitting =
    isSubmitting || login.isPending;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* LEFT BRAND PANEL */}
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

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 lg:w-7/12 xl:w-[55%] bg-navy flex flex-col">

        {/* MOBILE TOP BAR */}
        <div className="lg:hidden h-14 flex items-center px-6 border-b border-white/8">
          <AuthLogoMobile />
        </div>

        <div
          className="
            flex-1 flex items-center justify-center
            px-6 sm:px-10 md:px-16 lg:px-12 xl:px-16
            py-12
          "
        >
          <div className="w-full max-w-[380px]">

            {/* BACK */}
            <Link
              href="/login"
              className="
                inline-flex items-center gap-1.5
                text-caption text-white/40
                hover:text-white/70
                transition-colors mb-8 group
              "
            >
              <svg
                className="
                  w-3.5 h-3.5
                  group-hover:-translate-x-0.5
                  transition-transform
                "
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

              All sign-in options
            </Link>

            {/* HEADING */}
            <div className="mb-8">
              <p
                className="
                  text-caption font-semibold uppercase
                  tracking-[0.18em] text-gold mb-3
                "
              >
                {copy.eyebrow}
              </p>

              <div className="w-6 h-px bg-gold/35 mb-5" />

              <h1
                className="
                  font-serif font-bold text-white
                  text-[1.5rem] leading-tight mb-1
                "
              >
                {copy.title}
              </h1>

              <p className="text-small text-white/50">
                {copy.subtitle}
              </p>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >

              {/* EMAIL */}
              <NavyInput
                id={`${role}-email`}
                type="email"
                label="Email address"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                required
                {...register("email")}
              />

              {/* PASSWORD */}
              <div>
                <div className="relative">

                  <NavyInput
                    id={`${role}-password`}
                    type={
                      showPw
                        ? "text"
                        : "password"
                    }
                    label="Password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    required
                    {...register("password")}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPw((value) => !value)
                    }
                    aria-label={
                      showPw
                        ? "Hide password"
                        : "Show password"
                    }
                    className="
                      absolute right-3 top-[2.1rem]
                      text-white/40
                      hover:text-white/80
                      transition-colors
                    "
                  >
                    <EyeIcon open={showPw} />
                  </button>

                </div>

                <div className="flex justify-end mt-1.5">
                  <Link
                    href="/forgot-password"
                    className="
                      text-caption text-white/40
                      hover:text-gold
                      transition-colors
                    "
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={submitting}
                className="
                  w-full h-10 bg-gold text-navy
                  text-small font-semibold
                  hover:bg-gold-hover
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  flex items-center justify-center
                  gap-2 transition-colors
                "
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>

                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* ROLE NOTE */}
            {copy.note && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <p
                  className="
                    text-caption text-white/35
                    leading-relaxed text-center
                  "
                >
                  {copy.note}
                </p>
              </div>
            )}

            {/* REGISTER LINK */}
            {copy.registerHref && (
              <>
                <div className="flex items-center gap-3 mt-5">
                  <div className="flex-1 h-px bg-white/12" />

                  <span className="text-caption text-white/35">
                    or
                  </span>

                  <div className="flex-1 h-px bg-white/12" />
                </div>

                <p className="text-center text-small text-white/45 mt-5">
                  No account?{" "}
                  <Link
                    href={copy.registerHref}
                    className="
                      text-gold font-semibold
                      hover:underline underline-offset-2
                    "
                  >
                    {copy.registerLabel}
                  </Link>
                </p>
              </>
            )}

            {/* LEGAL */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {(
                [
                  ["Terms", "/terms"],
                  ["Privacy", "/privacy"],
                  ["Contact", "/contact"],
                ] as [string, string][]
              ).map(([label, href], index, links) => (
                <span
                  key={href}
                  className="flex items-center gap-3"
                >
                  <Link
                    href={href}
                    className="
                      text-caption text-white/30
                      hover:text-white/60
                      transition-colors
                    "
                  >
                    {label}
                  </Link>

                  {index < links.length - 1 && (
                    <span
                      className="
                        text-white/20
                        text-caption
                      "
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
// Public export
// ─────────────────────────────────────────────────────────────────────────────

export function SignInForm({
  role,
}: SignInFormInnerProps) {
  return (
    <Suspense>
      <SignInFormInner role={role} />
    </Suspense>
  );
}