import { prisma } from '@/lib/prisma';
import { dateOnlyToDb, SALON_TZ, timeToMinutes } from '@/lib/time';
import fs from 'fs';
import cuid from 'cuid';
import { DateTime } from 'luxon';
import bcrypt from 'bcryptjs';

interface ServiceItem {
  quantity: number;
  unitPrice: number;
  serviceName: string;
}

interface EmployeeData {
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER';
  services: string[];
  workingHours: { weekday: number; start: string; end: string }[];
}

async function main() {
  const rawData = fs.readFileSync('./prisma/data.json', { encoding: 'utf-8' });
  const data = JSON.parse(rawData);

  // Create services and store their IDs
  const serviceIdMap = new Map<string, string>();
  for (const service of data.services) {
    // nazwa nie jest unikalna w schemacie, więc zamiast upsert szukamy po nazwie
    const createdService = await prisma.service.findFirst({ where: { name: service.name } })
      ?? await prisma.service.create({
        data: {
          ...service,
          id: service.id || cuid(),
        },
      });

    serviceIdMap.set(service.name, createdService.id);
  }

  // Create employees (using email as unique identifier) with their services and weekly schedule
  for (const { services, workingHours, ...employee } of data.employees as EmployeeData[]) {
    const created = await prisma.employee.upsert({
      where: { email: employee.email },
      update: {},
      create: employee,
    });

    // hasła testowe trzymamy poza repo: SEED_PASSWORD_ALICE itd. w .env
    // pracownik bez hasła dostaje hasło testowe; ustawionych haseł nie nadpisujemy
    const password = process.env[`SEED_PASSWORD_${employee.email.split('@')[0].toUpperCase()}`];
    if (!password) {
      console.warn(`Brak SEED_PASSWORD dla ${employee.email} – pracownik nie będzie mógł się zalogować.`);
    } else if (!created.passwordHash) {
      await prisma.employee.update({ where: { id: created.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
    }

    // usługi i grafik tylko gdy pracownik ich nie ma – nie nadpisujemy zmian kierownika
    if ((await prisma.employeeService.count({ where: { employeeId: created.id } })) === 0) {
      await prisma.employeeService.createMany({
        data: services.map((serviceName) => ({ employeeId: created.id, serviceId: serviceIdMap.get(serviceName)! })),
      });
    }

    if ((await prisma.workingHours.count({ where: { employeeId: created.id } })) === 0) {
      await prisma.workingHours.createMany({
        data: workingHours.map(({ weekday, start, end }) => ({
          employeeId: created.id,
          weekday,
          startMinute: timeToMinutes(start),
          endMinute: timeToMinutes(end),
        })),
      });
    }
  }

  // Przykładowe wyjątki: Bob ma urlop w najbliższą środę, Charlie wychodzi wcześniej w czwartek
  const today = DateTime.now().setZone(SALON_TZ).startOf('day');
  const nextWeekday = (weekday: number) => today.plus({ days: ((weekday - today.weekday + 7) % 7) || 7 }).toISODate()!;
  const bob = await prisma.employee.findUnique({ where: { email: 'bob@prisma.io' } });
  const charlie = await prisma.employee.findUnique({ where: { email: 'charlie@prisma.io' } });
  const hasExceptions = (await prisma.scheduleException.count()) > 0;
  if (bob && !hasExceptions) {
    await prisma.scheduleException.create({
      data: { employeeId: bob.id, date: dateOnlyToDb(nextWeekday(3)), reason: 'Urlop' },
    });
  }
  if (charlie && !hasExceptions) {
    await prisma.scheduleException.create({
      data: {
        employeeId: charlie.id,
        date: dateOnlyToDb(nextWeekday(4)),
        startMinute: timeToMinutes('16:00'),
        endMinute: timeToMinutes('20:00'),
        reason: 'Wizyta lekarska',
      },
    });
  }

  // Process transactions (tylko w pustej bazie, żeby ponowny seed nie dublował danych)
  const transactions = (await prisma.transaction.count()) === 0 ? data.transactions : [];
  for (const transactionData of transactions) {
    const { totalAmount, paymentType, employeeName, services, createdAt } = transactionData;

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
          createdAt,

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
