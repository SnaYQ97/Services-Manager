-- Kwoty jako DECIMAL(10,2) zamiast float – bez błędów zaokrągleń
ALTER TABLE "Service" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2) USING round("price"::numeric, 2);
ALTER TABLE "Transaction" ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(10,2) USING round("totalAmount"::numeric, 2);
ALTER TABLE "PurchasedService" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(10,2) USING round("unitPrice"::numeric, 2);

-- Daty ze strefą czasową. Prisma zapisywała je jako UTC w kolumnie bez strefy,
-- więc jawnie interpretujemy stare wartości jako UTC (inaczej Postgres użyłby strefy sesji).
ALTER TABLE "Transaction" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6) USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "Booking" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6) USING "createdAt" AT TIME ZONE 'UTC';

-- Blokada logowania i unieważnianie sesji
ALTER TABLE "Employee" ADD COLUMN "failedLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMPTZ(6),
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
