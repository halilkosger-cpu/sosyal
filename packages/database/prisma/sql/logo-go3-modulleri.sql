-- LOGO GO3 MODULLERI: CARI, FATURA, BANKA & KASA
-- HER DEPLOY'DA CALISIR, tekrar calistirildiginda hata vermez.

-- 1. Tipler
DO $$
BEGIN
  CREATE TYPE "CariTur" AS ENUM ('ALICI', 'SATICI');
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'CariTur tipi var';
END $$;

DO $$
BEGIN
  CREATE TYPE "HareketTur" AS ENUM ('BORC', 'ALACAK');
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'HareketTur tipi var';
END $$;

DO $$
BEGIN
  CREATE TYPE "FaturaTur" AS ENUM ('SATIS', 'SATINALMA');
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'FaturaTur tipi var';
END $$;

DO $$
BEGIN
  CREATE TYPE "BankaHareketTur" AS ENUM ('GIRIS', 'CIKIS');
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'BankaHareketTur tipi var';
END $$;

-- 2. CariKart Tablosu
CREATE TABLE IF NOT EXISTS "CariKart" (
    "id"           TEXT NOT NULL,
    "kod"          TEXT NOT NULL,
    "unvan"        TEXT NOT NULL,
    "tur"          "CariTur" NOT NULL DEFAULT 'ALICI',
    "muhasebeKodu" TEXT,
    "vergiDairesi" TEXT,
    "vergiTcNo"    TEXT,
    "eposta"       TEXT,
    "telefon"      TEXT,
    "adres"        TEXT,
    "sehir"        TEXT,
    "bakiye"       DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CariKart_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CariKart_kod_key" ON "CariKart"("kod");
CREATE INDEX IF NOT EXISTS "CariKart_tur_idx" ON "CariKart"("tur");

-- 3. CariHareket Tablosu
CREATE TABLE IF NOT EXISTS "CariHareket" (
    "id"        TEXT NOT NULL,
    "cariId"    TEXT NOT NULL,
    "tarih"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "islemTuru" TEXT NOT NULL,
    "belgeNo"   TEXT,
    "aciklama"  TEXT NOT NULL,
    "borc"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alacak"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bakiye"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CariHareket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CariHareket_cariId_idx" ON "CariHareket"("cariId");
CREATE INDEX IF NOT EXISTS "CariHareket_tarih_idx" ON "CariHareket"("tarih");

-- 4. Fatura Tablosu
CREATE TABLE IF NOT EXISTS "Fatura" (
    "id"          TEXT NOT NULL,
    "faturaNo"    TEXT NOT NULL,
    "tur"         "FaturaTur" NOT NULL DEFAULT 'SATIS',
    "tarih"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cariId"      TEXT NOT NULL,
    "orderId"     TEXT,
    "matrah"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kdvTutari"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "genelToplam" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aciklama"    TEXT,
    "durum"       TEXT NOT NULL DEFAULT 'ONAYLANDI',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Fatura_faturaNo_key" ON "Fatura"("faturaNo");
CREATE UNIQUE INDEX IF NOT EXISTS "Fatura_orderId_key" ON "Fatura"("orderId");
CREATE INDEX IF NOT EXISTS "Fatura_cariId_idx" ON "Fatura"("cariId");
CREATE INDEX IF NOT EXISTS "Fatura_tarih_idx" ON "Fatura"("tarih");

-- 5. FaturaSatir Tablosu
CREATE TABLE IF NOT EXISTS "FaturaSatir" (
    "id"          TEXT NOT NULL,
    "faturaId"    TEXT NOT NULL,
    "productId"   TEXT,
    "aciklama"    TEXT NOT NULL,
    "miktar"      INTEGER NOT NULL DEFAULT 1,
    "birimFiyat"  DOUBLE PRECISION NOT NULL,
    "kdvOrani"    DOUBLE PRECISION NOT NULL DEFAULT 20,
    "kdvTutari"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "satirToplam" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "FaturaSatir_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FaturaSatir_faturaId_idx" ON "FaturaSatir"("faturaId");

-- 6. BankaHesabi Tablosu
CREATE TABLE IF NOT EXISTS "BankaHesabi" (
    "id"        TEXT NOT NULL,
    "hesapAdi"  TEXT NOT NULL,
    "bankaAdi"  TEXT NOT NULL,
    "iban"      TEXT,
    "hesapNo"   TEXT,
    "subeKodu"  TEXT,
    "bakiye"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aktif"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankaHesabi_pkey" PRIMARY KEY ("id")
);

-- 7. BankaHareketi Tablosu
CREATE TABLE IF NOT EXISTS "BankaHareketi" (
    "id"           TEXT NOT NULL,
    "bankaHesapId" TEXT NOT NULL,
    "tarih"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tur"          "BankaHareketTur" NOT NULL,
    "tutar"        DOUBLE PRECISION NOT NULL,
    "cariId"       TEXT,
    "belgeNo"      TEXT,
    "aciklama"     TEXT NOT NULL,
    "durum"        TEXT NOT NULL DEFAULT 'ONAYLANDI',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankaHareketi_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BankaHareketi_bankaHesapId_idx" ON "BankaHareketi"("bankaHesapId");
CREATE INDEX IF NOT EXISTS "BankaHareketi_tarih_idx" ON "BankaHareketi"("tarih");

-- Yabancı Anahtarlar
DO $$
BEGIN
  ALTER TABLE "CariHareket" ADD CONSTRAINT "CariHareket_cariId_fkey" FOREIGN KEY ("cariId") REFERENCES "CariKart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'CariHareket fkey var';
END $$;

DO $$
BEGIN
  ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_cariId_fkey" FOREIGN KEY ("cariId") REFERENCES "CariKart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'Fatura fkey var';
END $$;

DO $$
BEGIN
  ALTER TABLE "FaturaSatir" ADD CONSTRAINT "FaturaSatir_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "Fatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'FaturaSatir fkey var';
END $$;

DO $$
BEGIN
  ALTER TABLE "BankaHareketi" ADD CONSTRAINT "BankaHareketi_bankaHesapId_fkey" FOREIGN KEY ("bankaHesapId") REFERENCES "BankaHesabi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'BankaHareketi banka fkey var';
END $$;
