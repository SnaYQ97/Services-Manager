"use client";

import { useState, useEffect } from 'react'
import { getAllServices } from './actions'

const ServiceList = () => {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    const fetchServices = async () => {
      const data = await getAllServices()
      setServices(data)
    }
    
    fetchServices()
  }, [])

  return (
    <aside className="p-4">
      <h2 className="text-xl font-bold mb-4">Services List</h2>
      {services.length === 0 ? (
        <p>No services found.</p>
      ) : (
        <ul className="space-y-2">
          {services.map((service) => (
            <li key={service.id} className="border p-3 rounded">
              <h3 className="font-medium">{service.name}</h3>
              <p className="text-gray-600">{service.description}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="bg-blue-100 px-2 py-1 rounded text-sm">
                  {service.status}
                </span>
                <span className="font-medium">${service.price}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
};

export default ServiceList
