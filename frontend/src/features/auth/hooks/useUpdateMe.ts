import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, type UpdateMeRequest } from "../api/authentication";
import { ME_QUERY_KEY } from "./useMe";

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMeRequest) => authApi.updateMe(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(ME_QUERY_KEY, updated);
    },
  });
}
