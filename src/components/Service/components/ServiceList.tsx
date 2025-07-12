"use client";

import { useState, useEffect } from 'react';
import { getAllServices as getTransactions } from './actions';
import { PaymentType } from '../../../../generated/prisma';

interface Transaction {
  id: string;
      createdAt: Date;
      totalAmount: number;
      paymentType: PaymentType;
      employee: {
        name: string;
      };
  servicesDetails?: {
    serviceName: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalServicesCount?: number;
}

const ServiceList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const data = await getTransactions();
      setTransactions(data);
    };

    fetchTransactions();
  }, []);

  return (
    <div className="space-y-6 p-6 flex flex-col gap-1 max-w-96">
      <h1 className="text-3xl font-bold text-gray-900">Transaction List</h1>
      
      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions found.</p>
      ) : (
        <div className="space-y-4 flex flex-col">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out"
                >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">Transaction #{transaction.id}</h2>
                <button
                  onClick={() => setExpandedTransactionId(expandedTransactionId === transaction.id ? null : transaction.id)}
                  className="text-blue-500 hover:text-blue-700 transition-colors duration-200 ease-in-out"
                  aria-label="Toggle details"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedTransactionId === transaction.id ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'} />
                    </svg>
                </button>
              </div>

              <div className="p-6 space-y-3 prose">
                <p className="text-sm text-gray-500">Amount: ${transaction.totalAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Payment Type: {transaction.paymentType}</p>
                <p className="text-sm text-gray-500">Date and Time: {new Date(transaction.createdAt).toLocaleString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>


              <div className="mt-4 pt-4 border-t border-gray-100">
                {expandedTransactionId === transaction.id && (
                  <div className="space-y-4 p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Services Purchased:</h3>
                    <div className="flex flex-row flex-wrap gap-5">
                      {transaction.servicesDetails?.map((service, index) => {
                        const total = service.quantity * service.unitPrice;
                        return (
                          <div
                            key={index}
                            className="relative p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                          >
                            {/* Quantity and Total Price Badges */}
                            <div className="absolute -top-3 right-2 flex items-center space-x-1">
                              <span className="text-xs px-2 py-1 bg-blue-100 rounded-full">x{service.quantity}</span>
                              <span className="text-xs px-2 py-1 bg-green-100 rounded-full">${service.unitPrice.toFixed(2)} / szt.</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{service.serviceName}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-500">Total: ${total.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceList;