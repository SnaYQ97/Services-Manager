import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar/TopBar";
import { CartProvider } from "@/components/Cart/CartProvider";
import { getNotifications } from "@/actions/notifications";
import { getCurrentEmployee } from "@/lib/session";
import { Role } from "../../../generated/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const employee = await getCurrentEmployee();
  // ważny token, ale nieaktualna sesja (wylogowanie, zmiana hasła, usunięte konto) – wyczyść ciasteczko i wróć do logowania
  if (!employee) redirect("/logout");
  const notifications = employee.role === Role.MANAGER ? await getNotifications() : null;

  return (
    <CartProvider employeeId={employee.id}>
      <TopBar name={employee.name} role={employee.role} notifications={notifications} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </CartProvider>
  );
}
