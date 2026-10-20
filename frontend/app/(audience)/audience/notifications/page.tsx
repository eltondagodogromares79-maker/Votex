"use client";

import { PageShell } from "@/src/components/layout/PageShell";
import { NotificationInbox } from "@/src/features/notifications/components/NotificationInbox";

export default function AudienceNotificationsPage() {
  return <PageShell title="Notifications" breadcrumbs={[{ label: "Home", href: "/audience" }, { label: "Notifications" }]}><NotificationInbox /></PageShell>;
}
