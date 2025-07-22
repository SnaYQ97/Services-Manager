"use client";

import { DateTime } from "luxon";
import { useState } from 'react';
import { Transaction } from "./getCategories"
import PurchasedService from "./PurchasedService";
import { PaymentType } from '../../../../generated/prisma';

const TransactionItem = ( {id, totalAmount, paymentType, createdAt, servicesDetails} : Transaction) => {

    const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

    return (
        <div
            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">Transaction #{id}</h2>
                <button
                    onClick={() => setExpandedTransactionId(expandedTransactionId === id ? null : id)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    aria-label="Toggle details"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedTransactionId === id ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'} />
                    </svg>
                </button>
            </div>

            <div className="p-6 space-y-3">
                <p className="text-sm text-gray-500">Amount: ${totalAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Payment Type: {paymentType}</p>
                <p className="text-sm text-gray-500">Date and Time: {DateTime.fromJSDate(createdAt).toFormat('yyyy LLL dd', { locale: 'pl' })}</p>
            </div>


            <div className="border-t border-gray-100 w-fit">
                {expandedTransactionId === id && (
                    <div className="p-6 flex flex-col w-fit basic-100">
                        <h3 className="font-medium text-gray-900 mb-4">Services Purchased:</h3>
                        <div className="flex shrink flex-row flex-wrap gap-5 w-fit">
                            {servicesDetails?.map((service, index) => {
                                return (
                                    <PurchasedService key={index} service={service} />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TransactionItem