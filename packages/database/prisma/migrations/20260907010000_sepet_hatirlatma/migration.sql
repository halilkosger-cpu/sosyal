-- Terk edilmiş sepet hatırlatması.
--
-- Aynı sepet için ikinci kez e-posta gitmesin diye gönderim anı
-- saklanıyor; ayrıntı için schema.prisma'daki açıklamaya bakınız.

ALTER TABLE "Cart" ADD COLUMN "hatirlatmaGonderildiAt" TIMESTAMP(3);
