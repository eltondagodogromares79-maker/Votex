import type { Metadata } from "next";
import { LegalPage } from "@/src/features/public/components/legal/LegalPage";
import { getPublicLegalPolicy } from "@/src/features/public/api/publicServer";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getPublicLegalPolicy("terms");
  return { title: policy?.title ?? "Terms & Conditions", description: (policy?.intro ?? "Terms governing use of the VoteX pageant platform.").slice(0, 160), alternates: { canonical: "/terms" } };
}

export default async function TermsPage() {
  return <LegalPage policy={await getPublicLegalPolicy("terms")} />;
}
