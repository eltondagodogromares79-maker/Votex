import { api } from "@/src/lib/api/client";

export interface NotificationItem {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationItem[];
  unreadCount: number;
  total: number;
  limit: number;
  offset: number;
}

export const notificationsApi = {
  list: async (limit = 30, offset = 0): Promise<NotificationPage> => {
    const response = await api.get<NotificationPage>("/api/v1/notifications", { params: { limit, offset } });
    return response.data;
  },
  markRead: async (id: string): Promise<void> => {
    await api.post(`/api/v1/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await api.post("/api/v1/notifications/read-all");
  },
};
