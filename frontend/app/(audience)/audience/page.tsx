"use client";

import { PageShell } from "@/src/components/layout/PageShell";
import { Card } from "@/src/components/ui/Card";
import { EmptyState, ListEmptyIcon } from "@/src/components/ui/EmptyState";
import Link from "next/link";

export default function AudienceDashboard() {
  return (
    <PageShell
      title="Welcome"
      breadcrumbs={[{ label: "Home" }]}
    >
      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link href="/audience/pageants">
          <Card
            padding="md"
            className="hover:bg-slate/50 transition-colors cursor-pointer h-full"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 bg-navy/8 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <div>
                <p className="text-small font-semibold text-charcoal mb-0.5">Live Pageants</p>
                <p className="text-caption text-muted">Browse ongoing events and watch the action.</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/audience/votes">
          <Card
            padding="md"
            className="hover:bg-slate/50 transition-colors cursor-pointer h-full"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 bg-navy/8 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.25M4.875 9H3.75a1.125 1.125 0 00-1.125 1.125v7.5c0 .621.504 1.125 1.125 1.125h1.125a1.125 1.125 0 001.125-1.125v-7.5A1.125 1.125 0 004.875 9z" />
                </svg>
              </div>
              <div>
                <p className="text-small font-semibold text-charcoal mb-0.5">My Votes</p>
                <p className="text-caption text-muted">View your vote history and active campaigns.</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Live pageants placeholder */}
      <EmptyState
        icon={<ListEmptyIcon />}
        heading="No live pageants right now"
        description="Check back soon — live events will appear here when they start."
      />
    </PageShell>
  );
}
