"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ManagementData, saveService } from "@/actions/management";

type Employee = ManagementData['employees'][number];
type Service = ManagementData['services'][number];

const NEW_SERVICE: Service = { id: '', name: '', price: 0, durationMin: 60, employeeIds: [] };

const ServiceRow = ({ service, employees, onDone }: { service: Service; employees: Employee[]; onDone?: () => void }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState(String(service.price));
  const [durationMin, setDurationMin] = useState(String(service.durationMin));
  const [employeeIds, setEmployeeIds] = useState(service.employeeIds);
  const [message, setMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  const toggleEmployee = (id: string) =>
    setEmployeeIds(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveService({
        id: service.id || undefined,
        name,
        price: Number(price),
        durationMin: Number(durationMin),
        employeeIds,
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
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap gap-3 items-center">
        <input className="border border-gray-200 rounded-md px-2 py-1 font-semibold flex-auto" placeholder="Nazwa usługi" value={name} onChange={e => setName(e.target.value)} />
        <label className="flex items-center gap-1">
          Cena $
          <input type="number" min={0} step={0.01} className="border border-gray-200 rounded-md px-2 py-1 w-24" value={price} onChange={e => setPrice(e.target.value)} />
        </label>
        <label className="flex items-center gap-1">
          Czas
          <input type="number" min={15} step={15} className="border border-gray-200 rounded-md px-2 py-1 w-20" value={durationMin} onChange={e => setDurationMin(e.target.value)} />
          min
        </label>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <span className="font-medium text-gray-800">Specjaliści:</span>
        {employees.map(employee => (
          <label key={employee.id} className="flex items-center gap-1">
            <input type="checkbox" checked={employeeIds.includes(employee.id)} onChange={() => toggleEmployee(employee.id)} />
            {employee.name}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={isPending} className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40">
          {service.id ? 'Zapisz' : 'Dodaj usługę'}
        </button>
        {message && <span className={message.type === 'error' ? 'text-red-600' : 'text-green-700'}>{message.text}</span>}
      </div>
    </div>
  );
};

const ServicesManager = ({ employees, services }: ManagementData) => {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {services.map(service => (
        <ServiceRow key={service.id} service={service} employees={employees} />
      ))}
      {adding ? (
        <ServiceRow service={NEW_SERVICE} employees={employees} onDone={() => setAdding(false)} />
      ) : (
        <button onClick={() => setAdding(true)} className="self-start px-3 py-1.5 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50">
          + Nowa usługa
        </button>
      )}
    </div>
  );
};

export default ServicesManager;
