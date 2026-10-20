-- On Muhasebe, Giderler, Stok Hareketleri ve Urun Maliyet alanlari.
-- HER DEPLOY'DA CALISIR, bu yuzden tekrar calistirildiginda hata vermemesi sart.
-- Mevcut verilere zarar vermez.

-- 1. Product tablosuna yeni sutunlar (yoksa ekle)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 20;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "minStockLevel" INTEGER NOT NULL DEFAULT 5;

-- 2. OrderItem tablosuna purchasePrice sutunu (yoksa ekle)
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 3. ExpenseCategory enum tipi
DO $$
BEGIN
  CREATE TYPE "ExpenseCategory" AS ENUM ('SHIPPING', 'MARKETING', 'COMMISSION', 'OPERATIONAL');
EXCEPTION
  WHEN duplicate_object THEN RAISE NOTICE 'ExpenseCategory tipi zaten var, atlandi';
END $$;

-- 4. Expense (Giderler) Tablosu
CREATE TABLE IF NOT EXISTS "Expense" (
    "id"        TEXT NOT NULL,
    "date"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title"     TEXT NOT NULL,
    "category"  "ExpenseCategory" NOT NULL,
    "amount"    DOUBLE PRECISION NOT NULL,
    "vatRate"   DOUBLE PRECISION NOT NULL DEFAULT 20,
    "invoiceNo" TEXT,
    "supplier"  TEXT,
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Expense_category_idx" ON "Expense"("category");
CREATE INDEX IF NOT EXISTS "Expense_date_idx"     ON "Expense"("date");

-- 5. StockMovement (Stok Hareketleri) Tablosu
CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id"        TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity"  INTEGER NOT NULL,
    "unitCost"  DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "invoiceNo" TEXT,
    "supplier"  TEXT,
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- Yabanci anahtar
DO $$
BEGIN
  ALTER TABLE "StockMovement"
    ADD CONSTRAINT "StockMovement_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN RAISE NOTICE 'StockMovement foreign key zaten var, atlandi';
  WHEN undefined_table  THEN RAISE NOTICE 'Product tablosu yok, atlandi';
END $$;
