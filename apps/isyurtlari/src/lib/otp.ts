import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { prisma } from '@isyurtlari/database';

/**
 * Yönetici Girişi İçin Üst Düzey Güvenlikli OTP (Tek Kullanımlık Kod) Sistemi.
 *
 * Güvenlik Katmanları:
 * 1. Kriptografik CSPRNG ile tahmin edilemez 6 haneli kod üretimi.
 * 2. Kodun kendisi veritabanında ASLA düz metin tutulmaz, SHA-256 özetiyle saklanır.
 * 3. Zamanlama saldırılarını (timing attack) önlemek için `timingSafeEqual` ile sabit sürede karşılaştırma.
 * 4. Kaba kuvvet (brute-force) koruması: En fazla 5 hatalı deneme hakkı, sonrasında kod otomatik imha edilir.
 * 5. Sunucu/veritabanı zaman dilimi (timezone) kaymalarına karşı çift aşamalı süre kontrolü (15 dakika tolerans).
 * 6. E-posta ve kod girişlerinde boşluk, özel karakter ve büyük/küçük harf toleranslı otomatik normalizasyon.
 */

const GECERLILIK_DK = 15;
const AZAMI_DENEME = 5;

const ozetle = (kod: string): string =>
  createHash('sha256').update(String(kod).trim()).digest('hex');

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

export function normalizeCode(code: string): string {
  return String(code || '').replace(/\D/g, '').trim();
}

/**
 * Kriptografik olarak güvenli 6 haneli tek kullanımlık kod üretir.
 */
export function generateOTP(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Üretilen kodu SHA-256 ile özetleyip veritabanında saklar.
 */
export async function storeOTP(rawEmail: string, rawCode: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  const code = normalizeCode(rawCode);

  const sonKullanma = new Date(Date.now() + GECERLILIK_DK * 60 * 1000);
  const kodOzeti = ozetle(code);

  await prisma.otpKodu.upsert({
    where: { email },
    create: {
      email,
      kodOzeti,
      sonKullanma,
      denemeSayisi: 0,
      olusturma: new Date(),
    },
    update: {
      kodOzeti,
      sonKullanma,
      denemeSayisi: 0,
      olusturma: new Date(),
    },
  });
}

/**
 * Kullanıcının girdiği OTP kodunu doğrular.
 */
export async function verifyOTP(rawEmail: string, rawCode: string): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  const code = normalizeCode(rawCode);

  if (!email || code.length !== 6) {
    return false;
  }

  const kayit = await prisma.otpKodu.findUnique({ where: { email } });
  if (!kayit) {
    return false;
  }

  // Timezone toleranslı süre kontrolü (15 dakika)
  const simdi = Date.now();
  const olusturmaMs = kayit.olusturma ? new Date(kayit.olusturma).getTime() : 0;
  const gecenDakika = olusturmaMs > 0 ? (simdi - olusturmaMs) / (1000 * 60) : 0;

  if (kayit.sonKullanma < new Date() && gecenDakika > GECERLILIK_DK) {
    await prisma.otpKodu.delete({ where: { email } }).catch(() => {});
    return false;
  }

  // Brute-force deneme sınırı kontrolü
  if (kayit.denemeSayisi >= AZAMI_DENEME) {
    await prisma.otpKodu.delete({ where: { email } }).catch(() => {});
    return false;
  }

  // Deneme sayacını hemen artır (olası çökmelerde bile sayaç işlesin)
  await prisma.otpKodu.update({
    where: { email },
    data: { denemeSayisi: { increment: 1 } },
  }).catch(() => {});

  // Sabit sürede güvenli karşılaştırma (Timing Attack Koruması)
  const gelen = Buffer.from(ozetle(code));
  const beklenen = Buffer.from(kayit.kodOzeti);
  const dogru = gelen.length === beklenen.length && timingSafeEqual(gelen, beklenen);

  if (dogru) {
    // Başarılı doğrulamada tek kullanımlık kod anında imha edilir
    await prisma.otpKodu.delete({ where: { email } }).catch(() => {});
    return true;
  }

  return false;
}

export async function deleteOTP(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  await prisma.otpKodu.delete({ where: { email } }).catch(() => {});
}

export async function getRemainingAttempts(rawEmail: string): Promise<number> {
  const email = normalizeEmail(rawEmail);
  const kayit = await prisma.otpKodu.findUnique({
    where: { email },
    select: { denemeSayisi: true },
  });
  if (!kayit) return AZAMI_DENEME;
  return Math.max(0, AZAMI_DENEME - kayit.denemeSayisi);
}

/** Süresi dolmuş atıl kodları temizleme */
export async function kodlariTemizle(olasilik = 0.1): Promise<void> {
  if (Math.random() > olasilik) return;
  const onBesDkOnce = new Date(Date.now() - 15 * 60 * 1000);
  await prisma.otpKodu.deleteMany({
    where: {
      OR: [
        { sonKullanma: { lt: new Date() } },
        { olusturma: { lt: onBesDkOnce } },
      ],
    },
  }).catch(() => {});
}
