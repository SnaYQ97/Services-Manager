import { getManagementData } from "@/actions/management";
import ServicesManager from "@/components/Management/ServicesManager";
import { isManager } from "@/lib/session";
import { getSpecialistsOverview } from "@/lib/specialists";

export default async function ServicesPage() {
  // layout pokazuje komunikat o braku dostępu, a strona renderuje się równolegle
  if (!(await isManager())) return null;
  const [{ services }, specialists] = await Promise.all([getManagementData(), getSpecialistsOverview()]);
  return <ServicesManager services={services} specialists={specialists} />;
}
