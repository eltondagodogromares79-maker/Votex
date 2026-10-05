import { useMutation } from "@tanstack/react-query";

import { authApi, RegisterOrganizationRequest } from "../api/authentication";

export function useRegisterOrganization() {
  return useMutation({
    mutationFn: (data: RegisterOrganizationRequest) =>
      authApi.registerOrganization(data),
  });
}