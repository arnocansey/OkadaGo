-- CreateTable
CREATE TABLE "RiderOnlineLog" (
    "id" TEXT NOT NULL,
    "riderProfileId" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "latitude" DECIMAL(10, 7),
    "longitude" DECIMAL(10, 7),
    "serviceZoneId" TEXT,
    "isMocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiderOnlineLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiderOnlineLog_riderProfileId_createdAt_idx" ON "RiderOnlineLog"("riderProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "RiderOnlineLog_createdAt_idx" ON "RiderOnlineLog"("createdAt");

-- AddForeignKey
ALTER TABLE "RiderOnlineLog" ADD CONSTRAINT "RiderOnlineLog_riderProfileId_fkey" FOREIGN KEY ("riderProfileId") REFERENCES "RiderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
