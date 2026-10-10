"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/management/employees", label: "Pracownicy i grafik" },
  { href: "/management/services", label: "Usługi" },
];

const ManagementNav = () => {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 border-b border-gray-200">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-3 py-2 -mb-px border-b-2 ${
            pathname.startsWith(tab.href) ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
};

export default ManagementNav;
