"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { ManagementData } from "@/actions/management";
import type { SpecialistOverview } from "@/lib/specialists";
import SpecialistAvatar from "@/components/Specialists/SpecialistAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import { matchesQuery } from "@/lib/search";
import ServiceEditor from "./ServiceEditor";

type Service = ManagementData['services'][number];

interface Props {
  services: Service[];
  specialists: SpecialistOverview[];
}

const NEW = 'new';

const ServicesManager = ({ services, specialists }: Props) => {
  // id wybranej usługi, 'new' dla nowej, null = panel zamknięty
  const [selected, setSelected] = useState<string | null>(null);
  // nowa usługa po zapisie: przełącz panel dopiero, gdy pojawi się na odświeżonej liście
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const visibleServices = services.filter(s => matchesQuery(s.name, query));
  const editorRef = useRef<HTMLDivElement>(null);
  const specialistById = new Map(specialists.map(s => [s.id, s]));
  const selectedService = services.find(s => s.id === selected);

  useEffect(() => {
    if (pendingId && services.some(s => s.id === pendingId)) {
      setSelected(pendingId);
      setPendingId(null);
    }
  }, [services, pendingId]);

  // na telefonie panel jest pod listą – przewiń do niego po wyborze
  useEffect(() => {
    if (selected && window.matchMedia('(max-width: 1023px)').matches) {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selected]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Szukaj usługi…" className="min-w-56 flex-1 sm:max-w-sm" />
        <Button onClick={() => setSelected(NEW)}><Plus />Nowa usługa</Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        {visibleServices.length === 0 ? (
          <Card className="items-center py-10 text-sm text-muted-foreground">
            {services.length === 0 ? 'Brak usług. Dodaj pierwszą.' : `Brak usług pasujących do „${query.trim()}”.`}
          </Card>
        ) : (
          <Card className="gap-0 overflow-hidden py-0">
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
                      <span className="flex items-center gap-2 font-medium">
                        <span className="truncate">{service.name}</span>
                        {service.employeeIds.length === 0 && <Badge variant="outline" className="text-destructive">Brak specjalisty</Badge>}
                      </span>
                      <span className="block text-sm text-muted-foreground tabular-nums">
                        {service.durationMin} min · {formatMoney(service.price)}
                      </span>
                    </span>
                    <span className="flex -space-x-1.5">
                      {service.employeeIds.map(id => {
                        const specialist = specialistById.get(id);
                        return specialist && <SpecialistAvatar key={id} name={specialist.name} />;
                      })}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div ref={editorRef} className="scroll-mt-20">
          {selected ? (
            <ServiceEditor
              // osobny stan formularza dla każdej usługi
              key={selected}
              service={selectedService}
              specialists={specialists}
              onClose={() => setSelected(null)}
              onSaved={id => selected === NEW && setPendingId(id)}
            />
          ) : (
            <Card className="hidden items-center justify-center py-16 text-sm text-muted-foreground lg:flex">
              Wybierz usługę z listy
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesManager;
