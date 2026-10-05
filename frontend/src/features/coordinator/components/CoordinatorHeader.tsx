"use client";

import Link from "next/link";

interface CoordinatorHeaderProps {
  title?: string;
}

export default function CoordinatorHeader({ title }: CoordinatorHeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--z-header)] bg-surface border-b border-border h-16 flex items-center px-6 gap-4">

      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="font-serif font-bold text-charcoal text-h3 truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">

        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 flex items-center justify-center text-muted
                     hover:text-navy hover:bg-slate transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true" />
        </button>

        <Link
          href="/contact"
          aria-label="Help"
          className="w-9 h-9 flex items-center justify-center text-muted
                     hover:text-navy hover:bg-slate transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </Link>

        <div className="w-px h-6 bg-border" aria-hidden="true" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-navy flex items-center justify-center shrink-0">
            <span className="font-serif font-bold text-gold text-caption leading-none">C</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-caption font-semibold text-charcoal leading-none mb-0.5">Coordinator</p>
            <p className="text-[0.65rem] text-muted leading-none">Coordinator</p>
          </div>
        </div>

      </div>
    </header>
  );
}
