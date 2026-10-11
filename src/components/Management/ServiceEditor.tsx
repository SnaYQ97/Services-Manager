"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ManagementData, saveService } from "@/actions/management";
import type { SpecialistOverview } from "@/lib/specialists";
import SpecialistAvatar from "@/components/Specialists/SpecialistAvatar";
import SpecialistDetails from "@/components/Specialists/SpecialistDetails";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Service = ManagementData['services'][number];

interface Props {
  service?: Service;               // brak = nowa usługa
  specialists: SpecialistOverview[];
  onClose: () => void;
  onSaved: (id: string) => void;
}

/** Panel po prawej: edycja usługi + grafik i dostępność przypisanych specjalistów */
const ServiceEditor = ({ service, specialists, onClose, onSaved }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(service?.name ?? '');
  const [price, setPrice] = useState(service ? service.price.toFixed(2).replace('.', ',') : '');
  const [durationMin, setDurationMin] = useState(String(service?.durationMin ?? 60));
  const [employeeIds, setEmployeeIds] = useState<string[]>(service?.employeeIds ?? []);
  const [error, setError] = useState<string | null>(null);

  const assigned = specialists.filter(s => employeeIds.includes(s.id));

  const toggle = (id: string) =>
    setEmployeeIds(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveService({
        id: service?.id,
        name,
        price: Number(price.replace(',', '.')),
        durationMin: Number(durationMin),
        employeeIds,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const title = service ? 'Zapisano usługę' : 'Dodano usługę';
      if (result.warning) toast.warning(title, { description: result.warning });
      else toast.success(title, { description: name.trim() });
      router.refresh();
      onSaved(result.id);
    });
  };

  return (
    <Card className="gap-5 lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle>{service ? service.name : 'Nowa usługa'}</CardTitle>
        <CardDescription>{service ? 'Edycja usługi i jej specjalistów' : 'Uzupełnij dane i wybierz specjalistów'}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={onClose} aria-label="Zamknij panel">
            <X />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="service-name">Nazwa</Label>
            <Input id="service-name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="service-duration">Czas trwania (min)</Label>
              <Input id="service-duration" type="number" min={15} step={15} value={durationMin} onChange={e => setDurationMin(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-price">Cena (zł)</Label>
              <Input id="service-price" inputMode="decimal" placeholder="0,00" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Specjaliści</Label>
            <div className="flex flex-wrap gap-1.5">
              {specialists.map(specialist => (
                <SpecialistAvatar
                  key={specialist.id}
                  name={specialist.name}
                  assigned={employeeIds.includes(specialist.id)}
                  onToggle={() => toggle(specialist.id)}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Kliknij kółko, aby przypisać lub odpiąć specjalistę.</p>
          </div>

          {assigned.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Brak przypisanych specjalistów – usługi nie da się zarezerwować.
            </p>
          ) : (
            assigned.map(specialist => (
              <SpecialistDetails
                key={specialist.id}
                specialist={specialist}
                serviceId={service?.id}
                saved={!!service?.employeeIds.includes(specialist.id)}
              />
            ))
          )}
        </div>

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Anuluj</Button>
        <Button onClick={handleSave} disabled={isPending}>{isPending ? 'Zapisywanie…' : service ? 'Zapisz' : 'Dodaj usługę'}</Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceEditor;
