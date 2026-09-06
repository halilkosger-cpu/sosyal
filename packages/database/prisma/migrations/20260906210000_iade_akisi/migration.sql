-- İade akışı.
--
-- Alt bilgide "14 gün içinde cayma hakkı" yazıyor ve mesafeli satış
-- sözleşmesi bunu taahhüt ediyordu, ama arkasında hiçbir süreç yoktu.
-- Müşteri iade için iletişim formundan yazmak zorundaydı; talebin izi
-- kalmıyor, kimin ne zaman ne istediği takip edilemiyordu.

CREATE TYPE "ReturnStatus" AS ENUM ('TALEP', 'ONAYLANDI', 'REDDEDILDI', 'URUN_ULASTI', 'TAMAMLANDI', 'IPTAL');

-- Cayma süresi SİPARİŞ tarihinden değil TESLİM tarihinden sayılır.
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);

CREATE TABLE "Return" (
    "id"           TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "orderId"      TEXT NOT NULL,
    "customerId"   TEXT,
    "status"       "ReturnStatus" NOT NULL DEFAULT 'TALEP',
    "reason"       TEXT NOT NULL,
    "note"         TEXT,
    "adminNote"    TEXT,
    "refundAmount" DOUBLE PRECISION,
    "refundedAt"   TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Return_returnNumber_key" ON "Return"("returnNumber");
CREATE INDEX "Return_orderId_idx"           ON "Return"("orderId");
CREATE INDEX "Return_customerId_idx"        ON "Return"("customerId");
CREATE INDEX "Return_status_createdAt_idx"  ON "Return"("status", "createdAt");

CREATE TABLE "ReturnItem" (
    "id"          TEXT NOT NULL,
    "returnId"    TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity"    INTEGER NOT NULL,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- Aynı iade talebinde aynı sipariş kalemi iki kez yer almasın.
CREATE UNIQUE INDEX "ReturnItem_returnId_orderItemId_key" ON "ReturnItem"("returnId", "orderItemId");
CREATE INDEX "ReturnItem_returnId_idx" ON "ReturnItem"("returnId");

ALTER TABLE "Return" ADD CONSTRAINT "Return_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Return" ADD CONSTRAINT "Return_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey"
  FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
