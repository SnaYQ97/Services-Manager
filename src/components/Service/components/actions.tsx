'use server'

import { prisma } from '@/lib/prisma';

export async function getAllServices() {
  return await prisma.service.findMany()
}

// export async function addService(service: Omit<Service, 'id'>) {
//   return await prisma.service.create({
//     data: service
//   })
// }