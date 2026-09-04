import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { prisma } from '@isyurtlari/database';

/**
 * Yonetici girisi icin tek kullanimlik kod.
 *
 * Kod onceden bellekte (REDIS_URL tanimliysa Redis'te) tutuluyordu. Uygulama
 * sunucusuz calisiyor ve REDIS_URL tanimli degil; bu yuzden kodu ureten ornek
 * ile dogrulayan ornek farkli olabiliyordu. Iki sonucu vardi:
 *   - Giris bazen sebepsiz "hatali kod" veriyordu.
 *   - Deneme sayaci her ornekte sifirdan basladigi icin 5 deneme siniri
 *     gercekte islemiyordu.
 *
 * Kod artik veritabaninda, ozeti alinarak saklaniyor.
 */

const GECERLILIK_DK = 10;
const AZAMI_DENEME = 5;

const ozetle = (kod: string) => createHash('sha256').update(kod).digest('hex');

/**
 * Kriptografik olarak guvenli 6 haneli kod.
 *
 * Math.random() kullanilmiyordu; tahmin edilebilir bir uretecin giris kodu
 * uretmesi dogru degil.
 */
export function generateOTP(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function storeOTP(email: string, code: string): Promise<void> {
  const sonKullanma = new Date(Date.now() + GECERLILIK_DK * 60 * 1000);

  await prisma.otpKodu.upsert({
    where: { email },
    create: { email, kodOzeti: ozetle(code), sonKullanma, denemeSayisi: 0 },
    // Yeni kod istendiginde deneme sayaci sifirlanir.
    update: { kodOzeti: ozetle(code), sonKullanma, denemeSayisi: 0, olusturma: new Date() },
  });
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const kayit = await prisma.otpKodu.findUnique({ where: { email } });
  if (!kayit) return false;

  if (kayit.sonKullanma < new Date()) {
    await prisma.otpKodu.delete({ where: { email } }).catch(() => {});
    return false;
  }

  if (kayit.denemeSayisi >= AZAMI_DENEME) {
    await prisma.otpKodu.delete({ where: { email } }).catch(() => {});
    return false;
  }

  // Deneme sayaci karsilastirmadan ONCE artiriliyor: karsilastirma sirasinda
  // bir hata olusursa bile deneme sayilmis olur.
  await prisma.otpKodu.update({
    where: { email },
    data: { denemeSayisi: { increment: 1 } },
  });

  // Sabit surede karsilastirma: kodun ne kadarinin dogru oldugu, yanit
  // suresinden anlasilamasin.
  const gelen = Buffer.from(ozetle(String(code)));
  const beklenen = Buffer.from(kayit.kodOzeti);
  const dogru = gelen.length === beklenen.length && timingSafeEqual(gelen, beklenen);

  if (dogru) {
    await prisma.otpKodu.delete({ where: { email } }).catch(() => {});
    return true;
  }

  return false;
}

export async function deleteOTP(email: string): Promise<void> {
  await prisma.otpKodu.delete({ where: { email } }).catch(() => {});
}

export async function getRemainingAttempts(email: string): Promise<number> {
  const kayit = await prisma.otpKodu.findUnique({
    where: { email },
    select: { denemeSayisi: true },
  });
  if (!kayit) return AZAMI_DENEME;
  return Math.max(0, AZAMI_DENEME - kayit.denemeSayisi);
}

/** Suresi gecmis kodlari siler. Dusuk olasilikla tetiklenir. */
export async function kodlariTemizle(olasilik = 0.05): Promise<void> {
  if (Math.random() > olasilik) return;
  await prisma.otpKodu.deleteMany({ where: { sonKullanma: { lt: new Date() } } }).catch(() => {});
}
