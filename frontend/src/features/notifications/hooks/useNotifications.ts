import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { notificationsApi } from "../api/notifications";

export function useNotifications(limit = 30, offset = 0) {
  const { currentUser } = useSession();
  return useQuery({
    queryKey: ["notifications", currentUser?.userId, limit, offset],
    queryFn: () => notificationsApi.list(limit, offset),
    enabled: !!currentUser,
    refetchInterval: 30_000,
  });
}

export function useNotificationActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: invalidate });
  return { markRead, markAllRead };
}
