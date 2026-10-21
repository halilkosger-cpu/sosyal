import { prisma } from '@isyurtlari/database';

let tabloOlusturuldu = false;

/**
 * ZiyaretKaydi tablosunun veritabanında var olduğunu garanti eder.
 * Neon / PgBouncer uyumluluğu için her DDL ifadesini bağımsız çalıştırır.
 */
export async function tabloyuHazirla(): Promise<void> {
  if (tabloOlusturuldu) return;

  try {
    // 1. Ana Tablo
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ZiyaretKaydi" (
        "id" TEXT PRIMARY KEY,
        "ziyaretciId" TEXT NOT NULL,
        "oturumId" TEXT NOT NULL,
        "sayfa" TEXT NOT NULL,
        "baslik" TEXT,
        "kaynak" TEXT NOT NULL DEFAULT 'direct',
        "tamKaynak" TEXT,
        "aramaMotoru" TEXT,
        "aramaKelimesi" TEXT,
        "ip" TEXT,
        "ulke" TEXT DEFAULT 'TR',
        "sehir" TEXT,
        "bolge" TEXT,
        "cihaz" TEXT DEFAULT 'MASAUSTU',
        "tarayici" TEXT,
        "isletimSistemi" TEXT,
        "ekran" TEXT,
        "dil" TEXT,
        "sureSaniye" INTEGER DEFAULT 0,
        "isBot" BOOLEAN DEFAULT false,
        "olusturulma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. İndeksler (Ayrı ifadeler halinde, hata atsa bile devam eder)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_olusturulma_idx" ON "ZiyaretKaydi"("olusturulma")`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_ziyaretciId_idx" ON "ZiyaretKaydi"("ziyaretciId")`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_kaynak_idx" ON "ZiyaretKaydi"("kaynak")`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_sehir_idx" ON "ZiyaretKaydi"("sehir")`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_sayfa_idx" ON "ZiyaretKaydi"("sayfa")`).catch(() => {});
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ZiyaretKaydi_isBot_idx" ON "ZiyaretKaydi"("isBot")`).catch(() => {});

    tabloOlusturuldu = true;
  } catch (err: any) {
    console.error('[ANALITIK DB HATASI]:', err?.message);
  }
}
