import { getBookableServices } from "@/actions/booking";
import Service from "@/components/Service/Service";
import { isManager } from "@/lib/session";
import { getSpecialistsOverview } from "@/lib/specialists";

export default async function Home() {
  const [services, specialists, manager] = await Promise.all([getBookableServices(), getSpecialistsOverview(), isManager()]);
  return <Service services={services} specialists={specialists} isManager={manager} />;
}
