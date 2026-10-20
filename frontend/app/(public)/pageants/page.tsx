import type { Metadata } from "next";
import PageantsBrowser from "./PageantsBrowser";
import { getPublicPageants } from "@/src/features/public/api/publicServer";

export const metadata: Metadata = {
  title: "Public Pageants",
  description: "Explore upcoming and live pageants powered by VoteX, and meet their contestants.",
  alternates: { canonical: "/pageants" },
};

export default async function PageantsPage() {
  const pageants = await getPublicPageants();
  return <PageantsBrowser initialPageants={pageants ?? undefined} />;
}
