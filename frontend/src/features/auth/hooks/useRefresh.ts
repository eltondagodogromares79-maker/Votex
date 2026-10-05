import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/authentication";

export function useRefresh() {
  return useMutation({
    mutationFn: () => authApi.refresh(),
  });
}
