"use client";

import { useState } from "react";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { Button } from "@/src/components/ui/Button";

const fieldLabel = "block text-small font-medium text-charcoal mb-1.5";
const fieldInput  = "w-full h-10 px-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors";

const FAQ = [
  { q: "How do I add a judge to a pageant?",        a: "Go to Teams → Judges, click '+ Add Judge', enter their details, generate a login code, and assign them to a pageant. They'll receive their code by email." },
  { q: "Can I have multiple active pageants?",       a: "Yes. The number of active pageants depends on your subscription plan. The Pro plan supports up to 10 simultaneous events." },
  { q: "How does audience voting revenue work?",     a: "Audience members purchase vote packages via GCash, Maya, or card. The total collected flows to your organization's income, visible on your dashboard." },
  { q: "How do I export scoring results?",           a: "Navigate to the pageant's Results section and click Export. Results are available in CSV and PDF formats." },
  { q: "What happens if a judge disconnects mid-scoring?", a: "Draft scores are saved automatically. The judge can reconnect and pick up where they left off without losing any data." },
];

const TICKETS = [
  { id: "TKT-001", subject: "Unable to lock scoring for Round 2",     status: "open",     date: "Jun 13, 2026", priority: "high"   },
  { id: "TKT-002", subject: "Invoice for May not received",           status: "resolved", date: "May 20, 2026", priority: "medium" },
  { id: "TKT-003", subject: "Judge login code not working",           status: "resolved", date: "May 5, 2026",  priority: "low"    },
];

const TICKET_STATUS: Record<string, { label: string; variant: "success"|"warning"|"muted" }> = {
  open:     { label: "Open",     variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  pending:  { label: "Pending",  variant: "muted"   },
};

const PRIORITY_BADGE: Record<string, { label: string; variant: "error"|"gold"|"muted" }> = {
  high:   { label: "High",   variant: "error" },
  medium: { label: "Medium", variant:   "gold"  },
  low:    { label: "Low",    variant: "muted" },
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-serif font-semibold text-charcoal text-h3">{title}</h3>
        {description && <p className="text-small text-muted mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group">
        <p className="text-small font-medium text-charcoal group-hover:text-navy transition-colors">{q}</p>
        <svg className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <p className="text-small text-muted leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [category, setCategory] = useState("");
  const [message,  setMessage]  = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <OrgPageShell
      title="Contact & Support"
      subtitle="Get help, browse FAQs, and view your open support tickets."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Settings",  href: "/org_owner/settings" },
        { label: "Contact & Support" },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">

        {/* Left — contact form + tickets */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick contact channels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "📧", label: "Email Support",   value: "support@votex.app",   sub: "Reply within 24 hrs" },
              { icon: "💬", label: "Live Chat",        value: "Chat with us",         sub: "Mon–Fri, 9AM–6PM" },
              { icon: "📖", label: "Documentation",   value: "docs.votex.app",       sub: "Guides & tutorials" },
            ].map((ch) => (
              <div key={ch.label} className="bg-surface border border-border px-4 py-4">
                <p className="text-[1.25rem] mb-2" aria-hidden="true">{ch.icon}</p>
                <p className="text-caption font-semibold uppercase tracking-[0.1em] text-muted mb-0.5">{ch.label}</p>
                <p className="text-small font-semibold text-navy">{ch.value}</p>
                <p className="text-caption text-muted mt-0.5">{ch.sub}</p>
              </div>
            ))}
          </div>

          {/* Submit ticket */}
          <Section title="Submit a Support Ticket" description="Describe your issue and our team will get back to you.">
            {submitted ? (
              <div className="flex items-start gap-3 bg-success/8 border border-success/20 px-4 py-4">
                <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <div>
                  <p className="text-small font-semibold text-success">Ticket submitted!</p>
                  <p className="text-caption text-muted mt-0.5">We&apos;ll respond to your ticket within 24 hours. Check your email for updates.</p>
                  <button type="button" onClick={() => { setSubmitted(false); setCategory(""); setMessage(""); }}
                    className="text-caption text-navy hover:underline mt-2 font-medium">Submit another</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={fieldLabel}>Subject <span className="text-error">*</span></label>
                    <input type="text" required placeholder="Briefly describe the issue" className={fieldInput} />
                  </div>
                  <div>
                    <label className={fieldLabel}>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldInput + " bg-surface"}>
                      <option value="">Select a category…</option>
                      <option>Scoring & Tabulation</option>
                      <option>Team Management</option>
                      <option>Billing & Payments</option>
                      <option>Login & Access</option>
                      <option>Pageant Setup</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={fieldLabel}>Message <span className="text-error">*</span></label>
                  <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail. Include steps to reproduce it, if applicable."
                    className="w-full px-3 py-2.5 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors resize-none" />
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" type="submit">Submit Ticket</Button>
                </div>
              </form>
            )}
          </Section>

          {/* My tickets */}
          <Section title="My Support Tickets" description="Track the status of your submitted requests.">
            {TICKETS.length === 0 ? (
              <p className="text-small text-muted text-center py-4">No tickets yet.</p>
            ) : (
              <div className="space-y-1">
                {TICKETS.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between gap-4 py-3.5 border-b border-border/60 last:border-b-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-caption text-muted">{ticket.id}</span>
                        <OrgBadge variant={PRIORITY_BADGE[ticket.priority].variant}>
                          {PRIORITY_BADGE[ticket.priority].label}
                        </OrgBadge>
                      </div>
                      <p className="text-small font-medium text-charcoal truncate">{ticket.subject}</p>
                      <p className="text-caption text-muted mt-0.5">{ticket.date}</p>
                    </div>
                    <OrgBadge variant={TICKET_STATUS[ticket.status].variant}>
                      {TICKET_STATUS[ticket.status].label}
                    </OrgBadge>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right — FAQ */}
        <div>
          <div className="bg-surface border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-serif font-semibold text-charcoal text-h3">FAQ</h3>
              <p className="text-small text-muted mt-0.5">Common questions answered.</p>
            </div>
            <div className="px-5">
              {FAQ.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>

          {/* Status page */}
          <div className="mt-4 bg-surface border border-border px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <p className="text-small font-semibold text-charcoal">All systems operational</p>
            </div>
            <p className="text-caption text-muted leading-relaxed">
              No incidents reported. Check{" "}
              <a href="#" className="text-navy hover:underline">status.votex.app</a>
              {" "}for real-time uptime.
            </p>
          </div>
        </div>

      </div>
    </OrgPageShell>
  );
}
