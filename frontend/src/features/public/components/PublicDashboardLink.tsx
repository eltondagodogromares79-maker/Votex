"use client";

import Link from "next/link";
import { Button, type ButtonVariant } from "@/src/components/ui/Button";
import { ROLE_HOME } from "@/src/config/permissions";
import { useSession } from "@/src/features/auth/context/SessionContext";

interface PublicDashboardLinkProps {
  href: string;
  label: string;
  loggedInLabel?: string;
  variant?: ButtonVariant;
  className?: string;
  linkClassName?: string;
  fullWidth?: boolean;
}

export function PublicDashboardLink({
  href,
  label,
  loggedInLabel = "Go to Dashboard",
  variant = "secondary",
  className,
  linkClassName,
  fullWidth,
}: PublicDashboardLinkProps) {
  const { currentUser } = useSession();
  const target = currentUser ? ROLE_HOME[currentUser.role] : href;
  return (
    <Link href={target} className={linkClassName}>
      <Button variant={variant} size="md" fullWidth={fullWidth} className={className}>
        {currentUser ? loggedInLabel : label}
      </Button>
    </Link>
  );
}
