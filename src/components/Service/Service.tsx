"use client";

import ServicePanel from "./components/ServicePanel";
import ServiceList from "./components/ServiceList";

const ServiceManagement = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Services Management</h1>
      <div className="flex gap-4 flex-wrap">
        <ServiceList />
        <ServicePanel />
      </div>
    </div>
  )
};

export default ServiceManagement;  