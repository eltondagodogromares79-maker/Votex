"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { useStartVote, useVotePackages } from "@/src/features/audience/hooks/useAudienceVoting";
import { usePublicPageant } from "@/src/features/public/hooks/usePublicCatalog";
import type { PublicContestant, PublicPageantDetails } from "@/src/features/public/api/publicCatalog";
import { ApiError } from "@/src/lib/api/client";

function formatMoney(amount: string, currency: string) {
  const value = Number(amount);
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(value)
    : `${currency} ${amount}`;
}

function ContestantCard({
  contestant,
  canVote,
  onBuyVotes,
}: {
  contestant: PublicContestant;
  canVote: boolean;
  onBuyVotes: (contestant: PublicContestant) => void;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-sm bg-surface shadow-sm">
      <div className="relative h-64 bg-navy/10">
        {contestant.photoUrl ? (
          <Image src={contestant.photoUrl} alt={`Contestant ${contestant.contestantNumber}: ${contestant.displayName}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" quality={75} className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy to-gold/50 font-serif text-5xl font-bold text-white">
            {contestant.contestantNumber}
          </div>
        )}
        <span className="absolute left-3 top-3 bg-navy px-3 py-1 text-caption font-semibold text-white">
          #{contestant.contestantNumber}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-h3 font-bold text-charcoal">{contestant.displayName}</h3>
        {contestant.gender && <p className="mt-1 text-caption uppercase tracking-wide text-muted">{contestant.gender}</p>}
        {contestant.biography && <p className="mt-3 line-clamp-4 whitespace-pre-line text-small leading-relaxed text-muted">{contestant.biography}</p>}
        {canVote && (
          <Button className="mt-auto w-full pt-5" variant="secondary" size="md" onClick={() => onBuyVotes(contestant)}>
            Buy votes
          </Button>
        )}
      </div>
    </article>
  );
}

export default function PublicPageantDetailsPage({ slug, initialData }: { slug: string; initialData?: PublicPageantDetails }) {
  const { currentUser } = useSession();
  const canVote = currentUser?.role === "audience";
  const { data, isLoading, refetch } = usePublicPageant(slug, initialData);
  const { data: packages = [], isLoading: packagesLoading, isError: packagesError } = useVotePackages(data?.pageant.id ?? "", canVote);
  const startVote = useStartVote(data?.pageant.id ?? "");
  const [search, setSearch] = useState("");
  const [selectedContestant, setSelectedContestant] = useState<PublicContestant | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [voteError, setVoteError] = useState("");

  const contestants = (data?.contestants ?? []).filter((contestant) =>
    `${contestant.displayName} ${contestant.contestantNumber} ${contestant.biography ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  async function continueToCheckout() {
    if (!selectedContestant || !selectedPackageId) return;
    setVoteError("");
    try {
      const vote = await startVote.mutateAsync({ contestantId: selectedContestant.id, packageId: selectedPackageId });
      if (vote.checkoutUrl) {
        window.location.assign(vote.checkoutUrl);
      } else {
        setVoteError("Your free votes were submitted successfully.");
        setSelectedContestant(null);
      }
    } catch (error) {
      setVoteError(error instanceof ApiError ? error.userMessage : "We could not start this vote purchase. Please try again.");
    }
  }

  if (!data && isLoading) {
    return <main className="min-h-[60vh] bg-slate py-16"><div className="container-page"><div className="h-96 animate-pulse bg-surface" /></div></main>;
  }

  if (!data) {
    return (
      <main className="min-h-[60vh] bg-slate py-16">
        <div className="container-page text-center">
          <h1 className="font-serif text-h2 font-bold text-charcoal">Pageant not found</h1>
          <p className="mt-3 text-small text-muted">This pageant may be private or no longer available.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="ghost" size="md" onClick={() => refetch()}>Try again</Button>
            <Link href="/pageants"><Button variant="secondary" size="md">All pageants</Button></Link>
          </div>
        </div>
      </main>
    );
  }

  const pageant = data.pageant;
  const eventDate = pageant.eventDate
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "long" }).format(new Date(pageant.eventDate))
    : "Date to be announced";

  return (
    <main className="bg-slate">
      <section className="bg-navy py-12 sm:py-16">
        <div className="container-page">
          <Link href="/pageants" className="text-caption font-medium text-white/65 hover:text-gold">← All pageants</Link>
          <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] md:items-center">
            <div>
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold">Pageant details</p>
              <h1 className="mt-3 font-serif text-[1.8rem] font-bold leading-tight text-white sm:text-[2.5rem]">{pageant.name}</h1>
              {pageant.description && <p className="mt-4 max-w-2xl whitespace-pre-line text-small leading-relaxed text-white/65">{pageant.description}</p>}
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-small text-white/75">
                <span>{pageant.venue || "Venue to be announced"}</span>
                <span>{eventDate}</span>
                <span>{pageant.contestantCount} contestants</span>
              </div>
            </div>
            <div className="relative h-56 overflow-hidden rounded-sm bg-white/5 sm:h-72">
              {pageant.logoUrl ? (
                <Image src={pageant.logoUrl} alt={`Cover image for ${pageant.name}`} fill preload sizes="(max-width: 768px) 100vw, 40vw" quality={75} className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy via-navy/75 to-gold/50 px-6 text-center font-serif text-2xl font-bold text-white">{pageant.name}</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-page">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold">Meet the contestants</p>
              <h2 className="mt-2 font-serif text-h2 font-bold text-charcoal">Contestants</h2>
            </div>
            <label className="w-full sm:max-w-sm">
              <span className="sr-only">Search contestants</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search contestants…" className="h-11 w-full rounded-sm border border-border bg-surface px-4 text-small text-charcoal placeholder:text-muted/60 focus:border-navy focus:outline-none" />
            </label>
          </div>

          {contestants.length === 0 ? (
            <div className="bg-surface px-6 py-16 text-center">
              <h3 className="font-serif text-h3 font-bold text-charcoal">{data.contestants.length === 0 ? "Contestants have not been added yet" : "No contestants match your search"}</h3>
              <p className="mt-2 text-small text-muted">{data.contestants.length === 0 ? "Check back later for contestant updates." : "Try another name or contestant number."}</p>
            </div>
          ) : (
            <>
              <p className="mb-5 text-caption text-muted">Showing {contestants.length} of {data.contestants.length} contestants</p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {contestants.map((contestant) => <ContestantCard key={contestant.id} contestant={contestant} canVote={canVote} onBuyVotes={(item) => { setSelectedContestant(item); setSelectedPackageId(""); setVoteError(""); }} />)}
              </div>
            </>
          )}

          {!canVote && data.contestants.length > 0 && (
            <div className="mt-8 border border-border bg-surface p-5 text-center">
              <p className="text-small text-muted">Voting purchases are available to audience accounts.</p>
              {!currentUser && <Link href="/login" className="mt-2 inline-block text-small font-semibold text-navy underline">Sign in to vote</Link>}
            </div>
          )}
        </div>
      </section>

      {selectedContestant && canVote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedContestant(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="vote-dialog-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption font-semibold uppercase tracking-widest text-gold">Audience voting</p>
                <h2 id="vote-dialog-title" className="mt-1 font-serif text-h3 font-bold text-charcoal">Buy votes for {selectedContestant.displayName}</h2>
              </div>
              <button type="button" onClick={() => setSelectedContestant(null)} aria-label="Close" className="text-xl text-muted hover:text-charcoal">×</button>
            </div>
            {packagesLoading ? (
              <div className="mt-6 h-28 animate-pulse bg-slate" />
            ) : packagesError ? (
              <p className="mt-6 text-small text-error">Voting packages could not be loaded. Voting may not be open.</p>
            ) : packages.length === 0 ? (
              <p className="mt-6 text-small text-muted">There are no active vote packages. Voting may not be open for this pageant.</p>
            ) : (
              <fieldset className="mt-6 space-y-3">
                <legend className="mb-3 text-small font-semibold text-charcoal">Choose a vote package</legend>
                {packages.map((votePackage) => (
                  <label key={votePackage.id} className={`flex cursor-pointer items-center justify-between gap-4 border p-4 ${selectedPackageId === votePackage.id ? "border-navy bg-navy/5" : "border-border"}`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="vote-package" value={votePackage.id} checked={selectedPackageId === votePackage.id} onChange={() => setSelectedPackageId(votePackage.id)} />
                      <span><span className="block text-small font-semibold text-charcoal">{votePackage.name}</span><span className="text-caption text-muted">{votePackage.voteQuantity} votes</span></span>
                    </span>
                    <span className="text-small font-semibold text-charcoal">{formatMoney(votePackage.priceAmount, votePackage.currency)}</span>
                  </label>
                ))}
              </fieldset>
            )}
            {voteError && <p role="status" className="mt-4 text-small text-error">{voteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" size="md" onClick={() => setSelectedContestant(null)}>Close</Button>
              <Button variant="secondary" size="md" disabled={!selectedPackageId || startVote.isPending || packages.length === 0} onClick={continueToCheckout}>
                {startVote.isPending ? "Starting…" : "Continue to checkout"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
