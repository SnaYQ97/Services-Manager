"use client";

import { useEffect, useState } from "react";
import ServicePanel from "./components/ServicePanel";
import Cart from "@/components/Cart/Cart";
import { CartItem } from "@/components/Cart/types";
import { BookableService, getBookableServices } from "@/actions/booking";
import { salonToday } from "@/lib/time";

const ServiceManagement = () => {
  const [services, setServices] = useState<BookableService[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    getBookableServices()
      .then(setServices)
      .catch((error) => console.error('Error fetching services:', error));
  }, []);

  const handleAdd = (service: BookableService) => {
    setCartItems(prev => [
      ...prev,
      { key: crypto.randomUUID(), service, employeeId: null, date: salonToday(), slot: null },
    ]);
  };

  const handleRemoveLast = (serviceId: string) => {
    setCartItems(prev => {
      const index = prev.findLastIndex(item => item.service.id === serviceId);
      return index === -1 ? prev : prev.filter((_, i) => i !== index);
    });
  };

  const counts = cartItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.service.id] = (acc[item.service.id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-2">
      <h1 className="text-3xl font-bold mb-8">Services Management</h1>
      <div className="flex gap-6 flex-wrap md:flex-nowrap items-start">
        <ServicePanel services={services} counts={counts} onAdd={handleAdd} onRemove={handleRemoveLast} />
        <Cart items={cartItems} setItems={setCartItems} />
      </div>
    </div>
  )
};

export default ServiceManagement;
