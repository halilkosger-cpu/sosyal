/**
 * Sepet islemleri. Sepet localStorage'da 'cart' anahtarinda tutuluyor;
 * degisiklikten sonra 'cartUpdated' olayi tetiklenmeli ki ustteki
 * CartBadge sayiyi guncellesin.
 */
import { sepeteEklendi } from './analiz';

export interface SepetUrunu {
  id: string;
  name: string;
  price: number;
  quantity: number;
  slug: string;
  imageUrl?: string | null;
  campaign?: unknown;
  /**
   * Urunun kategorisinden gelen KDV orani (yuzde).
   *
   * Fiyatlar KDV dahil oldugu icin bu deger toplami degistirmiyor; sepette
   * gosterilen "icindeki KDV" satirini dogru hesaplamaya yariyor. Alan
   * eklenmeden once olusmus sepetlerde bulunmuyor, o yuzden isteğe bagli:
   * yoksa lib/fiyat.ts varsayilan orani kullaniyor.
   */
  kdvOrani?: number | null;
}

export interface SepeteEklenebilirUrun {
  id: string;
  name: string;
  price: number;
  slug: string;
  imageUrl?: string | null;
  quantity: number; // stok adedi
  campaign?: unknown;
  kdvOrani?: number | null;
}

const ANAHTAR = 'cart';

/**
 * Sepet degistiginde tetiklenen olay.
 *
 * Ustteki CartBadge sayiyi bu olayla guncelliyor; SenkronKopru da bunu
 * dinleyip degisikligi sunucuya gonderiyor. Ad bilerek degistirilmedi:
 * sepet sayfasi ve odeme sayfasi da ayni olayi tetikliyor.
 */
export const SEPET_OLAYI = 'cartUpdated';

/** Tarayicidaki sepeti okur. Bozuk veri varsa bos sepet doner. */
export function sepetiOku(): SepetUrunu[] {
  if (typeof window === 'undefined') return [];
  try {
    const ham = JSON.parse(localStorage.getItem(ANAHTAR) || '[]');
    return Array.isArray(ham) ? ham : [];
  } catch {
    return [];
  }
}

/** Sepeti tumuyle degistirir ve degisiklik olayini tetikler. */
export function sepetiYaz(sepet: SepetUrunu[]): boolean {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(sepet));
    window.dispatchEvent(new Event(SEPET_OLAYI));
    return true;
  } catch {
    // localStorage kapali veya dolu olabilir
    return false;
  }
}

/** Urun sepete eklenebilir mi: stokta olmali ve fiyati girilmis olmali. */
export function sepeteEklenebilir(urun: { price: number; quantity: number }): boolean {
  return urun.quantity > 0 && urun.price > 0;
}

/**
 * Urunu sepete ekler. Zaten varsa adedini artirir.
 * Basarili olursa true doner.
 */
export function sepeteEkle(urun: SepeteEklenebilirUrun, adet = 1): boolean {
  if (!sepeteEklenebilir(urun)) return false;

  try {
    const sepet = sepetiOku();
    const mevcut = sepet.find((s) => s.id === urun.id);

    if (mevcut) {
      mevcut.quantity += adet;
    } else {
      sepet.push({
        id: urun.id,
        name: urun.name,
        price: urun.price,
        quantity: adet,
        slug: urun.slug,
        imageUrl: urun.imageUrl ?? null,
        campaign: urun.campaign ?? null,
        kdvOrani: urun.kdvOrani ?? null,
      });
    }

    if (!sepetiYaz(sepet)) return false;

    // Sepete ekleme sitede birkac yerden yapiliyor (urun sayfasi, kategori
    // kartlari, arama onerileri) ama hepsi bu fonksiyondan geciyor; GA olayini
    // burada gondermek her yeri tek seferde kapsiyor.
    sepeteEklendi({
      item_id: urun.id,
      item_name: urun.name,
      price: urun.price,
      quantity: adet,
    });

    return true;
  } catch {
    // localStorage kapali veya dolu olabilir
    return false;
  }
}
