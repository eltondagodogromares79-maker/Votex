import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { NotificationInbox } from "@/src/features/notifications/components/NotificationInbox";

export default function AdminNotificationsPage() {
  return <AdminPageShell title="Notifications" subtitle="Updates for your administrator account."><NotificationInbox /></AdminPageShell>;
}
