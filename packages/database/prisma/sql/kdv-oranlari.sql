-- KDV oranlari: gida %1, diger tum gruplar (temizlik, parfum, hediyelik, ahsap, peyzaj...) %20.
--
-- Bu dosya her derlemede tekrar calisir; ifadeler tekrar calistirilabilir.
-- Kategori guncellemesi yalnizca varsayilan (%10) degerde kalan kategorilere
-- dokunur: yonetici sonradan bir orani elle degistirirse ezilmez.

UPDATE "ProductCategory" SET "kdvOrani" = 1  WHERE "slug" = 'gida'  AND "kdvOrani" = 10;
UPDATE "ProductCategory" SET "kdvOrani" = 20 WHERE "slug" <> 'gida' AND "kdvOrani" = 10;

-- Henuz GIB'e resmi olarak gonderilmemis satis faturalarinin satirlari,
-- urunun kategorisindeki orana gore duzeltilir. Gonderilmis faturalara
-- (BASARILI / GIB_GONDERILDI / IMZALANDI / KUYRUKTA) dokunulmaz.
UPDATE "FaturaSatir" fs
SET "kdvOrani" = c."kdvOrani",
    "kdvTutari" = ROUND((fs."satirToplam" - fs."satirToplam" / (1 + c."kdvOrani" / 100))::numeric, 2)
FROM "Fatura" f, "Product" p, "ProductCategory" c
WHERE fs."faturaId" = f."id"
  AND fs."productId" = p."id"
  AND p."categoryId" = c."id"
  AND f."tur" = 'SATIS'
  AND f."orderId" IS NOT NULL
  AND f."eFaturaDurum" NOT IN ('BASARILI', 'GIB_GONDERILDI', 'IMZALANDI', 'KUYRUKTA')
  AND fs."kdvOrani" <> c."kdvOrani";

-- Satirlari degisen faturalarin matrah / KDV toplamlari satirlarla esitlenir.
UPDATE "Fatura" f
SET "kdvTutari" = t."kdv",
    "matrah" = ROUND((t."toplam" - t."kdv")::numeric, 2)
FROM (
  SELECT "faturaId", SUM("kdvTutari") AS "kdv", SUM("satirToplam") AS "toplam"
  FROM "FaturaSatir"
  GROUP BY "faturaId"
) t
WHERE t."faturaId" = f."id"
  AND f."tur" = 'SATIS'
  AND f."orderId" IS NOT NULL
  AND f."eFaturaDurum" NOT IN ('BASARILI', 'GIB_GONDERILDI', 'IMZALANDI', 'KUYRUKTA')
  AND ABS(f."kdvTutari" - t."kdv") > 0.01;
