'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const VID_KEY = '_isyurtlari_vid';
const SID_KEY = '_isyurtlari_sid';
const SID_EXP_KEY = '_isyurtlari_sid_exp';
const OTURUM_SURESI_MS = 30 * 60 * 1000; // 30 Dakika

function idUret(onEk: string) {
  return `${onEk}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function ziyaretciKimligiAl(): string {
  if (typeof window === 'undefined') return '';
  try {
    let vid = localStorage.getItem(VID_KEY);
    if (!vid) {
      vid = idUret('v');
      localStorage.setItem(VID_KEY, vid);
    }
    return vid;
  } catch {
    return idUret('v');
  }
}

function oturumKimligiAl(): string {
  if (typeof window === 'undefined') return '';
  try {
    const simdi = Date.now();
    const exp = parseInt(localStorage.getItem(SID_EXP_KEY) || '0', 10);
    let sid = localStorage.getItem(SID_KEY);

    if (!sid || simdi > exp) {
      sid = idUret('s');
      localStorage.setItem(SID_KEY, sid);
    }
    localStorage.setItem(SID_EXP_KEY, String(simdi + OTURUM_SURESI_MS));
    return sid;
  } catch {
    return idUret('s');
  }
}

/** JS calistiran botlar ve otomasyon tarayicilari fonksiyon cagrisi harcamasin. */
function botBenzeriMi(): boolean {
  if (typeof navigator === 'undefined') return true;
  if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return true;
  return /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|bingpreview/i.test(
    navigator.userAgent || ''
  );
}

/**
 * Sayfa basina TEK istek: onceki sayfada gecen sure, bir sonraki pageview
 * istegine eklenir (ayri "duration" beacon'i yok). Oturumun son sayfasinin
 * suresi gonderilmez; bu, fonksiyon cagrisi kotasi icin bilincli bir tercih.
 */
export default function DahiliAnalitikTracker() {
  const pathname = usePathname();
  const baslangicZamani = useRef<number>(Date.now());
  const sonSayfa = useRef<string>('');

  useEffect(() => {
    // Admin ve dahili API sayfalarını kesinlikle kaydetme
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }
    if (botBenzeriMi()) return;

    const searchStr = typeof window !== 'undefined' ? window.location.search : '';
    const tamYol = searchStr ? `${pathname}${searchStr}` : pathname;

    if (tamYol === sonSayfa.current) return;

    const oncekiSayfa = sonSayfa.current;
    const oncekiSure = oncekiSayfa
      ? Math.round((Date.now() - baslangicZamani.current) / 1000)
      : 0;

    sonSayfa.current = tamYol;
    baslangicZamani.current = Date.now();

    const vid = ziyaretciKimligiAl();
    const sid = oturumKimligiAl();

    const payload = {
      olay: 'pageview',
      ziyaretciId: vid,
      oturumId: sid,
      sayfa: tamYol,
      baslik: typeof document !== 'undefined' ? document.title : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      ekran: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
      dil: typeof navigator !== 'undefined' ? navigator.language : 'tr-TR',
      ...(oncekiSayfa && oncekiSure > 1
        ? { oncekiSayfa, oncekiSureSaniye: oncekiSure }
        : {}),
    };

    try {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [pathname]);

  return null;
}
