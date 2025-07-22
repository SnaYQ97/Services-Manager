'use server'

import { prisma } from '@/lib/prisma';

export async function getAllTransactions() {
  // Get transactions with their services and employee information
  const transactions = await prisma.transaction.findMany({
    include: {
      services: {
        include: {
          service: true,
        },
      },
      employee: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Transform the data to include service details
  const result = transactions.map(transaction => ({
    ...transaction, // Correctly spreading the transaction object
    totalServicesCount: transaction.services.reduce((acc, service) =>
      acc + service.quantity, 0),
    servicesDetails: transaction.services.map(service => ({
      serviceName: service.service.name,
      quantity: service.quantity,
      unitPrice: service.unitPrice,
    })),
  }));

  return result;
}

export async function getTransactionWithServices(id: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      services: {
        include: {
          service: true,
        },
      },
      employee: true,
    }
  });

  if (!transaction) throw new Error('Transaction not found');

  return transaction;
}

export async function getAllServices() {
  const services = await prisma.service.findMany();
  return services;
}