-- Ziyaretçi ve Trafik Analitiği Tablosu
CREATE TABLE IF NOT EXISTS "ZiyaretKaydi" (
  "id" TEXT PRIMARY KEY,
  "ziyaretciId" TEXT NOT NULL,
  "oturumId" TEXT NOT NULL,
  "sayfa" TEXT NOT NULL,
  "baslik" TEXT,
  "kaynak" TEXT NOT NULL DEFAULT 'direct',
  "tamKaynak" TEXT,
  "aramaMotoru" TEXT,
  "aramaKelimesi" TEXT,
  "ip" TEXT,
  "ulke" TEXT DEFAULT 'TR',
  "sehir" TEXT,
  "bolge" TEXT,
  "cihaz" TEXT DEFAULT 'MASAUSTU',
  "tarayici" TEXT,
  "isletimSistemi" TEXT,
  "ekran" TEXT,
  "dil" TEXT,
  "sureSaniye" INTEGER DEFAULT 0,
  "isBot" BOOLEAN DEFAULT false,
  "olusturulma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_olusturulma_idx" ON "ZiyaretKaydi"("olusturulma");
CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_ziyaretciId_idx" ON "ZiyaretKaydi"("ziyaretciId");
CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_kaynak_idx" ON "ZiyaretKaydi"("kaynak");
CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_sehir_idx" ON "ZiyaretKaydi"("sehir");
CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_sayfa_idx" ON "ZiyaretKaydi"("sayfa");
CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_isBot_idx" ON "ZiyaretKaydi"("isBot");
