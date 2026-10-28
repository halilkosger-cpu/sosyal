// Ilk ziyarette ust uste katman acilmasin: cerez -> kampanya (2. sayfa) -> uygulama banneri (3. ziyaret).
const ZIYARET = 'isy_ziyaret_sayisi';
const OTURUM = 'isy_oturum_sayildi';
const SAYFA = 'isy_oturum_sayfa';

function guvenli<T>(fn: () => T, yedek: T): T {
  try {
    return fn();
  } catch {
    return yedek;
  }
}

export function cerezKarariVerildi(): boolean {
  return guvenli(() => !!localStorage.getItem('cookieConsent'), true);
}

export function ziyaretSayisi(): number {
  return guvenli(() => {
    let sayi = parseInt(localStorage.getItem(ZIYARET) || '0', 10) || 0;
    if (!sessionStorage.getItem(OTURUM)) {
      sayi += 1;
      localStorage.setItem(ZIYARET, String(sayi));
      sessionStorage.setItem(OTURUM, '1');
    }
    return sayi;
  }, 1);
}

export function sayfaGoruntulendi(): number {
  return guvenli(() => {
    const sayi = (parseInt(sessionStorage.getItem(SAYFA) || '0', 10) || 0) + 1;
    sessionStorage.setItem(SAYFA, String(sayi));
    return sayi;
  }, 1);
}

export const kampanyaGosterilebilir = (oturumSayfasi: number) =>
  cerezKarariVerildi() && oturumSayfasi >= 2;

export const uygulamaBanneriGosterilebilir = () =>
  cerezKarariVerildi() && ziyaretSayisi() >= 3;
