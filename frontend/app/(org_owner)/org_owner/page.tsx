import { redirect } from "next/navigation";

// Root /org_owner redirects to the dashboard
export default function OrgOwnerRootPage() {
  redirect("/org_owner/dashboard");
}
