-- Yonetici girisi icin Google Authenticator (TOTP) ve yedek kodlar.
--
-- secret: Base32 kodlanmis kriptografik gizli anahtar.
-- backupCodes: JSON dizisi halinde saklanan SHA-256 ozetli tek kullanimlik kurtarma kodlari.
-- aktif: TOTP kurulumunun tamamlanip etkinlestirildigini belirtir.
--
-- Betik her derlemede calisir, bu yuzden IF NOT EXISTS kullanilmalidir.

CREATE TABLE IF NOT EXISTS "AdminTotp" (
  "email"        TEXT NOT NULL,
  "secret"       TEXT NOT NULL,
  "backupCodes"  TEXT NOT NULL DEFAULT '[]',
  "aktif"        BOOLEAN NOT NULL DEFAULT false,
  "olusturma"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sonGiris"     TIMESTAMP(3),

  CONSTRAINT "AdminTotp_pkey" PRIMARY KEY ("email")
);
