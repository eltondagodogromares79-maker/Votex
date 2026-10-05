import type { Metadata } from "next";
import { REFUND_CONTENT } from "@/src/content/legal/refund";
import { LegalPage } from "@/src/features/public/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Votex Refund Policy — conditions and process for requesting a refund.",
};

export default function RefundPolicyPage() {
  return <LegalPage content={REFUND_CONTENT} />;
}
