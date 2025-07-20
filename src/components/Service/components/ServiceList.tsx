"use client";

import { useState, useEffect } from 'react';
import { getAllServices as getTransactions } from './actions';
import { PaymentType } from '../../../../generated/prisma';
import { DateTime } from 'luxon';

import { TransactionWithCategory } from "./getCategories"
import { getCategories } from "./getCategories"
import PurchasedService from './PurchasedService';

const ServiceList = () => {
  const [areTransactions, setAreTransactions] = useState<boolean>(false);
  const [transactionsWithCategories, setTransactionsWithCategories] = useState<TransactionWithCategory[]>([]);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const data = await getTransactions();
      if (data?.length > 0) {
        setAreTransactions(true);
        const categorizedData = getCategories(data);
        setTransactionsWithCategories(categorizedData);
      } else {
        setAreTransactions(false);
      }
    };

    fetchTransactions();
  }, []);


  return (
    <div className="space-y-6 p-6 flex flex-col gap-1 max-w-96">
      <h1 className="text-3xl font-bold text-gray-900">Transaction List</h1>

      {!areTransactions ? (
        <p className="text-gray-500">No transactions found.</p>
      ) : (
        <>
          {transactionsWithCategories.map((category) => {
            if (category.items.length > 0) {
              return (
                <div key={category.label} className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                    {category.label}
                  </h2>
                  {category.items.map((transaction) => (
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
                        <p className="text-sm text-gray-500">Date and Time: {DateTime.fromJSDate(transaction.createdAt).toFormat('yyyy LLL dd', { locale: 'pl' })}</p>
                      </div>


                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {expandedTransactionId === transaction.id && (
                          <div className="space-y-4 p-4">
                            <h3 className="font-medium text-gray-900 mb-4">Services Purchased:</h3>
                            <div className="flex flex-row flex-wrap gap-5">
                              {transaction.servicesDetails?.map((service, index) => {
                                return (
                                  <PurchasedService key={index} service={service}/>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          })}
        </>
      )}
    </div>
  )
};

export default ServiceList;

