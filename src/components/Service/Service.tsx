import { defaultConfig } from "next/dist/server/config-shared";
import ServicePanel from "./components/ServicePanel";
import ServiceList from "./components/ServiceList";

const ServiceManagement = () => {
  return (
     <div className="flex flex-row justify-between items-center w">
        <ServiceList />
        <ServicePanel />
    </div>
  )
};

export default ServiceManagement;  