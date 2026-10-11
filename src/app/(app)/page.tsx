import { redirect } from "next/navigation";
import { getBookableServices } from "@/actions/booking";
import Service from "@/components/Service/Service";
import { getCurrentEmployee } from "@/lib/session";
import { getSpecialistsOverview } from "@/lib/specialists";
import { Role } from "../../../generated/prisma";

export default async function Home() {
  // strona renderuje się równolegle z layoutem – nieaktualna sesja musi przekierować także tutaj
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/logout");

  const [services, specialists] = await Promise.all([getBookableServices(), getSpecialistsOverview()]);
  return <Service services={services} specialists={specialists} isManager={employee.role === Role.MANAGER} />;
}
