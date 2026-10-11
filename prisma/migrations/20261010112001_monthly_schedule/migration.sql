-- CreateTable
CREATE TABLE "ScheduleMonth" (
    "id" VARCHAR(30) NOT NULL,
    "month" CHAR(7) NOT NULL,
    "publishedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ScheduleMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" VARCHAR(30) NOT NULL,
    "scheduleMonthId" VARCHAR(30) NOT NULL,
    "employeeId" VARCHAR(30) NOT NULL,
    "date" DATE NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleMonth_month_key" ON "ScheduleMonth"("month");

-- CreateIndex
CREATE INDEX "Shift_scheduleMonthId_idx" ON "Shift"("scheduleMonthId");

-- CreateIndex
CREATE INDEX "Shift_date_idx" ON "Shift"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_employeeId_date_key" ON "Shift"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_scheduleMonthId_fkey" FOREIGN KEY ("scheduleMonthId") REFERENCES "ScheduleMonth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Poprawność danych grafiku po stronie bazy
ALTER TABLE "ScheduleMonth" ADD CONSTRAINT "ScheduleMonth_month_format" CHECK ("month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_hours_check" CHECK ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");
