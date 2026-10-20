import type { Metadata } from "next";
import { LegalPage } from "@/src/features/public/components/legal/LegalPage";

import { getPublicLegalPolicy } from "@/src/features/public/api/publicServer";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getPublicLegalPolicy("cookie-policy");
  return { title: policy?.title ?? "Cookie Policy", description: (policy?.intro ?? "How VoteX uses essential cookies to support secure sessions.").slice(0, 160), alternates: { canonical: "/cookie-policy" } };
}

export default async function CookiePolicyPage() {
  return <LegalPage policy={await getPublicLegalPolicy("cookie-policy")} />;
}
