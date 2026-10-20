import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/src/config/site";
import { getPublicPageants } from "@/src/features/public/api/publicServer";

const staticPaths = [
  "",
  "/about",
  "/pageants",
  "/pricing",
  "/faq",
  "/contact",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/cookie-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pageants = await getPublicPageants();
  const pages: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: new URL(path || "/", SITE_CONFIG.url).toString(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/pageants" || path === "/pricing" ? 0.8 : 0.5,
  }));

  for (const pageant of pageants ?? []) {
    pages.push({
      url: new URL(`/pageants/${encodeURIComponent(pageant.slug)}`, SITE_CONFIG.url).toString(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return pages;
}
