import { getManagementData } from "@/actions/management";
import ServicesManager from "@/components/Management/ServicesManager";
import { isManager } from "@/lib/session";

export default async function ServicesPage() {
  // layout pokazuje komunikat o braku dostępu, a strona renderuje się równolegle
  if (!(await isManager())) return null;
  const { employees, services } = await getManagementData();
  return <ServicesManager employees={employees} services={services} />;
}
