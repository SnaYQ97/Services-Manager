import { PaymentType } from '../generated/prisma';
import { prisma,  } from '@/lib/prisma';

async function main() {
  // Create an employee first
  const aliceEmployee = await prisma.employee.upsert({
    where: { email: 'alice@prisma.io' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice@prisma.io',
    },
  });

  // Create some services
  const cleaningService = await prisma.service.create({
    data: {
      name: 'Cleaning Service',
      price: 50.99,
    },
  });

  const maintenanceService = await prisma.service.create({
    data: {
      name: 'Appliance Maintenance',
      price: 75.99,
    },
  });

  // Create a transaction with services
  const transaction = await prisma.transaction.create({
    data: {
      totalAmount: 126.98,
      paymentType: PaymentType.CARD,
      employeeId: aliceEmployee.id,

      // Add purchased services to the transaction
      services: {
        create: [
          {
            serviceId: cleaningService.id,
            quantity: 2,
            unitPrice: 50.99,
          },
          {
            serviceId: maintenanceService.id,
            quantity: 1,
            unitPrice: 75.99,
          },
        ],
      },
    },
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });