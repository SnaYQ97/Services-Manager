import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar/TopBar";
import { CartProvider } from "@/components/Cart/CartProvider";
import { getNotifications } from "@/actions/notifications";
import IdleLogout from "@/components/IdleLogout";
import { getCurrentEmployee } from "@/lib/session";
import { getSessionSettings } from "@/lib/sessionSettings";
import { Role } from "../../../generated/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const employee = await getCurrentEmployee();
  // ważny token, ale nieaktualna sesja (wylogowanie, zmiana hasła, bezczynność, limit czasu, usunięte konto) – wyczyść ciasteczko i wróć do logowania
  if (!employee) redirect("/logout");
  const [notifications, { idleMinutes }] = await Promise.all([
    employee.role === Role.MANAGER ? getNotifications() : null,
    getSessionSettings(),
  ]);

  return (
    <CartProvider employeeId={employee.id}>
      <TopBar name={employee.name} role={employee.role} notifications={notifications} />
      <IdleLogout idleMinutes={idleMinutes} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </CartProvider>
  );
}
