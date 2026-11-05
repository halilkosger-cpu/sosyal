-- Adres: yapılandırılmış alanlar (sokak, bina/site, kat, kapı no). HER DEPLOY'DA
-- ÇALIŞIR; tekrar çalıştırıldığında hata vermemesi şart. Yalnızca boş geçilebilir
-- sütunlar eklenir; mevcut adresler etkilenmez (addressLine geriye dönük metin olarak kalır).

ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "sokak"    TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "binaSite" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "kat"      TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "daireNo"  TEXT;
