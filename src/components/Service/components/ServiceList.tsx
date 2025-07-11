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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transaction List</h1>
      
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold">Transaction #{transaction.id}</h2>
                <button
                  onClick={() => setExpandedTransactionId(expandedTransactionId === transaction.id ? null : transaction.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {expandedTransactionId === transaction.id ? '↑' : '↓'}
                </button>
              </div>
              <p>Amount: ${transaction.totalAmount.toFixed(2)}</p>
              <p>Payment Type: {transaction.paymentType}</p>
              <p>Date: {new Date(transaction.createdAt).toLocaleDateString()}</p>
              <p>Sold by: {transaction.employee.name}</p>

              {expandedTransactionId === transaction.id && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Services Purchased:</h3>
                  <div className="space-y-2">
                    {transaction.servicesDetails?.map((service, index) => (
                      <div key={index} className="border-t pt-2">
                        <p>{service.serviceName}</p>
                        <p>Quantity: {service.quantity}</p>
                        <p>Unit Price: ${service.unitPrice.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceList;