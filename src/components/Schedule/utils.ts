import { toast } from "sonner";
import type { ScheduleMonthData, ScheduleResult } from "@/actions/schedule";
import { plural } from "@/lib/format";

export type ScheduleEmployee = ScheduleMonthData['employees'][number];

const hours = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });

/** "20 dni · 160 h" */
export const monthTotals = (employee: ScheduleEmployee) => {
  const days = employee.shifts.length;
  const minutes = employee.shifts.reduce((sum, s) => sum + (s.endMinute - s.startMinute), 0);
  return { days, label: `${days} ${plural(days, ['dzień', 'dni', 'dni'])} · ${hours.format(minutes / 60)} h` };
};

/** Wynik akcji grafiku jako powiadomienie; true = sukces */
export const notify = (result: ScheduleResult) => {
  if (!result.ok) {
    toast.error(result.error);
    return false;
  }
  if (result.warning) toast.warning(result.message ?? 'Zapisano', { description: result.warning });
  else if (result.message) toast.success(result.message);
  return true;
};
