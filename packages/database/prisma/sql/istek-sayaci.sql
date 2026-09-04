-- Herkese acik formlarin hiz siniri icin istek sayaci.
--
-- Uygulama sunucusuz calistigi icin bellekteki sayac guvenilir degil; her
-- istek ayri bir ornekte islenebiliyor. Sayac burada, paylasilan tek yerde.
--
-- Betik her derlemede calisiyor, bu yuzden tekrar calistirilabilir olmali.

CREATE TABLE IF NOT EXISTS "IstekSayaci" (
  "anahtar"          TEXT NOT NULL,
  "adet"             INTEGER NOT NULL DEFAULT 0,
  "pencereBaslangic" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IstekSayaci_pkey" PRIMARY KEY ("anahtar")
);

-- Eski satirlarin temizligi bu indeks uzerinden yapiliyor.
CREATE INDEX IF NOT EXISTS "IstekSayaci_pencereBaslangic_idx"
  ON "IstekSayaci" ("pencereBaslangic");
