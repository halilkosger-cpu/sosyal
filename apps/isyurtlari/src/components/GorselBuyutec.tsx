'use client';

import { useEffect, useRef, useState } from 'react';
import { LuX, LuZoomIn, LuZoomOut } from 'react-icons/lu';

const YAKINLIK = 2.4;

/** Tam ekran urun gorseli: dokununca dokunulan noktaya yakinlasir, yakinken parmakla gezilir. */
export default function GorselBuyutec({ src, alt, onKapat }: { src: string; alt: string; onKapat: () => void }) {
  const kapRef = useRef<HTMLDivElement>(null);
  const kapatRef = useRef<HTMLButtonElement>(null);
  const [yakin, setYakin] = useState(false);
  const hedef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onceki = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const odak = document.activeElement as HTMLElement | null;
    kapatRef.current?.focus();
    const tus = (e: KeyboardEvent) => e.key === 'Escape' && onKapat();
    window.addEventListener('keydown', tus);
    return () => {
      document.body.style.overflow = onceki;
      window.removeEventListener('keydown', tus);
      odak?.focus?.();
    };
  }, [onKapat]);

  // Yakinlasinca dokunulan nokta ekranin ortasina gelsin.
  useEffect(() => {
    const kap = kapRef.current;
    if (!kap || !yakin || !hedef.current) return;
    kap.scrollLeft = hedef.current.x * kap.scrollWidth - kap.clientWidth / 2;
    kap.scrollTop = hedef.current.y * kap.scrollHeight - kap.clientHeight / 2;
  }, [yakin]);

  const degistir = (e: React.MouseEvent<HTMLImageElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    hedef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    setYakin((v) => !v);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[70] bg-[#141B2D]/95 backdrop-blur-sm animate-[filtreKarartma_.2s_ease-out]">
      <div ref={kapRef} className={`h-full w-full ${yakin ? 'overflow-auto' : 'overflow-hidden flex items-center justify-center p-4'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onClick={degistir}
          draggable={false}
          className={`select-none ${yakin ? 'max-w-none cursor-zoom-out' : 'max-h-full max-w-full object-contain cursor-zoom-in'}`}
          style={yakin ? { width: `${YAKINLIK * 100}vmin`, height: 'auto' } : undefined}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/85">
          {yakin ? <LuZoomOut size={14} /> : <LuZoomIn size={14} />}
          {yakin ? 'Uzaklaşmak için dokunun' : 'Yakınlaşmak için dokunun'}
        </span>
        <button
          ref={kapatRef}
          onClick={onKapat}
          aria-label="Kapat"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
        >
          <LuX size={22} />
        </button>
      </div>
    </div>
  );
}
