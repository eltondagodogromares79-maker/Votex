import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";
import { Providers } from "@/src/components/layout/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-serif-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Votex — Pageant Management Platform",
    template: "%s | Votex",
  },
  description:
    "Votex is a modern pageant management platform for coordinators, judges, tabulators, and contestants. Streamline scoring, tabulation, and live results.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    siteName: "Votex",
    type: "website",
    locale: "en_PH",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cinzel.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
