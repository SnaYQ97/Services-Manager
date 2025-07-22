"use client";

import { useState, useEffect } from 'react';
import { getAllServices } from './actions';

const ServicePanel = () => {
  const [services, setServices] = useState<any[]>([]);

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
    <main className="flex flex-auto flex-col gap-[32px] row-start-2 items-center">
      <h1 className="text-3xl font-bold text-gray-900">Available Services</h1>
      
      {services.length === 0 ? (
        <p className="text-gray-500">No services available.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 w-full">
          {services.map((service, index) => (
            <div 
              key={index}
              className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-gray-800">{service.name}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default ServicePanel;