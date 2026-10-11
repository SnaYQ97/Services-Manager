import { getManagementData } from "@/actions/management";
import EmployeesManager from "@/components/Management/EmployeesManager";
import { isManager } from "@/lib/session";

export default async function EmployeesPage() {
  // layout pokazuje komunikat o braku dostępu, a strona renderuje się równolegle
  if (!(await isManager())) return null;
  const { employees, services } = await getManagementData();
  return <EmployeesManager employees={employees} services={services} />;
}
