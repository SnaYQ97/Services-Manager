import Image from "next/image";
import Link from "next/link";
import { logout } from "@/actions/account";
import { getCurrentEmployee } from "@/lib/session";
import { Role } from "../../../generated/prisma";
import NavLinks from "./NavLinks";

const TopBar = async () => {
  const currentEmployee = await getCurrentEmployee();

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
        {currentEmployee && (
          <>
            <NavLinks isManager={currentEmployee.role === Role.MANAGER} />
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Link href="/account" className="hover:text-gray-900">
                {currentEmployee.name}{currentEmployee.role === Role.MANAGER ? " (kierownik)" : ""}
              </Link>
              <form action={logout}>
                <button className="px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50">Wyloguj</button>
              </form>
            </div>
          </>
        )}
      </div>
  );
};

export default TopBar;
