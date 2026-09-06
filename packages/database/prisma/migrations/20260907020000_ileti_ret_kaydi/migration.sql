-- Ticari ileti izninin geri alınma kaydı.
--
-- Ret önceden iletiIzniAt'i NULL yaparak işleniyordu; bu, iznin ne zaman
-- alındığı kaydını siliyor ve "hiç izin vermemiş" ile "izin verip geri
-- almış" ayrımını yok ediyordu.

ALTER TABLE "Customer" ADD COLUMN "iletiRetAt" TIMESTAMP(3);
