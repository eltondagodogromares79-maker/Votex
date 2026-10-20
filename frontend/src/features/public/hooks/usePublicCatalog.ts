import { useQuery } from "@tanstack/react-query";
import { publicCatalogApi, type PublicPageant, type PublicPageantDetails, type PublicSubscriptionPlan } from "../api/publicCatalog";

export function usePublicPageants(initialData?: PublicPageant[]) {
  return useQuery({
    queryKey: ["public", "pageants"],
    queryFn: publicCatalogApi.listPageants,
    initialData,
    staleTime: 60_000,
  });
}

export function usePublicPageant(slug: string, initialData?: PublicPageantDetails) {
  return useQuery({
    queryKey: ["public", "pageants", slug],
    queryFn: () => publicCatalogApi.getPageant(slug),
    enabled: !!slug,
    initialData,
    staleTime: 60_000,
  });
}

export function usePublicPlans(initialData?: PublicSubscriptionPlan[]) {
  return useQuery({
    queryKey: ["public", "subscription-plans"],
    queryFn: publicCatalogApi.listPlans,
    initialData,
    staleTime: 60_000,
  });
}
