"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaFacebook, FaInstagram, FaEnvelope } from "react-icons/fa";
import { contactSchema, type ContactFormValues } from "@/src/lib/validations/billing";
import { SITE_CONFIG } from "@/src/config/site";
import { Input, Textarea } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { useState } from "react";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { contactApi } from "@/src/features/contact/api/contact";
import { ApiError } from "@/src/lib/api/client";

export default function ContactPage() {
  const { toast } = useToast();
  const { currentUser, isReady } = useSession();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(data: ContactFormValues) {
    if (!currentUser) return;
    try {
      await contactApi.submit(data);
      setSubmitted(true);
      toast.success("Your message was sent to the Votex support team.");
    } catch (error) {
      const message = error instanceof ApiError ? error.userMessage : "Please try again.";
      toast.error(`Message could not be sent. ${message}`);
    }
  }

  return (
    <>
      {/* ── Hero — untouched ──────────────────────────────────────────── */}
      <section className="bg-navy py-20">
        <div className="container-page">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-4">
            Get in touch
          </p>
          <h1 className="font-serif font-bold text-white
                         text-[1.625rem] sm:text-[1.875rem] lg:text-[2.25rem]
                         leading-tight mb-4">
            We&apos;d love to hear from you
          </h1>
          <p className="text-small text-white/55   max-w-lg leading-relaxed">
            Whether you have a question about pricing, need help setting up your
            first pageant, or want to discuss an enterprise plan — we&apos;re here.
          </p>
        </div>
      </section>

      <div className="h-px bg-gold/25 w-full" />

      {/* ── Channels + form ───────────────────────────────────────────── */}
      <section className="py-16 bg-slate">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left col: channels ────────────────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* Section heading */}
              <div>
                <p className="text-caption font-semibold uppercase tracking-[0.18em]
                              text-gold mb-2">
                  Contact channels
                </p>
                <div className="w-6 h-px bg-gold/30" />
              </div>

              <div className="flex items-start gap-4 rounded-sm bg-surface px-5 py-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-navy/8 text-gold">
                  <FaEnvelope size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-caption font-semibold uppercase tracking-widest text-gold/70">Support inbox</p>
                  <p className="mt-1 text-small font-medium text-charcoal">Send a message through the form</p>
                  <p className="mt-0.5 text-caption leading-relaxed text-muted">Your account details are attached and the request appears in the admin support inbox.</p>
                </div>
              </div>

              {/* Social row */}
              <div>
                <p className="text-caption font-semibold uppercase tracking-[0.16em]
                              text-muted mb-3">
                  Follow Votex
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { href: SITE_CONFIG.social.facebook, icon: <FaFacebook size={18} />, label: "Facebook" },
                    { href: SITE_CONFIG.social.instagram, icon: <FaInstagram size={18} />, label: "Instagram" },
                  ].map((s) => (
                    <a key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Votex on ${s.label}`}
                      className="w-10 h-10 flex items-center justify-center rounded-sm
                                 bg-surface text-muted hover:bg-navy hover:text-gold
                                 transition-colors duration-150">
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Response time */}
              <div className="mt-auto pt-2 border-t border-border">
                <p className="text-caption text-muted leading-relaxed">
                  We reply within{" "}
                  <span className="font-semibold text-charcoal">one business day</span>.
                  Enterprise inquiries get same-day responses.
                </p>
              </div>
            </div>

            {/* ── Right col: form (spans 2) ──────────────────────────── */}
            <div className="lg:col-span-2 bg-surface rounded-sm overflow-hidden">
              {/* Form header band */}
              <div className="bg-navy px-6 py-4 flex items-center gap-3">
                <span className="text-gold text-caption" aria-hidden="true">✦</span>
                <h2 className="font-serif font-semibold text-white text-h3">
                  Send us a message
                </h2>
              </div>

              <div className="px-6 py-6">
                {!isReady ? (
                  <div className="py-12 text-center text-small text-muted" role="status">Checking your sign-in…</div>
                ) : !currentUser ? (
                  <div className="py-10 text-center">
                    <h2 className="font-serif font-bold text-charcoal text-h2 mb-3">Sign in to contact us</h2>
                    <p className="text-small text-muted mb-6 leading-relaxed max-w-md mx-auto">
                      Contact messages are tied to your account so our admin team can reply to the right person.
                    </p>
                    <Link href={`/login?redirect=${encodeURIComponent("/contact")}`}>
                      <Button variant="primary" size="md">Sign in to continue</Button>
                    </Link>
                  </div>
                ) : submitted ? (
                  <div className="text-center py-12">
                    <p className="text-caption font-semibold uppercase tracking-[0.16em]
                                  text-gold mb-3">
                      Message received
                    </p>
                    <p className="font-serif font-bold text-charcoal text-h2 mb-3">
                      Thank you!
                    </p>
                    <p className="text-small text-muted mb-6 leading-relaxed max-w-xs mx-auto">
                      We&apos;ll get back to you within one business day.
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setSubmitted(false)}>
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-sm border border-border bg-slate/40 p-4">
                      <div className="min-w-0"><p className="text-caption font-semibold uppercase tracking-wider text-muted">Sending as</p><p className="mt-1 truncate text-small font-semibold text-charcoal">{`${currentUser.firstName} ${currentUser.lastName}`.trim()}</p></div>
                      <div className="min-w-0"><p className="text-caption font-semibold uppercase tracking-wider text-muted">Reply email</p><p className="mt-1 truncate text-small font-semibold text-charcoal">{currentUser.email}</p></div>
                    </div>
                    <Input id="contact-subject" label="Subject"
                      placeholder="How can we help?"
                      error={errors.subject?.message} required
                      {...register("subject")} />
                    <Textarea id="contact-message" label="Message"
                      placeholder="Tell us more about your inquiry…"
                      error={errors.message?.message} required
                      {...register("message")} />
                    <Button type="submit" variant="primary" size="md"
                      fullWidth loading={isSubmitting}>
                      Send message
                    </Button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-navy text-center">
        <div className="container-page">
          <div className="w-8 h-px bg-gold/35 mx-auto mb-8" />
          <h2 className="font-serif font-bold text-gold text-h1 mb-4">
            Looking for pricing?
          </h2>
          <p className="text-small text-white/55 mb-8 max-w-sm mx-auto leading-relaxed">
            See our plans — starting at ₱449 per event.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/pricing">
              <Button variant="secondary" size="md">View pricing</Button>
            </Link>
            <Link href="/faq">
              <Button variant="primary" size="md"
                className="text-white/60 border-white/15 hover:bg-white/8 hover:text-white">
                Read FAQ
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
