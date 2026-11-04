'use client';

import { useEffect } from 'react';
import { hediyeKodunuNormallestir } from '@/lib/hediye';

/** Ödeme sayfası bu anahtardan okur. */
export const HEDIYE_KODU_ANAHTARI = 'hediye_kodu';

/**
 * Arkadaşın paylaştığı bağlantıdaki `?hediye=HD-XXXXX` kodunu yakalar ve
 * tarayıcıda saklar. Müşteri sitede dolaşıp daha sonra ödemeye geldiğinde kod
 * ödeme sayfasında hazır bulunur. Görünür bir şey çizmez.
 */
export default function HediyeKoduYakala() {
  useEffect(() => {
    try {
      const kod = hediyeKodunuNormallestir(new URLSearchParams(window.location.search).get('hediye'));
      if (kod) localStorage.setItem(HEDIYE_KODU_ANAHTARI, kod);
    } catch {
      // Depolama kapalıysa (gizli pencere vb.) kod ödeme sayfasında elle girilir.
    }
  }, []);

  return null;
}
