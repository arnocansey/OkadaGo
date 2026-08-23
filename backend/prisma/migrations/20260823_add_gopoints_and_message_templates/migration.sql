-- CreateTable
CREATE TABLE "GoPointRule" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(300),
    "eventType" VARCHAR(60) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "perUnit" INTEGER NOT NULL DEFAULT 1,
    "minSpend" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoPointRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoPointBalance" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalRedeemed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoPointBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoPointLedger" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "points" INTEGER NOT NULL,
    "description" VARCHAR(200),
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoPointLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoPointRedemption" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(300),
    "pointsCost" INTEGER NOT NULL,
    "cashValue" DOUBLE PRECISION NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoPointRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "subject" VARCHAR(160) NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoPointRule_active_idx" ON "GoPointRule"("active");

-- CreateIndex
CREATE UNIQUE INDEX "GoPointBalance_passengerId_key" ON "GoPointBalance"("passengerId");

-- CreateIndex
CREATE INDEX "GoPointBalance_passengerId_idx" ON "GoPointBalance"("passengerId");

-- CreateIndex
CREATE INDEX "GoPointLedger_passengerId_createdAt_idx" ON "GoPointLedger"("passengerId", "createdAt");

-- CreateIndex
CREATE INDEX "GoPointRedemption_available_idx" ON "GoPointRedemption"("available");

-- CreateIndex
CREATE INDEX "MessageTemplate_category_active_idx" ON "MessageTemplate"("category", "active");

-- AddForeignKey
ALTER TABLE "GoPointBalance" ADD CONSTRAINT "GoPointBalance_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "PassengerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoPointLedger" ADD CONSTRAINT "GoPointLedger_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "PassengerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;