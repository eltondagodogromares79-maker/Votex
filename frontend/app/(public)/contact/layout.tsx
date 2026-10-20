import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the VoteX team for pageant platform support, billing questions, or organization inquiries.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
