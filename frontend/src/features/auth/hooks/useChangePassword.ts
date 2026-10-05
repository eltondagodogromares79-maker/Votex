import { useMutation } from "@tanstack/react-query";
import { authApi, type ChangePasswordRequest } from "../api/authentication";

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
  });
}
