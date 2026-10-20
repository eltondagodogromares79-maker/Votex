import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import { NotificationInbox } from "@/src/features/notifications/components/NotificationInbox";

export default function CoordinatorNotificationsPage() {
  return <CoordinatorPageShell hero title="Notifications" subtitle="Assignments, reminders, and account updates." breadcrumbs={[{ label: "Assigned pageants", href: "/coordinator/pageants" }, { label: "Notifications" }]}><NotificationInbox /></CoordinatorPageShell>;
}
