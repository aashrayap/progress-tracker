"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Hub" },
  { href: "/plan", label: "Plan" },
  { href: "/health", label: "Health" },
  { href: "/reflect", label: "Reflect" },
] as const;

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5">
      <div className="flex items-center gap-1 py-2 px-2 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                active
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
