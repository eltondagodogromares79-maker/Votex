import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, type ChangePasswordRequest } from "../api/authentication";
import { ME_QUERY_KEY } from "./useMe";

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  });
}
