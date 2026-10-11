/*
  Warnings:

  - You are about to drop the column `promoCodeId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `PromoCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_promoCodeId_fkey";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'EMPLOYEE';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "durationMin" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "promoCodeId";

-- DropTable
DROP TABLE "PromoCode";

-- CreateTable
CREATE TABLE "EmployeeService" (
    "employeeId" VARCHAR(30) NOT NULL,
    "serviceId" VARCHAR(30) NOT NULL,

    CONSTRAINT "EmployeeService_pkey" PRIMARY KEY ("employeeId","serviceId")
);

-- CreateTable
CREATE TABLE "WorkingHours" (
    "id" VARCHAR(30) NOT NULL,
    "employeeId" VARCHAR(30) NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "WorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" VARCHAR(30) NOT NULL,
    "employeeId" VARCHAR(30) NOT NULL,
    "date" DATE NOT NULL,
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "reason" VARCHAR(255),

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startAt" TIMESTAMPTZ(6) NOT NULL,
    "endAt" TIMESTAMPTZ(6) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "clientName" VARCHAR(100) NOT NULL,
    "clientPhone" VARCHAR(30) NOT NULL,
    "note" VARCHAR(500),
    "serviceId" VARCHAR(30) NOT NULL,
    "employeeId" VARCHAR(30) NOT NULL,
    "transactionId" VARCHAR(30) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkingHours_employeeId_weekday_idx" ON "WorkingHours"("employeeId", "weekday");

-- CreateIndex
CREATE INDEX "ScheduleException_employeeId_date_idx" ON "ScheduleException"("employeeId", "date");

-- CreateIndex
CREATE INDEX "Booking_employeeId_startAt_idx" ON "Booking"("employeeId", "startAt");

-- AddForeignKey
ALTER TABLE "EmployeeService" ADD CONSTRAINT "EmployeeService_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeService" ADD CONSTRAINT "EmployeeService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Brak nakładających się aktywnych rezerwacji tego samego specjalisty (ochrona przed podwójną rezerwacją)
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_overlap"
  EXCLUDE USING gist ("employeeId" WITH =, tstzrange("startAt", "endAt") WITH &&)
  WHERE ("status" = 'CONFIRMED');
