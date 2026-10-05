"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/src/lib/utils";

const SUB_NAV = [
  { label: "Overview",    seg: ""            },
  { label: "Candidates",  seg: "candidates"  },
  { label: "Categories",  seg: "categories"  },
  { label: "Rounds",      seg: "rounds"      },
  { label: "Judges",      seg: "judges"      },
  { label: "Tabulators",  seg: "tabulators"  },
];

export default function PageantDetailLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { pageantId } = useParams<{ pageantId: string }>();
  const base = `/coordinator/pageants/${pageantId}`;

  return (
    <div>
      {/* Sub-navigation tab bar */}
      <div className="border-b border-border bg-surface px-6 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {SUB_NAV.map((item) => {
            const href   = item.seg ? `${base}/${item.seg}` : base;
            const active = item.seg
              ? pathname === href || pathname.startsWith(`${href}/`)
              : pathname === base;
            return (
              <Link key={item.label} href={href}
                className={cn(
                  "h-11 px-4 flex items-center text-small font-medium border-b-2 transition-colors whitespace-nowrap",
                  active
                    ? "border-navy text-navy"
                    : "border-transparent text-muted hover:text-charcoal hover:border-border",
                )}>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
