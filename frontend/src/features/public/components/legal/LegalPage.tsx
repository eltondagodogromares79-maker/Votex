import type { PublicLegalPolicy } from "@/src/features/public/api/publicCatalog";

function PolicyBody({ body }: { body: string }) {
  const blocks = body.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="max-w-3xl space-y-6">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        if (lines[0]?.startsWith("## ")) {
          return <section key={index}>
            <h2 className="mb-2 font-sans text-h3 font-semibold text-charcoal">{lines[0].slice(3)}</h2>
            {lines.slice(1).map((line, lineIndex) => <p key={lineIndex} className="text-body leading-relaxed text-muted">{line}</p>)}
          </section>;
        }
        if (lines.every((line) => line.startsWith("- "))) {
          return <ul key={index} className="list-disc space-y-2 pl-6 text-body leading-relaxed text-muted">
            {lines.map((line, lineIndex) => <li key={lineIndex}>{line.slice(2)}</li>)}
          </ul>;
        }
        return <p key={index} className="whitespace-pre-line text-body leading-relaxed text-muted">{block}</p>;
      })}
    </div>
  );
}

export function LegalPage({ policy }: { policy: PublicLegalPolicy | null }) {
  return policy ? <>
    <section className="bg-navy py-16">
      <div className="container-page">
        <h1 className="mb-2 font-serif text-h1 text-gold">{policy.title}</h1>
        <p className="text-caption text-white/60">Last updated: {new Date(policy.updatedAt).toLocaleDateString()}</p>
      </div>
    </section>
    <section className="bg-slate py-12">
      <div className="container-page">
        {policy.intro && <p className="mb-10 max-w-3xl text-body leading-relaxed text-muted">{policy.intro}</p>}
        <PolicyBody body={policy.body} />
      </div>
    </section>
  </> : <main className="container-page min-h-[50vh] py-16">
    <div role="status" className="border border-border bg-surface p-6 text-small text-muted">This policy is temporarily unavailable. Please try again later.</div>
  </main>;
}
