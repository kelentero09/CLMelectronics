-- CreateTable
CREATE TABLE "board_repairs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "boardDescription" TEXT NOT NULL,
    "image" TEXT,
    "problem" TEXT NOT NULL,
    "repairRate" INTEGER NOT NULL DEFAULT 95,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_repairs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "board_repairs_key_key" ON "board_repairs"("key");

-- CreateIndex
CREATE INDEX "board_repairs_station_idx" ON "board_repairs"("station");

-- CreateIndex
CREATE INDEX "board_repairs_isActive_idx" ON "board_repairs"("isActive");
