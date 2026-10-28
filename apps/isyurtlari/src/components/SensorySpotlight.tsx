'use client';

import React, { useState, useRef, useEffect } from 'react';
import { m, useMotionValue, useSpring, useReducedMotion, useTransform } from 'framer-motion';

export interface SensorySpotlightProps {
  /** Dış ambalaj ürün görseli yolu */
  packageImage: string;
  /** Ambalajın altında yatan iç doku / hasat hikayesi görseli yolu */
  storyImage: string;
  /** Dış ambalaj görseli erişilebilirlik metni */
  packageAlt?: string;
  /** İç doku / hasat görseli erişilebilirlik metni */
  storyAlt?: string;
  /** Dairesel maske spot ışığı yarıçapı (piksel, varsayılan: 160) */
  spotlightRadius?: number;
  /** Hikaye rozet başlığı */
  storyBadge?: string;
  /** Ek Tailwind sınıfları */
  className?: string;
  /** Test kimliği */
  'data-testid'?: string;
}

/**
 * SensorySpotlight
 *
 * Gıda ve zanaat ürünleri için interaktif duyusal maskeleme bileşeni:
 * - Fare dış ambalaj üzerinde gezdirildiğinde, alt katmanda yer alan
 *   otantik iç dokuyu ve doğal hasat anını dairesel bir radial-gradient maske
 *   (spotlight) ile ortaya çıkarır.
 * - Framer Motion `useMotionValue`, `useSpring` ve `useTransform` ile
 *   GPU hızlandırmalı 60-120fps pürüzsüz yay fiziği sunar.
 * - Erişilebilirlik ve Mobil Uyumluluk: `useReducedMotion` veya `pointer: coarse`
 *   (dokunmatik ekran) algılandığında maskeleme iptal edilir; kullanıcıya
 *   her iki görseli yan yana sunan şık bir statik düzen sağlanır.
 */
export default function SensorySpotlight({
  packageImage,
  storyImage,
  packageAlt = 'Ürün Dış Ambalajı',
  storyAlt = 'Doğal Hasat ve İç Doku',
  spotlightRadius = 160,
  storyBadge = 'Organik Hasat & Saf Doku',
  className = '',
  'data-testid': testId = 'sensory-spotlight',
}: SensorySpotlightProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [lastCoords, setLastCoords] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dokunmatik cihaz kontrolü
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia('(pointer: coarse)');
    setIsTouchDevice(media.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    media.addEventListener?.('change', handleChange);
    return () => {
      media.removeEventListener?.('change', handleChange);
    };
  }, []);

  const isCoarse = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? Boolean(window.matchMedia('(pointer: coarse)').matches)
    : false;

  const isFallback = Boolean(shouldReduceMotion) || isTouchDevice || isCoarse;

  // Koordinat ve yarıçap için MotionValue'lar (Re-render TETİKLEMEZ)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const maskRadius = useMotionValue(0);

  // Yay fiziği ile yumuşatılmış değerler
  const smoothX = useSpring(mouseX, { damping: 28, stiffness: 380, mass: 0.5 });
  const smoothY = useSpring(mouseY, { damping: 28, stiffness: 380, mass: 0.5 });
  const smoothRadius = useSpring(maskRadius, { damping: 24, stiffness: 320, mass: 0.5 });

  // CSS mask-image stilini dinamik dönüştür
  const maskImageStyle = useTransform(
    [smoothX, smoothY, smoothRadius],
    ([x, y, r]) =>
      `radial-gradient(circle ${r}px at ${x}px ${y}px, black 96%, transparent 100%)`
  );

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFallback) return;
    setIsHovered(true);
    maskRadius.set(spotlightRadius);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relX = Math.round(e.clientX - rect.left);
      const relY = Math.round(e.clientY - rect.top);
      mouseX.set(relX);
      mouseY.set(relY);
      setLastCoords({ x: relX, y: relY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFallback) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relX = Math.round(e.clientX - rect.left);
      const relY = Math.round(e.clientY - rect.top);
      mouseX.set(relX);
      mouseY.set(relY);
      setLastCoords({ x: relX, y: relY });
    }
  };

  const handleMouseLeave = () => {
    if (isFallback) return;
    setIsHovered(false);
    maskRadius.set(0);
  };

  // ─── ERİŞİLEBİLİR MOBİL / STATİK FALLBACK GÖRÜNÜMÜ ───
  if (isFallback) {
    return (
      <div
        data-testid="sensory-fallback-view"
        data-fallback-mode="static"
        className={`w-full flex flex-col gap-4 rounded-3xl p-4 bg-gray-50 border border-gray-200/80 ${className}`}
      >
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F2040]">
            {storyBadge}
          </span>
          <span className="text-[11px] font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
            Detaylı Görünüm
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Ambalaj Kartı */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 flex flex-col">
            <div className="absolute inset-0">
              <img
                src={packageImage}
                alt={packageAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute bottom-3 left-3 z-10 text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-sm">
              Dış Ambalaj
            </span>
          </div>

          {/* Hasat / İç Doku Kartı */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 flex flex-col">
            <div className="absolute inset-0">
              <img
                src={storyImage}
                alt={storyAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute bottom-3 left-3 z-10 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FF6000]/90 text-white backdrop-blur-sm">
              Doğal Hasat & Doku
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── İNTERAKTİF SENSORY SPOTLIGHT MASKELİ GÖRÜNÜM ───
  return (
    <div
      ref={containerRef}
      data-testid={testId}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative aspect-square w-full rounded-3xl overflow-hidden bg-gray-900 select-none cursor-crosshair shadow-lg will-change-transform ${className}`}
    >
      {/* 1. Katman: Taban Ambalaj Görseli */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={packageImage}
          alt={packageAlt}
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>

      {/* 2. Katman: Dinamik Radial-Gradient Maske ile Ortaya Çıkan Hasat & İç Doku Görseli */}
      <m.div
        data-testid="sensory-mask-layer"
        data-spotlight-active={isHovered ? 'true' : 'false'}
        data-mask-x={lastCoords.x.toString()}
        data-mask-y={lastCoords.y.toString()}
        style={{
          WebkitMaskImage: maskImageStyle,
          maskImage: maskImageStyle,
        }}
        className="absolute inset-0 w-full h-full pointer-events-none z-10 will-change-transform"
      >
        <img
          src={storyImage}
          alt={storyAlt}
          className="w-full h-full object-cover pointer-events-none"
        />
      </m.div>

      {/* Awwwards Stilinde İpuçları ve Rozetler */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0F2040]/80 text-white backdrop-blur-md shadow-sm border border-white/10">
          {storyBadge}
        </span>
      </div>

      {/* Keşfet İpucu Rozeti */}
      <div
        className={`absolute bottom-4 right-4 z-20 pointer-events-none px-3 py-1.5 rounded-full text-xs font-medium text-white/90 bg-black/50 backdrop-blur-md border border-white/10 transition-opacity duration-300 ${
          isHovered ? 'opacity-20' : 'opacity-100'
        }`}
      >
        ✨ İmleci gezdirerek iç dokuyu keşfet
      </div>
    </div>
  );
}
