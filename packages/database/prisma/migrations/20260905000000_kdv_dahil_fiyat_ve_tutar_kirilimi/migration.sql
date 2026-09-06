-- Kategori bazli KDV orani.
--
-- Urun fiyatlari KDV dahildir; bu oran KDV'yi fiyatin icinden hesaplamak icin
-- kullanilir, fiyatin ustune eklemek icin degil. Baslangic degeri sitenin
-- bugune kadar uyguladigi %10 ile ayni; boylece mevcut kategorilerin
-- davranisi degismez.
ALTER TABLE "ProductCategory" ADD COLUMN "kdvOrani" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- Siparis tutar kirilimi.
--
-- itemsTotal ve taxTotal bilerek NULL kabul ediyor: bu alanlar eklenmeden
-- once olusmus siparislerde kirilim hic uretilmedi, 0 yazmak "KDV yoktu"
-- anlamina gelirdi. Eski kayitlar "bilinmiyor" olarak kaliyor.
ALTER TABLE "Order" ADD COLUMN "itemsTotal"     DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN "taxTotal"       DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN "discountTotal"  DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "shippingCost"   DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "billingAddress" TEXT;
