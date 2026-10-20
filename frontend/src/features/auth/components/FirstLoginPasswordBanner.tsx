"use client";

import Link from "next/link";
import { MdLock } from "react-icons/md";
import { useSession } from "../context/SessionContext";

const SECURITY_PATH: Record<string, string> = {
  admin: "/admin/account/security",
  org_owner: "/org_owner/settings/security",
  coordinator: "/coordinator/account/security",
  judge: "/judge/account/security",
  tabulator: "/tabulator/account/security",
  audience: "/audience/account/security",
};

export default function FirstLoginPasswordBanner() {
  const { currentUser } = useSession();
  if (!currentUser?.mustChangePassword) return null;

  const href = SECURITY_PATH[currentUser.role] ?? "/account/security";

  return (
    <aside role="status" className="border-b border-gold/35 bg-navy text-white">
      <div className="container-page flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm leading-5">
          <MdLock className="mt-0.5 shrink-0 text-gold" />
          <span><strong className="text-gold">Secure your account:</strong> change your temporary password.</span>
        </p>
        <Link href={href} className="inline-flex min-h-9 items-center justify-center border border-gold/50 px-3 text-xs font-semibold text-gold transition-colors hover:bg-gold hover:text-navy">
          Change password
        </Link>
      </div>
    </aside>
  );
}
