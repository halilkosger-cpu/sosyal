-- Sepet ve favorilerin magaza musterisine baglanmasi.
--
-- Iki tablo da vardi ama e-ticaret tarafinda kullanilmiyordu: ikisi de sosyal
-- platformun "User" tablosuna zorunlu olarak bagliydi ve o baglanti hicbir
-- zaman kurulamadigi icin sepet de favoriler de tarayicida tutuluyordu.
--
-- Buradaki tek "yikici" gorunen adim userId'nin NOT NULL kisitinin
-- kaldirilmasi; bu kisiti gevsetmek mevcut satirlari etkilemez.

-- ─── Sepet ───────────────────────────────────────────────────────────
ALTER TABLE "Cart" ADD COLUMN "customerId" TEXT;
ALTER TABLE "Cart" ALTER COLUMN "userId" DROP NOT NULL;

CREATE UNIQUE INDEX "Cart_customerId_key" ON "Cart"("customerId");

ALTER TABLE "Cart" ADD CONSTRAINT "Cart_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Favoriler ───────────────────────────────────────────────────────
ALTER TABLE "Favorite" ADD COLUMN "customerId" TEXT;
ALTER TABLE "Favorite" ALTER COLUMN "userId" DROP NOT NULL;

CREATE UNIQUE INDEX "Favorite_customerId_productId_key" ON "Favorite"("customerId", "productId");
CREATE INDEX "Favorite_customerId_idx" ON "Favorite"("customerId");

ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
