import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { logout } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Role } from "../../../generated/prisma";
import CartIndicator from "./CartIndicator";
import NavLinks from "./NavLinks";

const TopBar = ({ name, role }: { name: string; role: Role }) => (
  <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
      <Link href="/" className="font-semibold tracking-tight">
        Service Manager
      </Link>
      <NavLinks isManager={role === Role.MANAGER} />
      <div className="ml-auto flex items-center gap-1">
        <CartIndicator />
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/account" title="Moje konto">
            <UserRound />
            <span className="hidden sm:inline">{name}</span>
          </Link>
        </Button>
        <form action={logout}>
          <Button variant="ghost" size="icon" title="Wyloguj" aria-label="Wyloguj" className="text-muted-foreground">
            <LogOut />
          </Button>
        </form>
      </div>
    </div>
  </header>
);

export default TopBar;
