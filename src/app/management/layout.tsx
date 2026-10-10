import { isManager } from "@/lib/session";
import ManagementNav from "@/components/Management/ManagementNav";

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  if (!(await isManager())) {
    return (
      <div className="container mx-auto p-2">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Zarządzanie</h1>
        <p className="text-gray-500">Ta sekcja jest dostępna tylko dla kierownika.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-gray-900">Zarządzanie</h1>
      <ManagementNav />
      {children}
    </div>
  );
}
