import type { Metadata } from "next";
import { TERMS_CONTENT } from "@/src/content/legal/terms";
import { LegalPage } from "@/src/features/public/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Votex Terms & Conditions governing use of the platform.",
};

export default function TermsPage() {
  return <LegalPage content={TERMS_CONTENT} />;
}
