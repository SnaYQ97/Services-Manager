/*
  Warnings:

  - You are about to alter the column `name` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `price` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Real`.
  - Added the required column `employeeId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentType` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "price" SET DATA TYPE REAL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "employeeId" VARCHAR(30) NOT NULL,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL,
ADD COLUMN     "promoCodeId" VARCHAR(30),
ADD COLUMN     "totalAmount" REAL NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6);

-- CreateTable
CREATE TABLE "PurchasedService" (
    "id" VARCHAR(30) NOT NULL,
    "serviceId" VARCHAR(30) NOT NULL,
    "transactionId" VARCHAR(30) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PurchasedService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" VARCHAR(30) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "discount" REAL NOT NULL,
    "isPercent" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(6),
    "validTo" TIMESTAMP(6),

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasedService" ADD CONSTRAINT "PurchasedService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasedService" ADD CONSTRAINT "PurchasedService_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
