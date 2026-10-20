"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MdLogout } from "react-icons/md";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { useLogout } from "@/src/features/auth/hooks/useLogout";
import { setAccessToken } from "@/src/lib/api/client";

type LogoutButtonProps = {
  loginPath: string;
  className?: string;
  iconOnly?: boolean;
};

/** Signs out remotely, then clears local auth state even if the request fails. */
export default function LogoutButton({ loginPath, className, iconOnly = false }: LogoutButtonProps) {
  const queryClient = useQueryClient();
  const { setCurrentUser } = useSession();
  const logout = useLogout();

  async function handleLogout() {
    try {
      await logout.mutateAsync();
    } catch {
      // The refresh session may already be expired or unavailable. Clear local state either way.
    } finally {
      setAccessToken(null);
      document.cookie = "at_hint=; path=/; Max-Age=0; SameSite=Lax";
      setCurrentUser(null);
      queryClient.clear();
      window.location.replace(loginPath);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={logout.isPending}
      aria-label={logout.isPending ? "Signing out" : "Log out"}
      title={iconOnly ? (logout.isPending ? "Signing out…" : "Log out") : undefined}
      className={className}
    >
      <MdLogout className="shrink-0 text-base" />
      {iconOnly ? <span className="sr-only">{logout.isPending ? "Signing out…" : "Log out"}</span> : logout.isPending ? "Signing out…" : "Log out"}
    </button>
  );
}
