"use client";

import Link from "next/link";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { ROLE_HOME } from "@/src/config/permissions";
import { authApi } from "@/src/features/auth/api/authentication";
import { setAccessToken } from "@/src/lib/api/client";
import { useState } from "react";

export default function ForbiddenPage() {
  const { currentUser, setCurrentUser } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore — clear client state regardless
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
      // Clear role hint cookie
      document.cookie = "at_hint=; path=/; Max-Age=0";
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        {/* Status code */}
        <p className="font-serif font-bold text-gold text-[5rem] leading-none mb-4">
          403
        </p>

        {/* Divider */}
        <div className="w-12 h-px bg-gold/30 mx-auto mb-6" />

        {/* Heading */}
        <h1 className="font-serif font-bold text-white text-[1.5rem] mb-3">
          Access Denied
        </h1>

        <p className="text-small text-white/50 leading-relaxed mb-8">
          {currentUser
            ? `Your account (${currentUser.email}) does not have permission to view this page.`
            : "You do not have permission to view this page."}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">

          {/* Go to my dashboard */}
          {currentUser && (
            <Link
              href={ROLE_HOME[currentUser.role]}
              className="
                w-full h-10 bg-gold text-navy text-small font-semibold
                hover:bg-gold-hover flex items-center justify-center
                transition-colors
              "
            >
              Go to my dashboard
            </Link>
          )}

          {/* Sign in as different account */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="
              w-full h-10 bg-white/8 border border-white/15 text-white/70
              text-small font-medium hover:bg-white/12 hover:text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center transition-colors
            "
          >
            {signingOut ? "Signing out…" : "Sign in as a different account"}
          </button>

        </div>

        {/* Legal footer */}
        <div className="flex items-center justify-center gap-3 mt-10">
          {([["Terms", "/terms"], ["Privacy", "/privacy"], ["Contact", "/contact"]] as [string, string][]).map(
            ([label, href], i, arr) => (
              <span key={href} className="flex items-center gap-3">
                <Link
                  href={href}
                  className="text-caption text-white/30 hover:text-white/60 transition-colors"
                >
                  {label}
                </Link>
                {i < arr.length - 1 && (
                  <span className="text-white/20 text-caption" aria-hidden="true">✦</span>
                )}
              </span>
            )
          )}
        </div>

      </div>
    </div>
  );
}
