-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('STAFF', 'SUPPLIER', 'CUSTOMER');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "customerUserId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "type" "AccountType" NOT NULL DEFAULT 'STAFF';

-- CreateIndex
CREATE INDEX "Sale_customerUserId_idx" ON "Sale"("customerUserId");

-- CreateIndex
CREATE INDEX "User_supplierId_idx" ON "User"("supplierId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
