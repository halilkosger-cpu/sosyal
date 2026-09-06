-- Magaza musterisi: sosyal platformun "User" tablosundan ayri.
--
-- Mevcut hicbir tablo bozulmuyor; "Order" tablosuna yalnizca istege bagli
-- bir "customerId" kolonu ekleniyor, eski misafir siparisleri oldugu gibi
-- kaliyor.

CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "CustomerTokenType" AS ENUM ('EMAIL_DOGRULAMA', 'SIFRE_SIFIRLAMA');

CREATE TABLE "Customer" (
    "id"            TEXT NOT NULL,
    "email"         TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name"          TEXT NOT NULL,
    "phone"         TEXT,
    -- scrypt ozeti; bicimi lib/musteri-auth.ts belirliyor
    "passwordHash"  TEXT NOT NULL,
    "status"        "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    -- KVKK onayi olmadan kayit olusturulmuyor, bu yuzden NOT NULL
    "kvkkOnayAt"    TIMESTAMP(3) NOT NULL,
    "iletiIzniAt"   TIMESTAMP(3),
    "userId"        TEXT,
    "lastLoginAt"   TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_email_key"  ON "Customer"("email");
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");
CREATE INDEX "Customer_email_idx"     ON "Customer"("email");
CREATE INDEX "Customer_createdAt_idx" ON "Customer"("createdAt");

-- Oturumlar. Jetonun kendisi degil SHA-256 ozeti saklaniyor.
CREATE TABLE "CustomerSession" (
    "id"         TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tokenHash"  TEXT NOT NULL,
    "expiresAt"  TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent"  TEXT,
    "ip"         TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerSession_tokenHash_key" ON "CustomerSession"("tokenHash");
CREATE INDEX "CustomerSession_customerId_idx" ON "CustomerSession"("customerId");
CREATE INDEX "CustomerSession_expiresAt_idx"  ON "CustomerSession"("expiresAt");

-- E-posta dogrulama ve sifre sifirlama jetonlari.
CREATE TABLE "CustomerToken" (
    "id"         TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type"       "CustomerTokenType" NOT NULL,
    "tokenHash"  TEXT NOT NULL,
    "expiresAt"  TIMESTAMP(3) NOT NULL,
    "usedAt"     TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerToken_tokenHash_key" ON "CustomerToken"("tokenHash");
CREATE INDEX "CustomerToken_customerId_type_idx" ON "CustomerToken"("customerId", "type");
CREATE INDEX "CustomerToken_expiresAt_idx"       ON "CustomerToken"("expiresAt");

-- Adres defteri.
CREATE TABLE "Address" (
    "id"                TEXT NOT NULL,
    "customerId"        TEXT NOT NULL,
    "title"             TEXT NOT NULL,
    "fullName"          TEXT NOT NULL,
    "phone"             TEXT NOT NULL,
    "city"              TEXT NOT NULL,
    "district"          TEXT NOT NULL,
    "neighborhood"      TEXT,
    "addressLine"       TEXT NOT NULL,
    "postalCode"        TEXT,
    "isDefaultShipping" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultBilling"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Address_customerId_idx" ON "Address"("customerId");

-- Siparisin musteriye baglanmasi. Misafir siparislerinde NULL kalir.
ALTER TABLE "Order" ADD COLUMN "customerId" TEXT;
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

ALTER TABLE "CustomerSession" ADD CONSTRAINT "CustomerSession_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerToken" ADD CONSTRAINT "CustomerToken_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Address" ADD CONSTRAINT "Address_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
