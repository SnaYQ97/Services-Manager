-- CreateTable
CREATE TABLE "Transaction" (
    "id" VARCHAR(30) NOT NULL,
    "createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
