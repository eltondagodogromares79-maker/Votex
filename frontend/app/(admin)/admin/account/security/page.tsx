"use client";

import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import PasswordChangeForm from "@/src/features/auth/components/PasswordChangeForm";

export default function AdminSecurityPage() {
  return (
    <AdminPageShell title="Security" subtitle="Administrator account security.">
      <div className="max-w-4xl"><PasswordChangeForm /></div>
    </AdminPageShell>
  );
}
