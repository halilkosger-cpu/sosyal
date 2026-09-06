-- Yönetim işlemlerinin izi veritabanına taşınıyor.
--
-- Önceki hâli bellekte bir diziydi; sunucusuz ortamda örnek kapanınca
-- kayboluyordu. Ayrıntı için schema.prisma'daki DenetimKaydi açıklamasına
-- bakınız.

CREATE TABLE "DenetimKaydi" (
    "id" TEXT NOT NULL,
    "islem" TEXT NOT NULL,
    "eposta" TEXT NOT NULL,
    "durum" TEXT NOT NULL,
    "ayrinti" TEXT,
    "ip" TEXT,
    "olusturulma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DenetimKaydi_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DenetimKaydi_olusturulma_idx" ON "DenetimKaydi"("olusturulma");
CREATE INDEX "DenetimKaydi_eposta_olusturulma_idx" ON "DenetimKaydi"("eposta", "olusturulma");
CREATE INDEX "DenetimKaydi_islem_olusturulma_idx" ON "DenetimKaydi"("islem", "olusturulma");
