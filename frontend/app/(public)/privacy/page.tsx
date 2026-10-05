import type { Metadata } from "next";
import { PRIVACY_CONTENT } from "@/src/content/legal/privacy";
import { LegalPage } from "@/src/features/public/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Votex Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return <LegalPage content={PRIVACY_CONTENT} />;
}
