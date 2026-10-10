import { isManager } from "@/lib/session";
import ManagementNav from "@/components/Management/ManagementNav";
import PageHeader from "@/components/PageHeader";

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  if (!(await isManager())) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Zarządzanie" description="Ta sekcja jest dostępna tylko dla kierownika." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Zarządzanie" description="Usługi, specjaliści i ich szablony tygodnia." />
      <ManagementNav />
      {children}
    </div>
  );
}
