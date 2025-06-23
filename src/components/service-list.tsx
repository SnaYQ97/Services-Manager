"use client";

import { useState } from 'react';

interface Service {
  id: number;
  name: string;
  price: number;
}

export const ServiceList = ({ services }: { services: Service[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrowanie i sortowanie
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortBy === 'price') {
      return a.price - b.price;
    }
    return a.name.localeCompare(b.name);
  });

  // Paginacja
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = sortedServices.slice(startIndex, endIndex);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Lista Usług</h2>
      
      {/* Filtr i sortowanie */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Szukaj usługi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Sortuj po nazwie</option>
          <option value="price">Sortuj po cenie</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left">Nazwa usługi</th>
              <th className="px-6 py-3 text-left">Cena</th>
            </tr>
          </thead>
          <tbody>
            {paginatedServices.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{service.name}</td>
                <td className="px-6 py-4">PLN {service.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginacja */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-300' : 'bg-blue-500 text-white'} hover:bg-opacity-80`}
        >
          Poprzednia
        </button>
        
        <span>Strona {currentPage} z {Math.ceil(filteredServices.length / itemsPerPage)}</span>
        
        <button
          onClick={() => setCurrentPage(prev => prev + 1)}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-opacity-80"
        >
          Następna
        </button>
      </div>
    </div>
  );
};