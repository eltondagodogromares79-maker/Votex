import type { Metadata } from "next";
import { LegalPage } from "@/src/features/public/components/legal/LegalPage";
import { getPublicLegalPolicy } from "@/src/features/public/api/publicServer";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getPublicLegalPolicy("refund-policy");
  return { title: policy?.title ?? "Refund Policy", description: (policy?.intro ?? "VoteX subscription refund eligibility and request process.").slice(0, 160), alternates: { canonical: "/refund-policy" } };
}

export default async function RefundPolicyPage() {
  return <LegalPage policy={await getPublicLegalPolicy("refund-policy")} />;
}
