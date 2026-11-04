-- Hediye kodu ve misafir yorumu icin tablolar. HER DEPLOY'DA CALISIR; tekrar
-- calistirildiginda hata vermemesi sart. Mevcut tablolara yalnizca bir bos
-- gecilebilir sutun eklenir (Review.misafirAd).
--
-- Tablolar ham SQL ile okunup yazilir (hiz-siniri.ts ile ayni desen); Prisma
-- modeli gerekmez.

-- ─── Hediye kodu: her siparise bir kod ───
-- Musteri bu kodu sevdiklerine WhatsApp ile gonderir. Kod, kaynak siparise
-- bagli; bir siparisin tek kodu olur.
CREATE TABLE IF NOT EXISTS "HediyeKodu" (
  "kod"             TEXT PRIMARY KEY,
  "kaynakSiparisId" TEXT NOT NULL UNIQUE,
  "olusturma"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Hediye kullanimi: kodla gelen siparisler ───
-- "Kisi basi bir kez" kurali veritabani duzeyinde: e-posta ve telefon
-- benzersiz. Ikisi de normallestirilmis (kucuk harf / yalniz rakam) yazilir.
CREATE TABLE IF NOT EXISTS "HediyeKullanimi" (
  "id"        TEXT PRIMARY KEY,
  "kod"       TEXT NOT NULL,
  "siparisId" TEXT NOT NULL UNIQUE,
  "eposta"    TEXT NOT NULL,
  "telefon"   TEXT NOT NULL,
  "olusturma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "HediyeKullanimi_eposta_key"  ON "HediyeKullanimi"("eposta");
CREATE UNIQUE INDEX IF NOT EXISTS "HediyeKullanimi_telefon_key" ON "HediyeKullanimi"("telefon");
CREATE INDEX IF NOT EXISTS "HediyeKullanimi_kod_idx" ON "HediyeKullanimi"("kod");

-- ─── Yorum daveti: hangi siparise e-posta gonderildi ───
CREATE TABLE IF NOT EXISTS "YorumDavetKaydi" (
  "siparisId"    TEXT PRIMARY KEY,
  "gonderildiAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Misafir yorumcunun gorunen adi ───
-- Review tablosu yoksa (bos veritabani) atlanir; derleme durmasin.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Review') THEN
    ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "misafirAd" TEXT;
  END IF;
END $$;
