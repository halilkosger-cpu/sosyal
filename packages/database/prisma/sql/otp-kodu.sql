-- Yonetici girisi icin tek kullanimlik kod.
--
-- Kod onceden bellekte tutuluyordu; sunucusuz ortamda kodu ureten ornek ile
-- dogrulayan ornek farkli olabildigi icin giris guvenilmezdi ve deneme sayaci
-- her ornekte sifirdan basliyordu.
--
-- Betik her derlemede calisiyor, bu yuzden tekrar calistirilabilir olmali.

CREATE TABLE IF NOT EXISTS "OtpKodu" (
  "email"        TEXT NOT NULL,
  "kodOzeti"     TEXT NOT NULL,
  "denemeSayisi" INTEGER NOT NULL DEFAULT 0,
  "sonKullanma"  TIMESTAMP(3) NOT NULL,
  "olusturma"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OtpKodu_pkey" PRIMARY KEY ("email")
);

CREATE INDEX IF NOT EXISTS "OtpKodu_sonKullanma_idx"
  ON "OtpKodu" ("sonKullanma");
