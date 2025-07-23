"use client";

import { useState, useEffect } from 'react';
import { getAllServices } from './actions';
import { Service } from "../../../../generated/prisma" 

const ServicePanel = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<{[key: string]: number}>({});

  const handleServiceClick = (serviceId: string) => {
    setSelectedServices(prev => ({
      ...prev,
        [serviceId]: (prev[serviceId] || 0) + 1
    }));
  };
  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => {
      if (!prev[serviceId]) return prev;
      return {
        ...prev,
        [serviceId]: prev[serviceId] - 1
      };
    });
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const availableServices = await getAllServices();
        setServices(availableServices);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    fetchServices();
  }, []);

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
                selectedServices[service.id] > 0 ? 'relative border-2 border-blue-500 ring-1 ring-blue-500' : ''
              }`}
              onClick={() => handleServiceClick(service.id)}
            >
              {selectedServices[service.id] > 0 && (
                <div className="absolute -top-3 right-2 flex items-center space-x-1">
                  <span className="text-xs px-2 py-1 bg-blue-100 rounded-full">x{selectedServices[service.id]}</span>
                  <span onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveService(service.id);
                    }} className="text-xs px-2 py-1 bg-red-100 rounded-full">Odejmij</span>
              </div>
              )}
              <div className="w-fit mb-2 text-xl font-semibold text-gray-800">
                {service.name}
            </div>
              <div className="text-gray-600 mb-2">
                <span>Price: ${service.price.toFixed(2)}</span>
        </div>
              <div className="flex items-center gap-2 w-full pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">Ask for availability</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default ServicePanel;