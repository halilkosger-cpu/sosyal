'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Ana sayfa hero bölümünün arka plan videosu.
 *
 * Trafiğin ~%92'si mobil olduğu ve site Google'da üst sırada olduğu için
 * performans burada birinci öncelik. Bu yüzden:
 *
 * - Sunucudan gelen HTML'de <video> hiç yok; yalnızca poster görseli var.
 *   Böylece LCP posterle ölçülür, video ilk yükleme yolunu hiç etkilemez.
 * - Video ancak sayfa tamamen yüklendikten ve tarayıcı boşa çıktıktan sonra
 *   devreye girer.
 * - Mobilde 333 KB'lık küçük sürüm, masaüstünde 741 KB'lık sürüm yüklenir.
 * - Kullanıcı "hareketi azalt" ayarını açtıysa veya veri tasarrufu modundaysa
 *   video hiç yüklenmez, poster kalır.
 */
export default function HeroBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    // Hareket hassasiyeti olan kullanıcılara video yok
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Veri tasarrufu / çok yavaş bağlantıda video yok
    const conn = (navigator as any).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /^(slow-)?2g$/.test(conn.effectiveType)) return;

    // Mobilde video hic yuklenmiyor, yalnizca poster gorunuyor.
    // Trafigin ~%92'si mobil; video orada 326 KB veri demekti. Ayrica surekli
    // oynadigi icin Lighthouse'un Speed Index olcumunu bozuyordu - ekran
    // hicbir zaman "tamamlanmis" sayilmiyor, olculen deger 15,1 sn cikmisti.
    if (window.matchMedia('(max-width: 767px)').matches) return;

    const dosya = '/video/hero-desktop.mp4';

    let iptal = false;
    const yukle = () => {
      if (!iptal) setSrc(dosya);
    };

    // Sayfa yüklenmesi bitene kadar bekle, sonra boşta bir an bul
    const planla = () => {
      const ric = (window as any).requestIdleCallback;
      if (typeof ric === 'function') ric(yukle, { timeout: 3000 });
      else setTimeout(yukle, 1200);
    };

    if (document.readyState === 'complete') planla();
    else window.addEventListener('load', planla, { once: true });

    return () => {
      iptal = true;
      window.removeEventListener('load', planla);
    };
  }, []);

  // Kaynak atandıktan sonra oynat. play() video hazır olmadan çağrılırsa
  // reddedilebiliyor, bu yüzden hem hemen hem de 'canplay' anında deneniyor.
  useEffect(() => {
    if (!src) return;
    const v = videoRef.current;
    if (!v) return;

    const oynat = () => {
      v.play().catch(() => {
        /* otomatik oynatma engellendi - poster görünmeye devam eder */
      });
    };

    v.addEventListener('canplay', oynat);
    v.load();
    oynat();

    return () => v.removeEventListener('canplay', oynat);
  }, [src]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <video
        ref={videoRef}
        {...(src ? { src } : {})}
        poster="/video/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        tabIndex={-1}
        className="w-full h-full object-cover opacity-100"
      />
      {/* Başlığın okunabilirliği için karartma solda yoğun, sağda hafif.
          Hero metni solda olduğu için video asıl sağ tarafta görünür. */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F2040] via-[#0F2040]/55 to-transparent" />
    </div>
  );
}
