
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";
import { COPY } from "@/src/content/copy";
import { PUBLIC_NAV } from "@/src/config/nav";
import { SITE_CONFIG } from "@/src/config/site";

import { ROLE_HOME } from "@/src/config/permissions";
import { useSession } from "@/src/features/auth/context/SessionContext";

// ── Reusable social link wrapper ─────────────────────────────────────────────
function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-white/50 hover:text-gold transition-colors duration-150"
    >
      {children}
    </a>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
export function Header() {
  const pathname = usePathname();
  const { currentUser, isReady } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-navy sticky top-0 z-[var(--z-header)]">
      <div className="container-page flex items-center justify-between gap-3 py-3 sm:gap-6 sm:py-4">

        {/* Col 1 — Logo */}
        <Link
          href="/"
          aria-label={`${SITE_CONFIG.name} – home`}
          className="flex flex-col items-center gap-1 flex-shrink-0
                     font-serif  text-gold tracking-[0.18em]"
        >
          <Image
            src="/votex-logo.png"
            alt=""
            width={100}
            height={100}
            preload
            sizes="80px"
            className="h-16 w-16 object-contain sm:h-20 sm:w-20"
          />

          {/* <span className="text-[0.7rem] leading-none">
            {SITE_CONFIG.name.toUpperCase()}
          </span> */}
        </Link>

        {/* Col 2 — Desktop nav */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-5"
        >
          {PUBLIC_NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && item.href !== "/";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-caption font-medium transition-colors duration-150 tracking-wide",
                  active
                    ? "text-gold"
                    : "text-surface hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Col 3 — Desktop right side */}
        <div className="hidden md:flex items-center gap-5 flex-shrink-0">

          {/* Column 1 — Social icons */}
          <div className="flex items-center gap-3">
            <SocialLink
              href={SITE_CONFIG.social.facebook}
              label="Votex on Facebook"
            >
              <FaFacebook size={20} />
            </SocialLink>

            <SocialLink
              href={SITE_CONFIG.social.instagram}
              label="Votex on Instagram"
            >
              <FaInstagram size={20} />
            </SocialLink>

            <SocialLink
              href={SITE_CONFIG.social.whatsapp}
              label="Message Votex on WhatsApp"
            >
              <FaWhatsapp size={20} />
            </SocialLink>
          </div>

          {/* Column 2 — User / Auth */}
          <div className="flex flex-col items-start gap-2">

            {currentUser ? (
              <>
                {/* User name — top */}
                <span className="text-small font-medium text-white/70 whitespace-nowrap">
                  {currentUser.firstName}
                </span>

                {/* Dashboard — bottom */}
                <Link href={ROLE_HOME[currentUser.role]}>
                  <Button variant="secondary" size="sm">
                    Go to Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              isReady && (
                <>
                  {/* Login / Register */}
                  <div className="flex items-center gap-2">
                    <Link href="/login">
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-surface border-white/20 hover:bg-white/8 hover:text-white"
                      >
                        {COPY.nav.login}
                      </Button>
                    </Link>

                    <Link href="/register">
                      <Button variant="secondary" size="sm">
                        {COPY.nav.register}
                      </Button>
                    </Link>
                  </div>
                </>
              )
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white/70 hover:text-white p-1.5 transition-colors"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-navy border-t border-white/8 px-4 sm:px-6 pb-6">

          {/* Mobile navigation */}
          <nav className="flex flex-col gap-0.5 pt-4 mb-4">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-white/60 hover:text-white py-2.5 text-small transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Socials */}
          <div className="flex items-center gap-4 pb-4 mb-4 border-b border-white/8">
            <SocialLink
              href={SITE_CONFIG.social.facebook}
              label="Votex on Facebook"
            >
              <FaFacebook size={20} />
            </SocialLink>

            <SocialLink
              href={SITE_CONFIG.social.instagram}
              label="Votex on Instagram"
            >
              <FaInstagram size={20} />
            </SocialLink>

            <SocialLink
              href={SITE_CONFIG.social.whatsapp}
              label="Message Votex on WhatsApp"
            >
              <FaWhatsapp size={20} />
            </SocialLink>
          </div>

          {/* Auth */}
          <div className="flex flex-col gap-2">
            {currentUser ? (
              <>
                <p className="px-1 text-small font-medium text-white/70">
                  {currentUser.firstName}
                </p>

                <Link
                  href={ROLE_HOME[currentUser.role]}
                  onClick={() => setMobileOpen(false)}
                >
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              isReady && (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      className="text-white/70 border-white/20"
                    >
                      {COPY.nav.login}
                    </Button>
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                    >
                      {COPY.nav.register}
                    </Button>
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
