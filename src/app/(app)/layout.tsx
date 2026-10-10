import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar/TopBar";
import { CartProvider } from "@/components/Cart/CartProvider";
import { getCurrentEmployee } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const employee = await getCurrentEmployee();
  // ważny token, ale nieaktualna sesja (zmiana hasła, usunięte konto) – wyczyść ciasteczko i wróć do logowania
  if (!employee) redirect("/logout");

  return (
    <CartProvider employeeId={employee.id}>
      <TopBar name={employee.name} role={employee.role} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </CartProvider>
  );
}
