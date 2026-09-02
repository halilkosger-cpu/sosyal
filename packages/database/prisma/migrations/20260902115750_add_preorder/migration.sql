-- CreateEnum
CREATE TYPE "PreOrderStatus" AS ENUM ('WAITING', 'NOTIFIED', 'CONVERTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PreOrder" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "note" TEXT,
    "status" "PreOrderStatus" NOT NULL DEFAULT 'WAITING',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PreOrder_productId_status_idx" ON "PreOrder"("productId", "status");

-- CreateIndex
CREATE INDEX "PreOrder_email_idx" ON "PreOrder"("email");

-- CreateIndex
CREATE INDEX "PreOrder_createdAt_idx" ON "PreOrder"("createdAt");

-- AddForeignKey
ALTER TABLE "PreOrder" ADD CONSTRAINT "PreOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOrder" ADD CONSTRAINT "PreOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

