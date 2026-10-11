"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { endEmployeeSessions } from "@/actions/management";
import { Button } from "@/components/ui/button";

/** Wylogowuje pracownika ze wszystkich urządzeń – kolejne żądanie z jego tokenem trafi na ekran logowania */
const EndSessionsButton = ({ employeeId, name }: { employeeId: string; name: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-6 gap-1 px-2 text-xs"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await endEmployeeSessions(employeeId);
        toast.success('Wylogowano', { description: `${name} został wylogowany ze wszystkich urządzeń.` });
        router.refresh();
      })}
    >
      <LogOut className="size-3" />
      Wyloguj
    </Button>
  );
};

export default EndSessionsButton;
