import { getCalendarDay } from "@/actions/calendar";
import CalendarDay from "@/components/Calendar/CalendarDay";
import { isManager } from "@/lib/session";
import { salonDay, salonToday } from "@/lib/time";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: requested } = await searchParams;
  const date = requested && salonDay(requested).isValid ? requested : salonToday();
  const [employees, manager] = await Promise.all([getCalendarDay(date), isManager()]);

  return (
    <div className="container mx-auto p-2">
      <CalendarDay date={date} employees={employees} isManager={manager} />
    </div>
  );
}
