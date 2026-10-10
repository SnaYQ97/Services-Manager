import ChangePasswordForm from "@/components/Account/ChangePasswordForm";
import PageHeader from "@/components/PageHeader";
import { getCurrentEmployee } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/roles";

export default async function AccountPage() {
  const employee = await getCurrentEmployee();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Moje konto"
        description={employee && `${employee.name} · ${employee.email} · ${ROLE_LABELS[employee.role].toLowerCase()}`}
      />
      <ChangePasswordForm />
    </div>
  );
}
