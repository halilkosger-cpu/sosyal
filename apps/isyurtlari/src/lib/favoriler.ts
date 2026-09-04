/**
 * Favoriler.
 *
 * Onceden veritabanina yaziliyordu ve HIC CALISMIYORDU: istek `userId` olarak
 * istemcide uretilen sahte bir deger gonderiyordu ("guest-user-<zaman>"), ama
 * Favorite.userId gercek User tablosuna yabanci anahtarla bagli ve o tablo
 * bos. Her kalp tiklamasi 500 donuyordu; canlida dogrulandi.
 *
 * Sitede musteri hesabi yok. Bu yuzden favoriler, sepetle ayni mantikla
 * tarayicida tutuluyor: hesap gerektirmiyor, sunucuya yuk bindirmiyor ve
 * kimlik dogrulamasi sorunu dogurmuyor.
 *
 * Degisiklikten sonra 'favorilerDegisti' olayi tetikleniyor; ayni sayfadaki
 * diger kalp butonlari ve favoriler sayfasi kendini guncelleyebilsin.
 */

const ANAHTAR = 'favoriler';
export const FAVORI_OLAYI = 'favorilerDegisti';

function oku(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const ham = JSON.parse(localStorage.getItem(ANAHTAR) || '[]');
    return Array.isArray(ham) ? ham.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function yaz(liste: string[]): void {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(liste));
    window.dispatchEvent(new Event(FAVORI_OLAYI));
  } catch {
    // localStorage kapali veya dolu olabilir; favori kaydedilemez ama sayfa
    // calismaya devam eder.
  }
}

export function favorileriGetir(): string[] {
  return oku();
}

export function favoriMi(urunId: string): boolean {
  return oku().includes(urunId);
}

/** Favoriye ekler ya da cikarir. Yeni durumu dondurur. */
export function favoriDegistir(urunId: string): boolean {
  const liste = oku();
  const yeriVar = liste.indexOf(urunId);

  if (yeriVar > -1) {
    liste.splice(yeriVar, 1);
    yaz(liste);
    return false;
  }

  liste.push(urunId);
  yaz(liste);
  return true;
}

export function favoriyiCikar(urunId: string): void {
  yaz(oku().filter((x) => x !== urunId));
}
