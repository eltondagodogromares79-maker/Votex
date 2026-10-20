import { cache } from "react";
import type { PublicLegalPolicy, PublicPageant, PublicPageantDetails, PublicSubscriptionPlan } from "./publicCatalog";

const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function camelize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase()),
    camelize(item),
  ]));
}

async function getPublicJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${backendUrl}/api/v1/audience/public${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    return camelize(await response.json()) as T;
  } catch {
    return null;
  }
}

export const getPublicPageants = cache(() => getPublicJson<PublicPageant[]>("/pageants"));

export const getPublicPageant = cache((slug: string) =>
  getPublicJson<PublicPageantDetails>(`/pageants/${encodeURIComponent(slug)}`),
);

export const getPublicPlans = cache(() => getPublicJson<PublicSubscriptionPlan[]>("/subscription-plans"));

export const getPublicLegalPolicy = cache((slug: PublicLegalPolicy["slug"]) =>
  getPublicJson<PublicLegalPolicy>(`/legal-policies/${slug}`),
);
