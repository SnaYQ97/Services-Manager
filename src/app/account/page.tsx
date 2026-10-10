import ChangePasswordForm from "@/components/Account/ChangePasswordForm";
import { getCurrentEmployee } from "@/lib/session";

export default async function AccountPage() {
  const employee = await getCurrentEmployee();
  return (
    <div className="container mx-auto p-2 flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-gray-900">Moje konto</h1>
      <p className="text-gray-600">{employee?.name} · {employee?.email}</p>
      <ChangePasswordForm />
    </div>
  );
}
