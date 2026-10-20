import { api } from "@/src/lib/api/client";

export interface ContactMessage {
  id: string;
  senderUserId: string | null;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: "new" | "in_progress" | "resolved";
  createdAt: string;
}

export const contactApi = {
  submit: async (data: { subject: string; message: string }): Promise<{ id: string; status: string; createdAt: string }> => {
    const response = await api.post("/api/v1/contact", data);
    return response.data;
  },
  listForAdmin: async (query?: { limit?: number; offset?: number }): Promise<{ items: ContactMessage[]; limit: number; offset: number }> => {
    const response = await api.get("/api/v1/admin/contact-messages", { params: query });
    return response.data;
  },
};
