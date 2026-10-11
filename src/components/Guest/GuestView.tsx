"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { BookableService } from "@/actions/booking";
import { Card } from "@/components/ui/card";
import SearchInput from "@/components/SearchInput";
import SpecialistAvatar from "@/components/Specialists/SpecialistAvatar";
import { formatMoney } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { cn } from "@/lib/utils";
import FreeSlots from "./FreeSlots";

/** Podgląd dla gościa: lista usług i wolne terminy wybranej usługi w panelu obok – bez koszyka i płatności */
const GuestView = ({ services }: { services: BookableService[] }) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const visibleServices = services.filter(service => matchesQuery(service.name, query));
  const selectedService = services.find(service => service.id === selected);

  // na telefonie panel jest pod listą – przewiń do niego po wyborze
  useEffect(() => {
    if (selected && window.matchMedia('(max-width: 1023px)').matches) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selected]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b p-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Szukaj usługi…" />
        </div>
        {visibleServices.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            {services.length === 0 ? 'Brak usług.' : `Brak usług pasujących do „${query.trim()}”.`}
          </p>
        ) : (
          <ul className="divide-y">
            {visibleServices.map(service => (
              <li key={service.id}>
                <button
                  type="button"
                  onClick={() => setSelected(service.id)}
                  aria-current={selected === service.id ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                    selected === service.id && 'bg-muted',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{service.name}</span>
                    <span className="block text-sm text-muted-foreground tabular-nums">
                      {service.durationMin} min · {formatMoney(service.price)}
                    </span>
                  </span>
                  <span className="flex -space-x-1.5">
                    {service.employees.map(employee => <SpecialistAvatar key={employee.id} name={employee.name} />)}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div ref={panelRef} className="scroll-mt-20 lg:sticky lg:top-20">
        {selectedService ? (
          <FreeSlots key={selectedService.id} service={selectedService} />
        ) : (
          <Card className="items-center px-6 py-10 text-center text-sm text-muted-foreground">
            Wybierz usługę, aby zobaczyć wolne terminy.
          </Card>
        )}
      </div>
    </div>
  );
};

export default GuestView;
