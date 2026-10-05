import { useMutation } from "@tanstack/react-query";

import { authApi, RegisterAudienceRequest } from "../api/authentication";

export function useRegisterAudience() {
  return useMutation({
    mutationFn: (data: RegisterAudienceRequest) =>
      authApi.registerAudience(data),
  });
}