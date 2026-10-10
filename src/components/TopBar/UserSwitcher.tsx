"use client";

import { useTransition } from "react";
import { setCurrentEmployee } from "@/actions/session";
import { Role } from "../../../generated/prisma";

interface Props {
  employees: { id: string; name: string; role: Role }[];
  currentEmployeeId: string;
}

// Tymczasowy przełącznik użytkownika – do czasu wprowadzenia logowania
const UserSwitcher = ({ employees, currentEmployeeId }: Props) => {
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      Zalogowany:
      <select
        className="border border-gray-200 rounded-md px-2 py-1 bg-white"
        value={currentEmployeeId}
        disabled={isPending}
        onChange={(e) => startTransition(() => setCurrentEmployee(e.target.value))}
      >
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}{employee.role === Role.MANAGER ? " (kierownik)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
};

export default UserSwitcher;
