import ChangePasswordForm from "@/components/Account/ChangePasswordForm";
import PageHeader from "@/components/PageHeader";
import { getCurrentEmployee } from "@/lib/session";
import { Role } from "../../../../generated/prisma";

export default async function AccountPage() {
  const employee = await getCurrentEmployee();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Moje konto"
        description={employee && `${employee.name} · ${employee.email} · ${employee.role === Role.MANAGER ? 'kierownik' : 'pracownik'}`}
      />
      <ChangePasswordForm />
    </div>
  );
}
