-- Kargo takibi: firma, takip numarası ve kargoya veriliş anı.
--
-- Sipariş "Gönderildi" durumuna geçiyor ama müşteriye gönderinin nerede
-- olduğunu söyleyen hiçbir bilgi yoktu.

ALTER TABLE "Order" ADD COLUMN "kargoFirmasi" TEXT;
ALTER TABLE "Order" ADD COLUMN "kargoTakipNo" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3);
