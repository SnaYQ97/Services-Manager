"use client";

import ServicePanel from "./ServicePanel";
import Cart from "@/components/Cart/Cart";
import { useCart } from "@/components/Cart/CartProvider";
import PageHeader from "@/components/PageHeader";
import type { BookableService } from "@/actions/booking";
import type { SpecialistOverview } from "@/lib/specialists";
import { salonToday } from "@/lib/time";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  services: BookableService[];
  specialists: SpecialistOverview[];
  isManager: boolean;
}

const ServiceManagement = ({ services, specialists, isManager }: Props) => {
  const { items, add, removeLastOf } = useCart();

  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.serviceId] = (acc[item.serviceId] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usługi"
        description="Dodaj usługi do koszyka, wybierz terminy i przyjmij płatność."
        actions={isManager && (
          <Button asChild variant="outline">
            <Link href="/management/services"><Settings2 />Zarządzaj usługami</Link>
          </Button>
        )}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <ServicePanel
          services={services}
          specialists={specialists}
          counts={counts}
          onAdd={(service) => add({ serviceId: service.id, employeeId: null, date: salonToday(), slot: null })}
          onRemove={removeLastOf}
        />
        <Cart services={services} />
      </div>
    </div>
  )
};

export default ServiceManagement;
