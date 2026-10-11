"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Send, Undo2, Wand2 } from "lucide-react";
import { fillMonthFromTemplate, publishMonth, ScheduleMonthData, ScheduleResult, unpublishMonth } from "@/actions/schedule";
import { monthTotals, notify } from "./utils";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, formatMonth, formatTime, monthBounds, salonMonth, salonToday, shortTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import ShiftPanel from "./ShiftPanel";

const ScheduleView = ({ data }: { data: ScheduleMonthData }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<{ employeeId: string; date: string } | null>(null);

  const { first, days } = monthBounds(data.month);
  const dates = Array.from({ length: days }, (_, i) => first.plus({ days: i }));
  const today = salonToday();
  const selectedEmployee = data.employees.find(e => e.id === selected?.employeeId);

  const run = (action: () => Promise<ScheduleResult>) => startTransition(async () => {
    if (notify(await action())) router.refresh();
  });

  const monthHref = (offset: number) => `/schedule?month=${first.plus({ months: offset }).toFormat('yyyy-MM')}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Grafik"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="first-letter:uppercase">{formatMonth(data.month)}</span>
            {data.publishedAt ? (
              <Badge variant="secondary">Opublikowany {formatDate(data.publishedAt)}, {formatTime(data.publishedAt)}</Badge>
            ) : data.canEdit ? (
              <Badge variant="outline" className="text-destructive">Szkic – terminy niedostępne do rezerwacji</Badge>
            ) : null}
          </span>
        }
        actions={
          <>
            <div className="flex items-center gap-1">
              <Button asChild variant="outline" size="icon" aria-label="Poprzedni miesiąc">
                <Link href={monthHref(-1)}><ChevronLeft /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/schedule?month=${salonMonth()}`}>Bieżący</Link>
              </Button>
              <Button asChild variant="outline" size="icon" aria-label="Następny miesiąc">
                <Link href={monthHref(1)}><ChevronRight /></Link>
              </Button>
            </div>
            {data.canEdit && (
              <>
                <Button variant="outline" disabled={isPending} onClick={() => run(() => fillMonthFromTemplate(data.month))}>
                  <Wand2 />
                  Wypełnij z szablonu
                </Button>
                {data.publishedAt ? (
                  <Button variant="outline" disabled={isPending} onClick={() => run(() => unpublishMonth(data.month))}>
                    <Undo2 />
                    Cofnij publikację
                  </Button>
                ) : (
                  <Button disabled={isPending} onClick={() => run(() => publishMonth(data.month))}>
                    <Send />
                    Opublikuj
                  </Button>
                )}
              </>
            )}
          </>
        }
      />

      {!data.visible ? (
        <Card className="items-center py-10 text-sm text-muted-foreground">
          Grafik na {formatMonth(data.month)} nie jest jeszcze opublikowany.
        </Card>
      ) : data.employees.length === 0 ? (
        <Card className="items-center py-10 text-sm text-muted-foreground">
          Brak specjalistów. Dodaj pracownikom usługi i szablon tygodnia w Zarządzaniu.
        </Card>
      ) : (
        <>
          <Card className="gap-0 overflow-hidden py-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 z-10 min-w-36 bg-background px-3 py-2 text-left text-sm font-medium">Specjalista</th>
                    {dates.map(d => {
                      const iso = d.toISODate()!;
                      return (
                        <th
                          key={iso}
                          className={cn(
                            'min-w-8 px-0 py-1.5 text-center font-normal tabular-nums',
                            d.weekday >= 6 && 'bg-muted/60',
                            iso === today && 'font-semibold text-brand',
                          )}
                        >
                          <span className="block text-[10px] text-muted-foreground">{d.setLocale('pl').toFormat('ccccc')}</span>
                          {d.day}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {data.employees.map(employee => {
                    return (
                      <tr key={employee.id} className="border-b last:border-b-0">
                        <th scope="row" className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-normal">
                          <span className="block truncate text-sm font-medium">{employee.name}</span>
                          <span className="text-muted-foreground tabular-nums">{monthTotals(employee).label}</span>
                        </th>
                        {dates.map(d => {
                          const iso = d.toISODate()!;
                          const shift = employee.shifts.find(s => s.date === iso);
                          const absence = employee.absences.find(a => a.date === iso);
                          const isSelected = selected?.employeeId === employee.id && selected.date === iso;
                          const content = shift ? (
                            <span className="relative block rounded bg-brand-soft py-1 leading-tight text-brand-soft-foreground tabular-nums">
                              {shortTime(shift.startMinute)}
                              <br />
                              {shortTime(shift.endMinute)}
                              {absence && <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-destructive" />}
                            </span>
                          ) : absence?.startMinute === null ? (
                            <span className="block rounded bg-destructive/10 py-2 font-medium text-destructive">U</span>
                          ) : (
                            <span className="block py-2 text-muted-foreground/50">·</span>
                          );
                          const title = [
                            formatDate(iso),
                            shift ? `${shortTime(shift.startMinute)}–${shortTime(shift.endMinute)}` : 'wolne',
                            absence && `nieobecność${absence.reason ? `: ${absence.reason}` : ''}`,
                          ].filter(Boolean).join(' · ');

                          return (
                            <td key={iso} className={cn('p-0.5 text-center', d.weekday >= 6 && 'bg-muted/40')}>
                              {data.canEdit ? (
                                <button
                                  type="button"
                                  title={title}
                                  aria-label={`${employee.name}, ${title}`}
                                  aria-pressed={isSelected}
                                  onClick={() => setSelected({ employeeId: employee.id, date: iso })}
                                  className={cn(
                                    'block w-full rounded outline-none transition hover:ring-2 hover:ring-brand/30 focus-visible:ring-2 focus-visible:ring-ring',
                                    isSelected && 'ring-2 ring-brand',
                                  )}
                                >
                                  {content}
                                </button>
                              ) : (
                                <span title={title}>{content}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs text-muted-foreground">
            Komórka pokazuje godzinę rozpoczęcia i zakończenia (np. 9 / 17). U – cały dzień nieobecności, czerwona kropka – nieobecność w części dnia.
            {data.canEdit && ' Kliknij dzień, aby zmienić godziny lub ustawić wolne.'}
          </p>
        </>
      )}

      {data.canEdit && selected && selectedEmployee && (
        <ShiftPanel
          // nowy stan formularza dla każdego dnia
          key={`${selected.employeeId}:${selected.date}`}
          employee={selectedEmployee}
          date={selected.date}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default ScheduleView;
