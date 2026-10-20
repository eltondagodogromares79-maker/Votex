/**
 * AuthLogo — uses the same logo asset, dimensions, and presentation as the public header.
 *
 * The logo appears on the left brand panel on larger screens. Auth pages omit
 * the logo header on mobile to give the form more room.
 */

import Image from "next/image";
import Link from "next/link";

/** Logo on the left brand panel — absolute positioned, anchored top-left */
export function AuthLogoBrandPanel() {
  return (
    <Link
      href="/"
      className="absolute top-8 left-10 xl:left-14 z-10 flex items-center"
      aria-label="Votex — home"
    >
      <Image
        src="/votex-logo.png"
        alt=""
        width={100}
        height={100}
        priority
        className="h-auto w-auto"
      />
    </Link>
  );
}
