interface LegalSection {
  id: string;
  heading: string;
  body: string;
}

interface LegalContent {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: readonly LegalSection[];
}

interface LegalPageProps {
  content: LegalContent;
}

export function LegalPage({ content }: LegalPageProps) {
  return (
    <>
      <section className="bg-navy py-16">
        <div className="container-page">
          <h1 className="text-h1 font-serif text-gold mb-2">{content.title}</h1>
          <p className="text-caption text-white/40">
            Last updated: {content.lastUpdated}
          </p>
        </div>
      </section>

      <section className="py-12 bg-slate">
        <div className="container-page">
          <p className="text-body text-muted mb-10 max-w-2xl">{content.intro}</p>

          <div className="max-w-2xl space-y-10">
            {content.sections.map((section) => (
              <div key={section.id} id={section.id}>
                <h2 className="text-h3 font-sans font-semibold text-charcoal mb-3">
                  {section.heading}
                </h2>
                <div className="text-body text-muted whitespace-pre-line leading-relaxed">
                  {section.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
