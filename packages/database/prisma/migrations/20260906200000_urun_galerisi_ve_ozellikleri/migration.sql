-- Ürün galerisi ve özellikleri.
--
-- Product.imageUrl olduğu gibi kalıyor: kart listeleri, arama önerileri,
-- sipariş e-postaları ve sitemap hep onu okuyor. Bu tablolar onun yerine
-- geçmiyor, üzerine ekliyor.

CREATE TABLE "ProductImage" (
    "id"        TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url"       TEXT NOT NULL,
    "alt"       TEXT,
    "sira"      INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductImage_productId_sira_idx" ON "ProductImage"("productId", "sira");

CREATE TABLE "ProductAttribute" (
    "id"        TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ad"        TEXT NOT NULL,
    "deger"     TEXT NOT NULL,
    "sira"      INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- Aynı ürüne aynı özellik adı iki kez girilmesin.
CREATE UNIQUE INDEX "ProductAttribute_productId_ad_key" ON "ProductAttribute"("productId", "ad");
CREATE INDEX "ProductAttribute_productId_sira_idx" ON "ProductAttribute"("productId", "sira");
-- Faset filtreleme ileride bu tablodan beslenecek.
CREATE INDEX "ProductAttribute_ad_idx" ON "ProductAttribute"("ad");

ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
