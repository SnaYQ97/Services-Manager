"use client";

import type { BookableService } from "@/actions/booking";

interface Props {
  services: BookableService[];
  counts: { [serviceId: string]: number };
  onAdd: (service: BookableService) => void;
  onRemove: (serviceId: string) => void;
}

const ServicePanel = ({ services, counts, onAdd, onRemove }: Props) => {
  return (
    <main className="flex flex-col gap-[32px] w-full md:w-[33.33%]">
      <h1 className="text-3xl font-bold text-gray-900">Available Services</h1>

      {services.length === 0 ? (
        <p className="text-gray-500">No services available.</p>
      ) : (
        <div className="flex flex-auto flex-col gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`flex flex-col items-start p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                counts[service.id] > 0 ? 'relative border-2 border-blue-500 ring-1 ring-blue-500' : ''
              }`}
            >
              {counts[service.id] > 0 && (
                <div className="absolute -top-3 right-2 flex items-center space-x-1">
                  <span className="text-xs px-2 py-1 bg-blue-100 rounded-full">x{counts[service.id]}</span>
                  <span onClick={(e) => {
                      e.stopPropagation();
                      onRemove(service.id);
                    }} className="text-xs px-2 py-1 bg-red-100 rounded-full cursor-pointer">Odejmij</span>
              </div>
              )}
              <div className="w-fit mb-2 text-xl font-semibold text-gray-800">
                {service.name}
            </div>
              <div className="text-gray-600 mb-2">
                <span>Price: ${service.price.toFixed(2)} · {service.durationMin} min</span>
        </div>
              <div className="flex items-center gap-2 w-full pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500 flex-auto">
                  {service.employees.length > 0
                    ? service.employees.map(({ employee }) => employee.name).join(', ')
                    : 'Brak specjalisty'}
                </span>
                <button
                  onClick={() => onAdd(service)}
                  disabled={service.employees.length === 0}
                  className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Dodaj do koszyka
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default ServicePanel;