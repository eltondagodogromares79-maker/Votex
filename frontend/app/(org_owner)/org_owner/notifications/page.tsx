import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import { NotificationInbox } from "@/src/features/notifications/components/NotificationInbox";

export default function OrganizationOwnerNotificationsPage() {
  return <OrgPageShell title="Notifications" subtitle="Updates for your organization account."><NotificationInbox /></OrgPageShell>;
}
