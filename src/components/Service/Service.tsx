"use client";

import ServicePanel from "./components/ServicePanel";
import ServiceList from "./components/ServiceList";

const ServiceManagement = () => {
  return (
    <div className="container mx-auto p-2">
      <h1 className="text-3xl font-bold mb-8">Services Management</h1>
      <div className="flex gap-6 flex-wrap">
        <ServiceList />
        <ServicePanel />
      </div>
    </div>
  )
};

export default ServiceManagement;  