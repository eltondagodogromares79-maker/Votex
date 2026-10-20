"use client";

import { useState } from "react";
import Link from "next/link";
import { FAQ_ITEMS } from "@/src/content/faq";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";

const CATEGORIES = ["All", "general", "coordinators", "judges", "billing", "technical"];

const CATEGORY_LABELS: Record<string, string> = {
  All: "All",
  general: "General",
  coordinators: "Coordinators",
  judges: "Judges & Tabulators",
  billing: "Billing",
  technical: "Technical",
};

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const toggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  const filtered =
    activeCategory === "All"
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-navy py-20">
        <div className="container-page">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-4">
            Support
          </p>
          <h1 className="font-serif font-bold text-white
                         text-[1.625rem] sm:text-[1.875rem] lg:text-[2.25rem]
                         leading-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-small text-white/55 max-w-lg leading-relaxed">
            Everything you need to know about Votex. Can&apos;t find your answer?{" "}
            <Link href="/contact" className="text-gold hover:underline">
              Contact us.
            </Link>
          </p>
        </div>
      </section>

      <div className="h-px bg-gold/25 w-full" />

      {/* ── Category filter ───────────────────────────────────────────── */}
      <section className="bg-surface py-5 border-b border-border sticky top-0 z-10">
        <div className="container-page">
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "max-w-full px-3 py-1.5 text-caption font-medium leading-tight transition-colors duration-150 sm:px-4",
                  activeCategory === cat
                    ? "bg-navy text-white"
                    : "bg-slate text-muted hover:bg-navy hover:text-white",
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ list ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate">
        <div className="container-page">
          <p className="text-caption text-muted mb-8">
            {filtered.length} question{filtered.length !== 1 ? "s" : ""}
          </p>

          <div className="flex flex-col gap-3">
            {filtered.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-surface rounded-sm overflow-hidden"
                >
                  <h2 className="m-0">
                  <button
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-${item.id}`}
                    className={cn(
                      "w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors",
                      isOpen ? "bg-navy" : "bg-surface hover:bg-slate",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-caption shrink-0 transition-colors",
                          isOpen ? "text-gold" : "text-gold/40",
                        )}
                        aria-hidden="true"
                      >
                        ✦
                      </span>
                      <span className={cn(
                        "font-serif font-semibold text-h3 leading-snug",
                        isOpen ? "text-white" : "text-charcoal",
                      )}>
                        {item.question}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 transition-all duration-200 text-body",
                        isOpen ? "text-gold rotate-180" : "text-muted",
                      )}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                  </h2>

                  {/* Answer */}
                  <div
                    id={`faq-${item.id}`}
                    role="region"
                    aria-hidden={!isOpen}
                    className={cn("px-5 py-5 border-t border-border", !isOpen && "hidden")}
                  >
                    <p className="text-small text-muted leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-navy text-center">
        <div className="container-page">
          <div className="w-8 h-px bg-gold/35 mx-auto mb-8" />
          <h2 className="font-serif font-bold text-gold text-h1 mb-4">
            Still have questions?
          </h2>
          <p className="text-small text-white/55 mb-8 max-w-sm mx-auto leading-relaxed">
            Our team is happy to help. Reach out and we&apos;ll get back to you within one business day.
          </p>
          <Link href="/contact">
            <Button variant="secondary" size="md">Contact us</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
