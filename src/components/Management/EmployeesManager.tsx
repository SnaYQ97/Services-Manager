"use client";

import { Pencil, Plus } from "lucide-react";
import { ManagementData } from "@/actions/management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { plural } from "@/lib/format";
import { initials, summarizeSchedule } from "@/lib/schedule";
import { formatTime } from "@/lib/time";
import { ROLE_LABELS } from "@/lib/roles";
import { Role } from "../../../generated/prisma";
import EmployeeDialog from "./EmployeeDialog";
import UnlockButton from "./UnlockButton";

const EmployeesManager = ({ employees, services }: ManagementData) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Rola, dostęp, szablon tygodnia i wykonywane usługi. Grafik miesięczny układasz w zakładce Grafik.</p>
      <EmployeeDialog services={services} trigger={<Button><Plus />Nowy pracownik</Button>} />
    </div>

    <Card className="gap-0 overflow-hidden py-0">
      <ul className="divide-y">
        {employees.map(employee => {
          const schedule = summarizeSchedule(employee.workingHours);
          return (
            <li key={employee.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {initials(employee.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {employee.name}
                  {employee.role !== Role.EMPLOYEE && <Badge variant="secondary">{ROLE_LABELS[employee.role]}</Badge>}
                  {!employee.hasPassword && <Badge variant="outline" className="text-muted-foreground">Bez dostępu</Badge>}
                  {employee.lockedUntil && (
                    <>
                      <Badge variant="outline" className="text-destructive">Zablokowane do {formatTime(employee.lockedUntil)}</Badge>
                      <UnlockButton employeeId={employee.id} name={employee.name} />
                    </>
                  )}
                </p>
                <p className="truncate text-sm text-muted-foreground">{employee.email}</p>
              </div>
              <div className="w-44 text-sm text-muted-foreground tabular-nums">
                {schedule.length > 0
                  ? schedule.map(({ days, hours }) => <p key={days}>{days} {hours}</p>)
                  : <p>Brak szablonu</p>}
              </div>
              <p className="w-20 text-sm text-muted-foreground">
                {employee.serviceIds.length} {plural(employee.serviceIds.length, ['usługa', 'usługi', 'usług'])}
              </p>
              <EmployeeDialog
                employee={employee}
                services={services}
                trigger={
                  <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={`Edytuj: ${employee.name}`}>
                    <Pencil />
                  </Button>
                }
              />
            </li>
          );
        })}
      </ul>
    </Card>
  </div>
);

export default EmployeesManager;
