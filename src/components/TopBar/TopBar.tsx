import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/session";
import { Role } from "../../../generated/prisma";
import NavLinks from "./NavLinks";
import UserSwitcher from "./UserSwitcher";

const TopBar = async () => {
  const [currentEmployee, employees] = await Promise.all([
    getCurrentEmployee(),
    prisma.employee.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, role: true } }),
  ]);
  const isManager = currentEmployee?.role === Role.MANAGER;

  return (
    <div className="flex flex-row justify-between items-center w-full gap-4 p-2 border-b border-gray-100 mb-4">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <NavLinks isManager={isManager} />
        <UserSwitcher employees={employees} currentEmployeeId={currentEmployee?.id ?? ''} />
      </div>
  );
};

export default TopBar;
