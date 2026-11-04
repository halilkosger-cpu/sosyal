import { createHmac, timingSafeEqual } from 'crypto';
import { jwtAnahtari } from './admin-auth';

/**
 * Misafir yorum bağlantısı: bir sipariş kalemi için, hesapsız yorum yazmaya
 * izin veren imzalı ve süreli jeton.
 *
 * Jeton veritabanında saklanmaz (durumsuz): sipariş kalemi kimliği ve bitiş
 * zamanı sunucu anahtarıyla HMAC'lenir. "Tek kullanım" jetonun kendisinde
 * değil, o kalemin yorumunun var olup olmadığında zorlanır (kalem başına en
 * fazla bir yorum); bağlantı bir kez kullanılınca aynı kalem için ikinci
 * yorum yazılamaz.
 *
 * Bağlantı yalnızca sahipliği kanıtlanmış (sipariş numarası + e-posta) ve
 * teslim edilmiş siparişin kalemi için üretilir; bkz. /api/yorum-baglantisi.
 */

export const YORUM_BAGLANTISI_GECERLILIK_GUN = 60;
const GUN_MS = 24 * 60 * 60 * 1000;

const anahtar = () => createHmac('sha256', 'yorum-baglantisi:' + jwtAnahtari()).digest();

const imzala = (yuk: string) => createHmac('sha256', anahtar()).update(yuk).digest('base64url');

export function yorumBaglantisiOlustur(orderItemId: string, simdi = Date.now()): string {
  const yuk = Buffer.from(
    JSON.stringify({ k: orderItemId, e: simdi + YORUM_BAGLANTISI_GECERLILIK_GUN * GUN_MS })
  ).toString('base64url');
  return `${yuk}.${imzala(yuk)}`;
}

/** Geçerli ve süresi dolmamışsa sipariş kalemini döndürür; aksi hâlde null. */
export function yorumBaglantisiniCoz(jeton: unknown, simdi = Date.now()): { orderItemId: string } | null {
  if (typeof jeton !== 'string') return null;
  const parcalar = jeton.split('.');
  if (parcalar.length !== 2 || !parcalar[0] || !parcalar[1]) return null;
  const [yuk, imza] = parcalar;

  const beklenen = Buffer.from(imzala(yuk));
  const gelen = Buffer.from(imza);
  if (beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) return null;

  try {
    const veri = JSON.parse(Buffer.from(yuk, 'base64url').toString('utf8')) as { k?: unknown; e?: unknown };
    if (typeof veri.k !== 'string' || !veri.k || typeof veri.e !== 'number') return null;
    if (veri.e < simdi) return null;
    return { orderItemId: veri.k };
  } catch {
    return null;
  }
}
