import type { Metadata } from "next";
import PublicPageantDetailsClient from "./PublicPageantDetailsClient";
import { getPublicPageant } from "@/src/features/public/api/publicServer";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const details = await getPublicPageant(slug);
  if (!details) {
    return { title: "Pageant Details", description: "View public pageant details and contestant information on VoteX." };
  }
  const description = details.pageant.description?.trim()
    || `${details.pageant.name}: view event details and meet ${details.contestants.length} contestants on VoteX.`;
  return {
    title: details.pageant.name,
    description: description.slice(0, 160),
    alternates: { canonical: `/pageants/${encodeURIComponent(details.pageant.slug)}` },
    openGraph: {
      title: `${details.pageant.name} | VoteX`,
      description: description.slice(0, 200),
      images: details.pageant.logoUrl ? [{ url: details.pageant.logoUrl, alt: `${details.pageant.name} pageant cover` }] : undefined,
    },
  };
}

export default async function PublicPageantDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const details = await getPublicPageant(slug);
  return <PublicPageantDetailsClient slug={slug} initialData={details ?? undefined} />;
}
