/**
 * AuthLogo — logo image + wordmark used in all auth page panels.
 *
 * Matches the public Header logo:  /votex-logo.png  +  "VOTEX" below.
 *
 * Two variants:
 *   panel   — absolute-positioned on the left brand panel (desktop)
 *   mobile  — inline in the mobile top bar
 */

import Image from "next/image";
import Link from "next/link";

/** Logo on the left brand panel — absolute positioned, anchored top-left */
export function AuthLogoBrandPanel() {
  return (
    <Link
      href="/"
      className="absolute top-8 left-10 xl:left-14 z-10 flex flex-col items-center gap-1
                 font-serif font-bold text-gold tracking-[0.18em]"
      aria-label="Votex — home"
    >
      <Image
        src="/votex-logo.png"
        alt=""
        width={48}
        height={48}
        priority
        className="h-12 w-12 object-contain drop-shadow-md"
      />
      <span className="text-[0.7rem] leading-none">VOTEX</span>
    </Link>
  );
}

/** Logo in the mobile top bar — inline, natural flow */
export function AuthLogoMobile() {
  return (
    <Link
      href="/"
      className="flex flex-col items-center gap-0.5 font-serif font-bold text-gold tracking-[0.18em]"
      aria-label="Votex — home"
    >
      <Image
        src="/votex-logo.png"
        alt=""
        width={32}
        height={32}
        priority
        className="h-8 w-8 object-contain"
      />
      <span className="text-[0.65rem] leading-none">VOTEX</span>
    </Link>
  );
}
