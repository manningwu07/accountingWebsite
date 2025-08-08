// components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";
import { BarChart3, ClipboardEdit, PlusSquare } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const items = [
    { href: "/add", label: "Add Mode", icon: PlusSquare },
    { href: "/edit", label: "Edit Mode", icon: ClipboardEdit },
    { href: "/analysis", label: "Analysis", icon: BarChart3 },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-56 flex-shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--panel))] p-4 md:block">
      <div className="mb-6 px-2 text-lg font-semibold">Zero-DB Accounting</div>
      <nav className="space-y-1">
        {items.map((it) => {
          const active = pathname === it.href;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-[hsl(var(--muted))] text-white"
                  : "text-subtle hover:bg-[hsl(var(--muted))]"
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}