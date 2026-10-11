import { getScheduleMonth } from "@/actions/schedule";
import ScheduleView from "@/components/Schedule/ScheduleView";
import { MONTH_RE, salonMonth } from "@/lib/time";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: requested } = await searchParams;
  const month = requested && MONTH_RE.test(requested) ? requested : salonMonth();
  const data = await getScheduleMonth(month);

  return <ScheduleView data={data} />;
}
