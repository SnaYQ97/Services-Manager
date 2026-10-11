-- AlterTable
ALTER TABLE "AuthSession" DROP COLUMN "expiresAt",
ADD COLUMN     "lastSeenAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "sessionIdleMinutes" INTEGER NOT NULL DEFAULT 30,
    "sessionMaxHours" INTEGER NOT NULL DEFAULT 8,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);


-- Jeden wiersz ustawień; te same granice co w formularzu (src/lib/sessionLimits.ts)
ALTER TABLE "AppSettings"
    ADD CONSTRAINT "AppSettings_single_row" CHECK ("id" = 1),
    ADD CONSTRAINT "AppSettings_session_ranges" CHECK ("sessionIdleMinutes" BETWEEN 5 AND 240 AND "sessionMaxHours" BETWEEN 1 AND 24);
