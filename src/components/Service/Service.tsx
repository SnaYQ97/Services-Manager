import { defaultConfig } from "next/dist/server/config-shared";
import ServicePanel from "./components/ServicePanel";
import ServiceList from "./components/ServiceList";

const ServiceManagement = () => {
  return (
      <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Services Management</h1>
        <ServiceList />
        <ServicePanel />
    </div>
  )
};

export default ServiceManagement;  