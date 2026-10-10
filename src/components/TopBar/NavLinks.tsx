"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NavLinks = ({ isManager }: { isManager: boolean }) => {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Usługi" },
    { href: "/transactions", label: "Transakcje" },
    { href: "/calendar", label: "Kalendarz" },
    ...(isManager ? [{ href: "/management", label: "Zarządzanie" }] : []),
  ];

  return (
    <nav className="flex gap-4">
      {links.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? "font-semibold text-blue-600" : "text-gray-600 hover:text-gray-900"}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavLinks;
