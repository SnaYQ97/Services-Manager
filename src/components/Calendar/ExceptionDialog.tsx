"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { addScheduleException, CalendarEmployee } from "@/actions/calendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ExceptionDialog = ({ date, employees }: { date: string; employees: CalendarEmployee[] }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [employeeId, setEmployeeId] = useState(employees[0].id);
  const [exceptionDate, setExceptionDate] = useState(date);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setExceptionDate(date);
      setError(null);
    }
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await addScheduleException({ employeeId, date: exceptionDate, allDay, startTime, endTime, reason });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.warning) toast.warning('Dodano niedostępność', { description: result.warning });
      else toast.success('Dodano niedostępność');
      setReason('');
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarOff />
          Niedostępność
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Urlop / niedostępność</DialogTitle>
          <DialogDescription>W tym czasie wizyty u specjalisty nie będą proponowane.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exception-employee">Specjalista</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger id="exception-employee" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exception-date">Dzień</Label>
              <Input id="exception-date" type="date" value={exceptionDate} onChange={e => setExceptionDate(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="exception-all-day" checked={allDay} onCheckedChange={checked => setAllDay(checked === true)} />
            <Label htmlFor="exception-all-day" className="font-normal">Cały dzień</Label>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="exception-from">Od</Label>
                <Input id="exception-from" type="time" step={900} value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exception-to">Do</Label>
                <Input id="exception-to" type="time" step={900} value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="exception-reason">Powód <span className="font-normal text-muted-foreground">(opcjonalnie)</span></Label>
            <Input id="exception-reason" placeholder="np. urlop, szkolenie" value={reason} onChange={e => setReason(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
          <Button onClick={handleSubmit} disabled={isPending || !exceptionDate}>Dodaj</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExceptionDialog;
