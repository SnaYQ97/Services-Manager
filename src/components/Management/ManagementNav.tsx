"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/management/services", label: "Usługi" },
  { href: "/management/employees", label: "Pracownicy" },
];

const ManagementNav = () => {
  const pathname = usePathname();
  return (
    <nav className="inline-flex w-fit rounded-lg bg-muted p-1">
      {tabs.map(tab => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default ManagementNav;
