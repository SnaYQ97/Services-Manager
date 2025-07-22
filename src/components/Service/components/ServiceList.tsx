"use client";

import { useState, useEffect } from 'react';
import { getAllServices as getTransactions } from './actions';

import { TransactionWithCategory } from "./getCategories"
import { getCategories } from "./getCategories"
import TransactionItem from './TransactionItem';

const ServiceList = () => {
  const [areTransactions, setAreTransactions] = useState<boolean>(false);
  const [transactionsWithCategories, setTransactionsWithCategories] = useState<TransactionWithCategory[]>([]);

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
    <div className="flex-auto flex-col gap-1 flex-auto">
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
                  {category.items.map((transaction, index) => (
                    <TransactionItem {...transaction} key={index} />
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

