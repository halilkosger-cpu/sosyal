import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Ticari e-postalardan çıkma (ret) bağlantısı.
 *
 * ─── NEDEN JETON TABLOSU DEĞİL, İMZA ─────────────────────────────────
 *
 * E-posta doğrulama ve şifre sıfırlama jetonları veritabanında saklanıyor
 * (CustomerToken) ve tek kullanımlık. Ret bağlantısı için bu yanlış olurdu:
 *
 *  - Bağlantı KALICI olmalı. Müşteri altı ay önceki e-postayı açıp
 *    "listeden çık"a bastığında çalışmalı; süresi dolmuş bir ret bağlantısı
 *    hem kötü bir deneyim hem hukuken savunulamaz.
 *  - Jetonlar özet olarak saklandığı için ikinci e-postada aynı bağlantı
 *    yeniden üretilemez; yeni jeton üretmek eskisini geçersiz kılardı ve
 *    müşterinin elindeki eski e-postanın bağlantısı ölürdü.
 *
 * Bu yüzden bağlantı imzalı: müşteri kimliği + JWT_SECRET ile üretilmiş
 * HMAC. Saklanacak bir şey yok, her zaman geçerli, tekrar üretilebilir.
 * Kimliği tahmin eden biri imzayı üretemez.
 *
 * İmza yalnızca "bu bağlantı bizden çıktı" der; oturum yerine geçmez.
 * Yaptığı tek şey pazarlama iznini kapatmak - hesapta başka hiçbir
 * değişiklik yapılamaz.
 */

const AMAC = 'ileti-ret';

function gizli(): string {
  return process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
}

function imzala(customerId: string): string {
  return createHmac('sha256', gizli()).update(`${AMAC}:${customerId}`).digest('base64url');
}

export function iletiRetBaglantisi(taban: string, customerId: string): string {
  const p = new URLSearchParams({ m: customerId, s: imzala(customerId) });
  return `${taban}/ileti-tercihi?${p.toString()}`;
}

/** İmza doğruysa müşteri kimliğini döndürür, yanlışsa null. */
export function iletiRetDogrula(customerId: string, imza: string): string | null {
  if (!customerId || !imza) return null;

  const beklenen = Buffer.from(imzala(customerId));
  const gelen = Buffer.from(String(imza));

  // Uzunluklar farklıysa timingSafeEqual hata fırlatır; önce eşitliğe bak.
  if (beklenen.length !== gelen.length) return null;
  return timingSafeEqual(beklenen, gelen) ? customerId : null;
}
