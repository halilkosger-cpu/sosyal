'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

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
    // Süreyi 30 dk uzat
    localStorage.setItem(SID_EXP_KEY, String(simdi + OTURUM_SURESI_MS));
    return sid;
  } catch {
    return idUret('s');
  }
}

export default function DahiliAnalitikTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const baslangicZamani = useRef<number>(Date.now());
  const sonSayfa = useRef<string>('');

  useEffect(() => {
    // Admin sayfalarını takip etme
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    const tamYol = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (tamYol === sonSayfa.current) return;

    // Önceki sayfada kalınan süreyi gönder
    if (sonSayfa.current) {
      const gecenSure = Math.round((Date.now() - baslangicZamani.current) / 1000);
      if (gecenSure > 1) {
        sureyiIlet(sonSayfa.current, gecenSure);
      }
    }

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
    };

    // Hafif ve engellemesiz veri iletimi (Beacon veya keepalive fetch)
    const jsonStr = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([jsonStr], { type: 'application/json' }));
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname, searchParams]);

  // Sayfadan çıkarken veya sekme arka plana geçerken kalma süresini ilet
  useEffect(() => {
    const handleCikis = () => {
      if (!sonSayfa.current || sonSayfa.current.startsWith('/admin')) return;
      const gecenSure = Math.round((Date.now() - baslangicZamani.current) / 1000);
      if (gecenSure > 1) {
        sureyiIlet(sonSayfa.current, gecenSure);
      }
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleCikis();
    });
    window.addEventListener('pagehide', handleCikis);

    return () => {
      window.removeEventListener('pagehide', handleCikis);
    };
  }, []);

  return null;
}

function sureyiIlet(sayfa: string, sureSaniye: number) {
  try {
    const vid = ziyaretciKimligiAl();
    const sid = oturumKimligiAl();
    const payload = JSON.stringify({
      olay: 'duration',
      ziyaretciId: vid,
      oturumId: sid,
      sayfa,
      sureSaniye,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}
