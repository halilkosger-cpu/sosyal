-- Yorumların mağaza müşterisine bağlanması.
--
-- Yorum ucu yazarın kimliğini istek gövdesinden alıyordu: "userId" alanına
-- başka birinin kimliğini yazan herkes onun adına yorum bırakabiliyordu.
-- Satın alma kontrolü de aynı sahte kimlikle yapıldığı için koruma
-- sağlamıyordu. Kimlik artık oturumdan geliyor; bu göç de yorumu Customer'a
-- bağlıyor.

ALTER TABLE "Review" ADD COLUMN "customerId"  TEXT;
ALTER TABLE "Review" ADD COLUMN "orderItemId" TEXT;
ALTER TABLE "Review" ALTER COLUMN "userId" DROP NOT NULL;

-- Bir müşteri bir ürüne yalnızca bir yorum bırakabilir.
CREATE UNIQUE INDEX "Review_customerId_productId_key" ON "Review"("customerId", "productId");
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");

-- Ürün sayfası ve liste ucu yalnızca onaylı yorumları okuyor; bileşik indeks
-- bu sorguyu karşılıyor.
CREATE INDEX "Review_productId_approved_idx" ON "Review"("productId", "approved");

ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
