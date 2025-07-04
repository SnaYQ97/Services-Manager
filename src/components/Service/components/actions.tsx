'use server'

import { PrismaClient } from '../../../../generated/prisma'

const prisma = new PrismaClient()

export async function getAllServices() {
  return await prisma.service.findMany()
}

// export async function addService(service: Omit<Service, 'id'>) {
//   return await prisma.service.create({
//     data: service
//   })
// }