"use client";

import { Minus, Plus } from "lucide-react";
import type { BookableService } from "@/actions/booking";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { SpecialistOverview } from "@/lib/specialists";
import SpecialistAvatar from "@/components/Specialists/SpecialistAvatar";

interface Props {
  services: BookableService[];
  specialists: SpecialistOverview[];
  counts: { [serviceId: string]: number };
  onAdd: (service: BookableService) => void;
  onRemove: (serviceId: string) => void;
}

const ServicePanel = ({ services, specialists, counts, onAdd, onRemove }: Props) => {
  const specialistById = new Map(specialists.map((specialist) => [specialist.id, specialist]));

  if (services.length === 0) {
    return <p className="text-sm text-muted-foreground">Brak usług. Kierownik może je dodać w Zarządzaniu.</p>;
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <ul className="divide-y">
        {services.map((service) => {
          const count = counts[service.id] ?? 0;
          const bookable = service.employees.length > 0;
          return (
            <li key={service.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {service.durationMin} min · {formatMoney(service.price)}
                </p>
                {bookable ? (
                  <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Specjaliści">
                    {service.employees.map((employee) => {
                      const specialist = specialistById.get(employee.id);
                      return specialist && <SpecialistAvatar key={employee.id} name={specialist.name} size="sm" />;
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Brak specjalisty</p>
                )}
              </div>
              {count > 0 && (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Usuń jedną pozycję: ${service.name}`}
                    onClick={() => onRemove(service.id)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-5 text-center text-sm font-medium text-brand tabular-nums">{count}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={!bookable}
                onClick={() => onAdd(service)}
                aria-label={`Dodaj do koszyka: ${service.name}`}
              >
                <Plus />
                Dodaj
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default ServicePanel;
