import { prisma } from '@/lib/prisma';
import fs from 'fs';
import cuid from 'cuid';

interface ServiceItem {
  quantity: number;
  unitPrice: number;
  serviceName: string;
}

async function main() {
  const rawData = fs.readFileSync('./prisma/data.json', { encoding: 'utf-8' });
  const data = JSON.parse(rawData);

  // Create employees first (using email as unique identifier)
  for (const employee of data.employees) {
    await prisma.employee.upsert({
      where: { email: employee.email },
      update: {},
      create: employee,
    });
  }

  // Create services and store their IDs
  const serviceIdMap = new Map<string, string>();
  for (const service of data.services) {
    const createdService = await prisma.service.upsert({
      where: { 
        name: service.name,
        id: service.id || '',
      },
      update: {},
      create: {
        ...service,
        id: service.id || cuid(),
      },
    });

    serviceIdMap.set(service.name, createdService.id);
  }

  // Process transactions
  for (const transactionData of data.transactions) {
    const { totalAmount, paymentType, employeeName, services } = transactionData;

    // Find the corresponding employee by name
    const employee = await prisma.employee.findFirst({
      where: {
        name: employeeName,
      },
    });

    if (!employee) continue; // Skip if employee not found

    try {
      // Create transaction with services
      const transaction = await prisma.transaction.create({
        data: {
          totalAmount,
          paymentType,
          employeeId: employee.id,

          // Add purchased services to the transaction
          services: {
            create: services.map((serviceItem: ServiceItem) => ({
              service: {
                connect: {
                  id: serviceIdMap.get(serviceItem.serviceName)
                }
              },
                quantity: serviceItem.quantity,
                unitPrice: serviceItem.unitPrice,
            })),
          },
          },
      });

      console.log('Created transaction:', transaction.id);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });