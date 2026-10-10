"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ManagementData, saveEmployee } from "@/actions/management";
import { minutesToTime, WEEKDAYS } from "@/lib/time";
import { Role } from "../../../generated/prisma";

type Employee = ManagementData['employees'][number];
type Service = ManagementData['services'][number];

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

const NEW_EMPLOYEE: Employee = { id: '', name: '', email: '', role: Role.EMPLOYEE, serviceIds: [], workingHours: [] };

const toWeek = (workingHours: Employee['workingHours']): DaySchedule[] =>
  WEEKDAYS.map((_, i) => {
    // edytor obsługuje jedno okno na dzień
    const window = workingHours.find(w => w.weekday === i + 1);
    return window
      ? { enabled: true, start: minutesToTime(window.startMinute), end: minutesToTime(window.endMinute) }
      : { enabled: false, start: '09:00', end: '17:00' };
  });

const EmployeeCard = ({ employee, services, onDone }: { employee: Employee; services: Service[]; onDone?: () => void }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [role, setRole] = useState(employee.role);
  const [serviceIds, setServiceIds] = useState(employee.serviceIds);
  const [week, setWeek] = useState(() => toWeek(employee.workingHours));
  const [message, setMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  const updateDay = (index: number, patch: Partial<DaySchedule>) =>
    setWeek(prev => prev.map((d, i) => i === index ? { ...d, ...patch } : d));

  const toggleService = (id: string) =>
    setServiceIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveEmployee({
        id: employee.id || undefined,
        name,
        email,
        role,
        serviceIds,
        workingHours: week.flatMap((d, i) => d.enabled ? [{ weekday: i + 1, start: d.start, end: d.end }] : []),
      });
      if (!result.ok) {
        setMessage({ type: 'error', text: result.error });
        return;
      }
      setMessage({ type: 'info', text: 'Zapisano.' });
      router.refresh();
      onDone?.();
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-4 text-sm">
      <div className="flex flex-wrap gap-3">
        <input className="border border-gray-200 rounded-md px-2 py-1 font-semibold flex-auto" placeholder="Imię i nazwisko" value={name} onChange={e => setName(e.target.value)} />
        <input className="border border-gray-200 rounded-md px-2 py-1 flex-auto" placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <select className="border border-gray-200 rounded-md px-2 py-1" value={role} onChange={e => setRole(e.target.value as Role)}>
          <option value={Role.EMPLOYEE}>Pracownik</option>
          <option value={Role.MANAGER}>Kierownik</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-gray-800">Grafik tygodniowy</p>
          {week.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-32">
                <input type="checkbox" checked={d.enabled} onChange={e => updateDay(i, { enabled: e.target.checked })} />
                {WEEKDAYS[i]}
              </label>
              <input type="time" step={900} disabled={!d.enabled} className="border border-gray-200 rounded-md px-1 disabled:opacity-40" value={d.start} onChange={e => updateDay(i, { start: e.target.value })} />
              –
              <input type="time" step={900} disabled={!d.enabled} className="border border-gray-200 rounded-md px-1 disabled:opacity-40" value={d.end} onChange={e => updateDay(i, { end: e.target.value })} />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-medium text-gray-800">Wykonywane usługi</p>
          {services.map(service => (
            <label key={service.id} className="flex items-center gap-1">
              <input type="checkbox" checked={serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} />
              {service.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={isPending} className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40">
          {employee.id ? 'Zapisz' : 'Dodaj pracownika'}
        </button>
        {message && <span className={message.type === 'error' ? 'text-red-600' : 'text-green-700'}>{message.text}</span>}
      </div>
    </div>
  );
};

const EmployeesManager = ({ employees, services }: ManagementData) => {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">Urlopy i jednorazowe niedostępności dodajesz w Kalendarzu.</p>
      {employees.map(employee => (
        <EmployeeCard key={employee.id} employee={employee} services={services} />
      ))}
      {adding ? (
        <EmployeeCard employee={NEW_EMPLOYEE} services={services} onDone={() => setAdding(false)} />
      ) : (
        <button onClick={() => setAdding(true)} className="self-start px-3 py-1.5 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50">
          + Nowy pracownik
        </button>
      )}
    </div>
  );
};

export default EmployeesManager;
