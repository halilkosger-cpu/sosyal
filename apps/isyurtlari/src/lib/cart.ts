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
}

export interface SepeteEklenebilirUrun {
  id: string;
  name: string;
  price: number;
  slug: string;
  imageUrl?: string | null;
  quantity: number; // stok adedi
  campaign?: unknown;
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
    const sepet: SepetUrunu[] = JSON.parse(localStorage.getItem('cart') || '[]');
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
      });
    }

    localStorage.setItem('cart', JSON.stringify(sepet));
    window.dispatchEvent(new Event('cartUpdated'));

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
