"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockOpen } from "lucide-react";
import { toast } from "sonner";
import { unlockEmployee } from "@/actions/management";
import { Button } from "@/components/ui/button";

const UnlockButton = ({ employeeId, name }: { employeeId: string; name: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-6 gap-1 px-2 text-xs"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await unlockEmployee(employeeId);
        toast.success('Konto odblokowane', { description: `${name} może się znowu zalogować.` });
        router.refresh();
      })}
    >
      <LockOpen className="size-3" />
      Odblokuj
    </Button>
  );
};

export default UnlockButton;
