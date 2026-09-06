'use client';

import { useEffect, useState } from 'react';

/**
 * Istemci tarafinda oturum durumu.
 *
 * Oturum cerezi httpOnly: JavaScript okuyamiyor, okumamali da. Bu yuzden
 * "giris yapilmis mi" sorusu /api/musteri/ben'e soruluyor.
 *
 * Sonuc modul duzeyinde onbellege aliniyor: baslik cubugu, hesap sayfasi ve
 * sepet ayni anda soruyor; her biri ayri istek atsaydi her sayfa acilisinda
 * ucu bir kac kez cagirmis olurduk. Giris/cikis sonrasi musteriDegisti()
 * cagrilarak onbellek tazeleniyor.
 */

export interface Musteri {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  emailVerified: string | null;
}

export const MUSTERI_OLAYI = 'musteriDegisti';

let onbellek: Musteri | null | undefined;
let bekleyen: Promise<Musteri | null> | null = null;

async function getir(): Promise<Musteri | null> {
  try {
    const yanit = await fetch('/api/musteri/ben', { cache: 'no-store' });
    if (!yanit.ok) return null;
    const veri = await yanit.json();
    return veri?.musteri ?? null;
  } catch {
    // Ag hatasi giris yapmamis sayilmayi gerektirmez ama gosterecek bir sey
    // de yok; sayfa misafir gorunumunde acilir.
    return null;
  }
}

export function musteriGetir(): Promise<Musteri | null> {
  if (onbellek !== undefined) return Promise.resolve(onbellek);
  if (!bekleyen) {
    bekleyen = getir().then((m) => {
      onbellek = m;
      bekleyen = null;
      return m;
    });
  }
  return bekleyen;
}

/** Giris, cikis ve profil guncellemesinden sonra cagrilir. */
export function musteriDegisti(): void {
  onbellek = undefined;
  bekleyen = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(MUSTERI_OLAYI));
  }
}

export async function cikisYap(): Promise<void> {
  try {
    await fetch('/api/musteri/cikis', { method: 'POST' });
  } finally {
    /**
     * Cikista cihazdaki sepet ve favoriler temizleniyor.
     *
     * Ikisi de sunucuda duruyor, yani musteri tekrar giris yapinca geri
     * geliyor. Birakilsaydi, ayni bilgisayari kullanan bir sonraki kisi
     * onceki musterinin sepetini ve favorilerini gorurdu - paylasilan
     * bilgisayarlarda alisveris gecmisi sizdiran bir davranis.
     */
    try {
      localStorage.removeItem('cart');
      localStorage.removeItem('favoriler');
      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('favorilerDegisti'));
    } catch {
      // localStorage kapaliysa temizlenecek bir sey de yok.
    }
    musteriDegisti();
  }
}

/**
 * Oturumdaki musteri. `yukleniyor` true iken hicbir sey gosterilmemeli:
 * misafir gorunumunu gosterip sonra giris yapilmis haline gecmek, sayfanin
 * gozle gorulur bicimde zıplamasina yol aciyor.
 */
export function useMusteri(): { musteri: Musteri | null; yukleniyor: boolean } {
  const [musteri, setMusteri] = useState<Musteri | null>(onbellek ?? null);
  const [yukleniyor, setYukleniyor] = useState(onbellek === undefined);

  useEffect(() => {
    let iptal = false;

    const yukle = () => {
      setYukleniyor(onbellek === undefined);
      musteriGetir().then((m) => {
        if (iptal) return;
        setMusteri(m);
        setYukleniyor(false);
      });
    };

    yukle();
    window.addEventListener(MUSTERI_OLAYI, yukle);
    return () => {
      iptal = true;
      window.removeEventListener(MUSTERI_OLAYI, yukle);
    };
  }, []);

  return { musteri, yukleniyor };
}
