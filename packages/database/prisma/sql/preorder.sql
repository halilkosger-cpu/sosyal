-- PreOrder tablosunu olusturur. HER DEPLOY'DA CALISIR, bu yuzden tekrar
-- calistirildiginda hata vermemesi sart. Mevcut hicbir tabloya dokunmaz.
--
-- Neden migration yerine bu dosya: canli veritabaninin adresi Vercel'de
-- "Sensitive" olarak saklandigi icin disaridan erisilemiyor. Vercel derleme
-- sirasinda kendi DATABASE_URL'ini veriyor ve bu betik dogru veritabaninda
-- calisiyor.

-- ─── Durum tipi ───
DO $$
BEGIN
  CREATE TYPE "PreOrderStatus" AS ENUM ('WAITING', 'NOTIFIED', 'CONVERTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN RAISE NOTICE 'PreOrderStatus tipi zaten var, atlandi';
END $$;

-- ─── Tablo ───
CREATE TABLE IF NOT EXISTS "PreOrder" (
    "id"         TEXT NOT NULL,
    "productId"  TEXT NOT NULL,
    "userId"     TEXT,
    "quantity"   INTEGER NOT NULL DEFAULT 1,
    "name"       TEXT NOT NULL,
    "email"      TEXT NOT NULL,
    "phone"      TEXT,
    "note"       TEXT,
    "status"     "PreOrderStatus" NOT NULL DEFAULT 'WAITING',
    "notifiedAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PreOrder_pkey" PRIMARY KEY ("id")
);

-- ─── Indeksler ───
CREATE INDEX IF NOT EXISTS "PreOrder_productId_status_idx" ON "PreOrder"("productId", "status");
CREATE INDEX IF NOT EXISTS "PreOrder_email_idx"            ON "PreOrder"("email");
CREATE INDEX IF NOT EXISTS "PreOrder_createdAt_idx"        ON "PreOrder"("createdAt");

-- ─── Yabanci anahtarlar ───
-- Bunlar butunluk kurallari; olmadan da ozellik calisir. Hedef tablo yoksa
-- derlemeyi kirmak yerine uyari birakip devam ediyoruz.
DO $$
BEGIN
  ALTER TABLE "PreOrder" ADD CONSTRAINT "PreOrder_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  RAISE NOTICE 'PreOrder_productId_fkey eklendi';
EXCEPTION
  WHEN duplicate_object THEN RAISE NOTICE 'PreOrder_productId_fkey zaten var, atlandi';
  WHEN undefined_table  THEN RAISE WARNING 'DIKKAT: "Product" tablosu bulunamadi, foreign key eklenmedi';
END $$;

DO $$
BEGIN
  ALTER TABLE "PreOrder" ADD CONSTRAINT "PreOrder_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  RAISE NOTICE 'PreOrder_userId_fkey eklendi';
EXCEPTION
  WHEN duplicate_object THEN RAISE NOTICE 'PreOrder_userId_fkey zaten var, atlandi';
  WHEN undefined_table  THEN RAISE WARNING 'DIKKAT: "User" tablosu bulunamadi, foreign key eklenmedi';
END $$;
