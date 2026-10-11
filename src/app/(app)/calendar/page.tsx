import { getBookableServices } from "@/actions/booking";
import { getCalendarDay } from "@/actions/calendar";
import { isMonthPublished } from "@/actions/schedule";
import CalendarDay from "@/components/Calendar/CalendarDay";
import { isManager } from "@/lib/session";
import { salonDay, salonToday } from "@/lib/time";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: requested } = await searchParams;
  const date = requested && salonDay(requested).isValid ? requested : salonToday();
  const [employees, services, manager, published] = await Promise.all([
    getCalendarDay(date), getBookableServices(), isManager(), isMonthPublished(date.slice(0, 7)),
  ]);

  return <CalendarDay date={date} employees={employees} services={services} isManager={manager} schedulePublished={published} />;
}
