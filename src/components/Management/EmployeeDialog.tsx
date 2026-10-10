"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ManagementData, saveEmployee } from "@/actions/management";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchInput from "@/components/SearchInput";
import { matchesQuery } from "@/lib/search";
import { minutesToTime, WEEKDAYS } from "@/lib/time";
import { Role } from "../../../generated/prisma";

type Employee = ManagementData['employees'][number];
type Service = ManagementData['services'][number];

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

const toWeek = (workingHours: Employee['workingHours']): DaySchedule[] =>
  WEEKDAYS.map((_, i) => {
    // edytor obsługuje jedno okno na dzień
    const window = workingHours.find(w => w.weekday === i + 1);
    return window
      ? { enabled: true, start: minutesToTime(window.startMinute), end: minutesToTime(window.endMinute) }
      : { enabled: false, start: '09:00', end: '17:00' };
  });

interface Props {
  employee?: Employee;   // brak = nowy pracownik
  services: Service[];
  trigger: React.ReactNode;
}

const EmployeeDialog = ({ employee, services, trigger }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.EMPLOYEE);
  const [password, setPassword] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [serviceQuery, setServiceQuery] = useState('');
  const [week, setWeek] = useState<DaySchedule[]>(() => toWeek([]));
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setName(employee?.name ?? '');
    setEmail(employee?.email ?? '');
    setRole(employee?.role ?? Role.EMPLOYEE);
    setPassword('');
    setServiceIds(employee?.serviceIds ?? []);
    setServiceQuery('');
    setWeek(toWeek(employee?.workingHours ?? []));
    setError(null);
  };

  const updateDay = (index: number, patch: Partial<DaySchedule>) =>
    setWeek(prev => prev.map((d, i) => i === index ? { ...d, ...patch } : d));

  const toggleService = (id: string) =>
    setServiceIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveEmployee({
        id: employee?.id,
        name,
        email,
        role,
        password,
        serviceIds,
        workingHours: week.flatMap((d, i) => d.enabled ? [{ weekday: i + 1, start: d.start, end: d.end }] : []),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(employee ? 'Zapisano pracownika' : 'Dodano pracownika', {
        description: password ? 'Nowe hasło wylogowało stare sesje tej osoby.' : name.trim(),
      });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{employee ? employee.name : 'Nowy pracownik'}</DialogTitle>
          <DialogDescription>Urlopy i jednorazowe niedostępności dodajesz w Kalendarzu.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details">Dane</TabsTrigger>
            <TabsTrigger value="schedule">Grafik</TabsTrigger>
            <TabsTrigger value="services">Usługi</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="employee-name">Imię i nazwisko</Label>
              <Input id="employee-name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employee-email">E-mail (login)</Label>
              <Input id="employee-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="employee-role">Rola</Label>
                <Select value={role} onValueChange={value => setRole(value as Role)}>
                  <SelectTrigger id="employee-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.EMPLOYEE}>Pracownik</SelectItem>
                    <SelectItem value={Role.MANAGER}>Kierownik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="employee-password">{employee?.hasPassword ? 'Nowe hasło' : 'Hasło'}</Label>
                <Input
                  id="employee-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={employee?.hasPassword ? 'bez zmian' : 'brak = bez dostępu'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-2 pt-2">
            {week.map((d, i) => (
              <div key={WEEKDAYS[i]} className="flex items-center gap-3">
                <div className="flex w-36 items-center gap-2">
                  <Checkbox id={`day-${i}`} checked={d.enabled} onCheckedChange={checked => updateDay(i, { enabled: checked === true })} />
                  <Label htmlFor={`day-${i}`} className="font-normal">{WEEKDAYS[i]}</Label>
                </div>
                <Input type="time" step={900} className="h-8 w-28" disabled={!d.enabled} value={d.start} onChange={e => updateDay(i, { start: e.target.value })} aria-label={`${WEEKDAYS[i]} od`} />
                <span className="text-muted-foreground">–</span>
                <Input type="time" step={900} className="h-8 w-28" disabled={!d.enabled} value={d.end} onChange={e => updateDay(i, { end: e.target.value })} aria-label={`${WEEKDAYS[i]} do`} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="services" className="space-y-3 pt-2">
            <SearchInput value={serviceQuery} onChange={setServiceQuery} placeholder="Szukaj usługi…" />
            <p className="text-xs text-muted-foreground">Zaznaczono {serviceIds.length} z {services.length}</p>
            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {services.filter(service => matchesQuery(service.name, serviceQuery)).map(service => (
                <div key={service.id} className="flex items-center gap-2">
                  <Checkbox id={`service-${service.id}`} checked={serviceIds.includes(service.id)} onCheckedChange={() => toggleService(service.id)} />
                  <Label htmlFor={`service-${service.id}`} className="font-normal">{service.name}</Label>
                </div>
              ))}
              {!services.some(service => matchesQuery(service.name, serviceQuery)) && (
                <p className="text-sm text-muted-foreground">Brak usług pasujących do „{serviceQuery.trim()}”.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
          <Button onClick={handleSave} disabled={isPending}>{employee ? 'Zapisz' : 'Dodaj pracownika'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDialog;
