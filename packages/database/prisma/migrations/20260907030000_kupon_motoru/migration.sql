-- Kupon motoru.
--
-- Kampanyalardan farkı: kampanya ürüne bağlı ve herkese açık, kupon bir
-- KODA bağlı ve kullanım hakkı sınırlı. Ayrıntı için schema.prisma.

CREATE TYPE "KuponTuru" AS ENUM ('YUZDE', 'TUTAR');

CREATE TABLE "Kupon" (
    "id" TEXT NOT NULL,
    "kod" TEXT NOT NULL,
    "tur" "KuponTuru" NOT NULL,
    "deger" DOUBLE PRECISION NOT NULL,
    "azamiIndirim" DOUBLE PRECISION,
    "asgariTutar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "baslangic" TIMESTAMP(3),
    "bitis" TIMESTAMP(3),
    "azamiKullanim" INTEGER,
    "musteriBasina" INTEGER NOT NULL DEFAULT 1,
    "hesapZorunlu" BOOLEAN NOT NULL DEFAULT true,
    "aciklama" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Kupon_kod_key" ON "Kupon"("kod");
CREATE INDEX "Kupon_aktif_bitis_idx" ON "Kupon"("aktif", "bitis");

CREATE TABLE "KuponKullanimi" (
    "id" TEXT NOT NULL,
    "kuponId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT,
    "eposta" TEXT NOT NULL,
    "indirim" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KuponKullanimi_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KuponKullanimi_orderId_key" ON "KuponKullanimi"("orderId");
CREATE INDEX "KuponKullanimi_kuponId_idx" ON "KuponKullanimi"("kuponId");
CREATE INDEX "KuponKullanimi_customerId_idx" ON "KuponKullanimi"("customerId");
CREATE INDEX "KuponKullanimi_eposta_idx" ON "KuponKullanimi"("eposta");

ALTER TABLE "KuponKullanimi" ADD CONSTRAINT "KuponKullanimi_kuponId_fkey"
    FOREIGN KEY ("kuponId") REFERENCES "Kupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KuponKullanimi" ADD CONSTRAINT "KuponKullanimi_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" ADD COLUMN "kuponKodu" TEXT;
ALTER TABLE "Order" ADD COLUMN "kuponIndirimi" DOUBLE PRECISION NOT NULL DEFAULT 0;
