import { ServicesDetails } from './getCategories'

const PurchasedService = ({service}: { service: ServicesDetails}) => {
    const total = service.quantity * service.unitPrice;
    return (
        <div
            className="relative p-4 bg-white rounded-lg shadow-sm border border-gray-100"
        >
            {/* Quantity and Total Price Badges */}
            <div className="absolute -top-3 right-2 flex items-center space-x-1">
                {service.quantity > 1 && <span className="text-xs px-2 py-1 bg-blue-100 rounded-full">x{service.quantity}</span>}
                <span className="text-xs px-2 py-1 bg-green-100 rounded-full">${service.unitPrice.toFixed(2)}</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{service.serviceName}</p>
            <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">Total: ${total.toFixed(2)}</p>
            </div>
        </div>
    )
}

export default PurchasedService;