"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NavLinks = ({ isManager }: { isManager: boolean }) => {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Usługi" },
    { href: "/calendar", label: "Kalendarz" },
    { href: "/schedule", label: "Grafik" },
    { href: "/transactions", label: "Transakcje" },
    ...(isManager ? [{ href: "/management", label: "Zarządzanie" }] : []),
  ];

  return (
    // na telefonie menu schodzi do osobnego, przewijanego wiersza
    <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
      {links.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors",
              active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavLinks;
