import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/src/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/org_owner/", "/coordinator/", "/judge/", "/tabulator/", "/audience/", "/api/", "/login", "/register", "/forgot-password", "/reset-password"],
    },
    sitemap: new URL("/sitemap.xml", SITE_CONFIG.url).toString(),
  };
}
