import type { Metadata } from "next";
import { LegalPage } from "@/src/features/public/components/legal/LegalPage";
import { getPublicLegalPolicy } from "@/src/features/public/api/publicServer";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getPublicLegalPolicy("privacy");
  return { title: policy?.title ?? "Privacy Policy", description: (policy?.intro ?? "How VoteX collects, uses, and protects personal information.").slice(0, 160), alternates: { canonical: "/privacy" } };
}

export default async function PrivacyPage() {
  return <LegalPage policy={await getPublicLegalPolicy("privacy")} />;
}
