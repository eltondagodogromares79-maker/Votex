import Link from "next/link";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { SITE_CONFIG } from "@/src/config/site";
import { PUBLIC_NAV, FOOTER_LEGAL_NAV } from "@/src/config/nav";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy mt-auto">
      {/* ── Thin gold rule at the very top ────────────────────────────── */}
      <div className="h-px bg-gold/30 w-full" />

      <div className="container-page py-16">

        {/* ── Main grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-14">

          {/* Brand column — wider, takes 5 of 12 cols on md+ */}
          <div className="md:col-span-5 flex flex-col gap-4">
            {/* Wordmark */}
            <p className="font-serif font-bold text-gold tracking-[0.2em] text-[1.125rem]">
              {SITE_CONFIG.name.toUpperCase()}
            </p>

            {/* Tagline */}
            <p className="text-small text-white/50 leading-relaxed max-w-[260px]">
              {SITE_CONFIG.tagline}
            </p>

            {/* Social links */}
            <div className="flex items-center gap-4 mt-1">
              <a
                href={SITE_CONFIG.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Votex on Facebook"
                className="text-white/40 hover:text-gold transition-colors"
              >
                <FaFacebook size={20} />
              </a>
              <a
                href={SITE_CONFIG.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Votex on Instagram"
                className="text-white/40 hover:text-gold transition-colors"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href={SITE_CONFIG.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Message Votex on WhatsApp"
                className="text-white/40 hover:text-gold transition-colors"
              >
                <FaWhatsapp size={20} />
              </a>
            </div>
          </div>

          {/* Platform nav — 3 cols */}
          <div className="md:col-span-3">
            <p className="text-caption font-semibold uppercase tracking-[0.14em]
                          text-gold mb-5">
              Platform
            </p>
            <nav aria-label="Footer navigation" className="flex flex-col gap-3">
              {PUBLIC_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-small text-white/50 hover:text-white
                             transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal nav — 4 cols */}
          <div className="md:col-span-4">
            <p className="text-caption font-semibold uppercase tracking-[0.14em]
                          text-gold mb-5">
              Legal
            </p>
            <nav aria-label="Legal navigation" className="flex flex-col gap-3">
              {FOOTER_LEGAL_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-small text-white/50 hover:text-white
                             transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Contact email under legal */}
            <div className="mt-7">
              <p className="text-caption font-semibold uppercase tracking-[0.14em]
                            text-gold mb-3">
                Contact
              </p>
              <a
                href={`mailto:${SITE_CONFIG.contact.email}`}
                className="text-small text-white/50 hover:text-white transition-colors"
              >
                {SITE_CONFIG.contact.email}
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────── */}
        <div className="border-t border-white/8 pt-6
                        flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-caption text-white/25 tracking-wide">
            © {year} {SITE_CONFIG.company.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-caption text-white/25">
            <span>Developed by: </span>
            <span className="text-gold text-md">Elton Dagodog</span>
            {/* <span>in the {SITE_CONFIG.company.country}</span> */}
          </div>
        </div>

      </div>
    </footer>
  );
}
