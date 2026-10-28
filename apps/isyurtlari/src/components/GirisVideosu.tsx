'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Giris fotografinin ustune, sayfa tamamen yuklendikten sonra sinematik video biner.
 * Fotograf LCP olarak kalir; video oynamaya baslayinca yumusakca belirir.
 */
export default function GirisVideosu() {
  const [kaynak, setKaynak] = useState<string | null>(null);
  const [oynuyor, setOynuyor] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const baglanti = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (baglanti?.saveData) return;
    const sec = () => setKaynak(window.matchMedia('(min-width: 1024px)').matches ? '/hero/giris-genis.mp4' : '/hero/giris-mobil.mp4');
    const bekle = () => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(sec, { timeout: 2500 }) : setTimeout(sec, 1200));
    if (document.readyState === 'complete') bekle();
    else window.addEventListener('load', bekle, { once: true });
    return () => window.removeEventListener('load', bekle);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !kaynak) return;
    v.muted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.play().catch(() => {});
  }, [kaynak]);

  if (!kaynak) return null;
  return (
    <video
      ref={videoRef}
      src={kaynak}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      onPlaying={() => setOynuyor(true)}
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${oynuyor ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
