import { useMutation } from "@tanstack/react-query";
import { authApi, type VerifyEmailRequest } from "../api/authentication";

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => authApi.verifyEmail(data),
  });
}
