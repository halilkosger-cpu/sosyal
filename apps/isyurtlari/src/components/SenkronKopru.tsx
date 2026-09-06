'use client';

import { useEffect, useRef } from 'react';
import { MUSTERI_OLAYI, musteriGetir } from '@/lib/musteri-istemci';
import { SEPET_OLAYI, sepetiOku, sepetiYaz, type SepetUrunu } from '@/lib/cart';
import { FAVORI_OLAYI, favorileriGetir, favorileriYaz } from '@/lib/favoriler';

/**
 * Sepet ve favorileri sunucuyla eslestiren kopru.
 *
 * Kok duzende, gorunmez olarak duruyor.
 *
 * ─── NEDEN AYNA, NEDEN TAM TASIMA DEGIL ───────────────────────────────
 *
 * Sepetin calisan kopyasi tarayicida kaliyor; sunucu onun aynasi. Sepete
 * ekleme sitede bes ayri yerden yapiliyor (urun sayfasi, kategori karti,
 * arama onerisi, favoriler, ana sayfa) ve hepsi es zamansiz olmayan
 * sepeteEkle() fonksiyonundan geciyor. Sepeti tamamen sunucuya tasimak o
 * zincirin tamamini asenkron hale getirmeyi gerektirirdi; kullanicinin
 * gordugu kazanc ise ayni: giris yapinca sepet cihazlar arasi tasiniyor.
 *
 * Yan fayda: sunucuya ulasilamadiginda sepet calismaya devam ediyor.
 *
 * ─── BIRLESTIRME KURALI ───────────────────────────────────────────────
 *
 * Giriste iki taraf birlestiriliyor. Ayni urun iki tarafta da varsa BUYUK
 * adet aliniyor, toplanmiyor: telefonda 2, bilgisayarda 2 ekleyen musteri
 * sepetinde 4 gormemeli. Hicbir kalem kaybolmuyor.
 */
export default function SenkronKopru() {
  // Birlestirme sirasinda yaptigimiz yazma da olay tetikliyor; bu bayrak
  // kendi yazmamizi sunucuya geri gondermemizi engelliyor.
  const kendiYazmamiz = useRef(false);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let iptal = false;

    /** Yereldeki ve sunucudaki sepeti birlestirip iki tarafi da esitler. */
    const sepetiEslestir = async () => {
      const yanit = await fetch('/api/musteri/sepet', { cache: 'no-store' });
      if (!yanit.ok) return;

      const veri = await yanit.json();
      const sunucu: SepetUrunu[] = Array.isArray(veri?.kalemler) ? veri.kalemler : [];
      const yerel = sepetiOku();

      const birlesik = new Map<string, SepetUrunu>();
      for (const kalem of sunucu) birlesik.set(kalem.id, kalem);
      for (const kalem of yerel) {
        const mevcut = birlesik.get(kalem.id);
        // Sunucudaki kayit urun bilgisi bakimindan daha guncel (fiyat,
        // kampanya oradan hesaplaniyor); yalnizca adet karsilastiriliyor.
        birlesik.set(
          kalem.id,
          mevcut
            ? { ...mevcut, quantity: Math.max(mevcut.quantity, kalem.quantity) }
            : kalem
        );
      }

      const sonuc = [...birlesik.values()];
      if (iptal) return;

      kendiYazmamiz.current = true;
      sepetiYaz(sonuc);

      await fetch('/api/musteri/sepet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kalemler: sonuc.map((k) => ({ productId: k.id, adet: k.quantity })),
        }),
      }).catch(() => {
        // Yazilamazsa yerel sepet dogru; bir sonraki degisiklikte yeniden denenir.
      });
    };

    /** Yereldeki ve sunucudaki favorileri birlestirir. Sira yerel oncelikli. */
    const favorileriEslestir = async () => {
      const yanit = await fetch('/api/musteri/favoriler', { cache: 'no-store' });
      if (!yanit.ok) return;

      const veri = await yanit.json();
      const sunucu: string[] = Array.isArray(veri?.urunler) ? veri.urunler : [];
      const yerel = favorileriGetir();

      const birlesik = [...yerel, ...sunucu.filter((id) => !yerel.includes(id))];
      if (iptal) return;

      kendiYazmamiz.current = true;
      favorileriYaz(birlesik);

      await fetch('/api/musteri/favoriler', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urunler: birlesik }),
      }).catch(() => {});
    };

    const eslestir = async () => {
      const musteri = await musteriGetir();
      if (!musteri || iptal) return;
      await Promise.all([sepetiEslestir(), favorileriEslestir()]).catch(() => {});
    };

    /**
     * Yerel degisiklikleri sunucuya gonderir.
     *
     * Gecikmeli: adet kutusuna ust uste basan musteri her tikta bir istek
     * uretmesin.
     */
    const gonder = (yol: string, govde: () => unknown) => {
      if (kendiYazmamiz.current) {
        kendiYazmamiz.current = false;
        return;
      }
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      zamanlayici.current = setTimeout(async () => {
        const musteri = await musteriGetir();
        if (!musteri) return;
        fetch(yol, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(govde()),
        }).catch(() => {
          // Ag hatasi sepeti bozmuyor; yerel kopya dogru kalmaya devam ediyor.
        });
      }, 800);
    };

    const sepetDegisti = () =>
      gonder('/api/musteri/sepet', () => ({
        kalemler: sepetiOku().map((k) => ({ productId: k.id, adet: k.quantity })),
      }));

    const favoriDegisti = () =>
      gonder('/api/musteri/favoriler', () => ({ urunler: favorileriGetir() }));

    eslestir();
    window.addEventListener(MUSTERI_OLAYI, eslestir);
    window.addEventListener(SEPET_OLAYI, sepetDegisti);
    window.addEventListener(FAVORI_OLAYI, favoriDegisti);

    return () => {
      iptal = true;
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      window.removeEventListener(MUSTERI_OLAYI, eslestir);
      window.removeEventListener(SEPET_OLAYI, sepetDegisti);
      window.removeEventListener(FAVORI_OLAYI, favoriDegisti);
    };
  }, []);

  return null;
}
