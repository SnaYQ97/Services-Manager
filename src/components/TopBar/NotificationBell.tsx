"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { Bell, LockOpen, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { getNotifications, markNotificationsRead, type NotificationsData } from "@/actions/notifications";
import { unlockEmployee } from "@/actions/management";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatTime, SALON_TZ, salonDay, salonToday } from "@/lib/time";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

const when = (iso: string) => {
  const at = DateTime.fromISO(iso).setZone(SALON_TZ).setLocale("pl");
  const today = salonDay(salonToday());
  const day = at.hasSame(today, "day") ? "dziś"
    : at.hasSame(today.minus({ days: 1 }), "day") ? "wczoraj"
    : at.toFormat("ccc, d MMM");
  return `${day}, ${formatTime(iso)}`;
};

/** Dzwonek kierownika: zablokowane konta (z adresem IP prób), odblokowanie i oznaczanie jako przeczytane */
const NotificationBell = ({ initial }: { initial: NotificationsData }) => {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const lastUnread = useRef(initial.unread);

  const refresh = () => getNotifications().then(setData).catch(() => { /* sesja wygasła – layout przekieruje */ });

  // layout nie renderuje się przy przejściach między stronami – dzwonek sam dopytuje o nowe powiadomienia
  useEffect(() => {
    const timer = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(timer);
  }, []);

  // nowe nieprzeczytane: krótkie „dzwonienie”
  useEffect(() => {
    if (data.unread > lastUnread.current) {
      setRinging(true);
      const timer = window.setTimeout(() => setRinging(false), 900);
      lastUnread.current = data.unread;
      return () => window.clearTimeout(timer);
    }
    lastUnread.current = data.unread;
  }, [data.unread]);

  const run = (action: () => Promise<unknown>, success?: string) => startTransition(async () => {
    await action();
    if (success) toast.success(success);
    await refresh();
    router.refresh();
  });

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) refresh(); }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          aria-label={data.unread ? `Powiadomienia: ${data.unread} nieprzeczytane` : "Powiadomienia"}
          title="Powiadomienia"
        >
          <Bell className={cn(ringing && "animate-bell")} />
          {data.unread > 0 && (
            <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white tabular-nums animate-in zoom-in-50">
              {data.unread > 9 ? "9+" : data.unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <p className="text-sm font-medium">Powiadomienia</p>
          {data.unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" disabled={isPending}
              onClick={() => run(() => markNotificationsRead())}>
              Oznacz wszystkie jako przeczytane
            </Button>
          )}
        </div>

        {data.items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Brak powiadomień.</p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {data.items.map((item, index) => (
              <li
                key={item.id}
                className={cn("flex gap-3 px-4 py-3 animate-in fade-in-0 slide-in-from-top-1", !item.read && "bg-destructive/5")}
                style={{ animationDelay: `${Math.min(index, 6) * 40}ms`, animationFillMode: "backwards" }}
              >
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <p>
                    Zablokowane konto:{" "}
                    <Link href="/management/employees" className="font-medium underline-offset-4 hover:underline" onClick={() => setOpen(false)}>
                      {item.employeeName}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">Zbyt wiele nieudanych prób logowania · {when(item.createdAt)}</p>
                  {item.ipAddress && <p className="text-xs text-muted-foreground tabular-nums">Adres IP: {item.ipAddress}</p>}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.stillLocked && (
                      <Button variant="outline" size="sm" className="h-6 gap-1 px-2 text-xs" disabled={isPending}
                        onClick={() => run(async () => {
                          await unlockEmployee(item.employeeId);
                          await markNotificationsRead([item.id]);
                        }, `${item.employeeName} może się znowu zalogować.`)}>
                        <LockOpen className="size-3" />
                        Odblokuj
                      </Button>
                    )}
                    {!item.read && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" disabled={isPending}
                        onClick={() => run(() => markNotificationsRead([item.id]))}>
                        Oznacz jako przeczytane
                      </Button>
                    )}
                  </div>
                </div>
                {!item.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive" aria-label="nieprzeczytane" />}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
