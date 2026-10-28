'use client';

import { useEffect, useRef } from 'react';
import { URETIM_BILGISI } from '@/config/content';

interface Bolum {
  kod: string;
  etiket: string;
  baslik: [string, string, string];
  metin: string;
}

// Metinler yalnizca sitede zaten dogrulanmis bilgilerden; gorseller insan icermiyor.
const BOLUMLER: Bolum[] = [
  { kod: 'atolye', etiket: 'Atölye', baslik: ['Her şey bir', 'tezgâhta', 'başlar.'], metin: URETIM_BILGISI },
  { kod: 'emek', etiket: 'Emek', baslik: ['Emek,', 'ilmek', 'ilmek.'], metin: 'Ürünler Adalet Bakanlığı İşyurtları Genel Müdürlüğü atölyelerinde üretiliyor.' },
  { kod: 'meslek', etiket: 'Meslek', baslik: ['Bir', 'meslek,', 'bir ücret.'], metin: 'Atölyelerde çalışan hükümlüler ücret karşılığı çalışıyor ve bir meslek öğreniyor.' },
  { kod: 'evinize', etiket: 'Evinize', baslik: ['Atölyeden', 'evinize', 'özenle.'], metin: 'Siparişiniz özenle paketlenip kapınıza geliyor. Teslimden itibaren 14 gün cayma hakkınız var.' },
];

function HikayeKarti({ bolum, sira, kartRef }: { bolum: Bolum; sira: number; kartRef: (el: HTMLElement | null) => void }) {
  const kapRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const kap = kapRef.current;
    const video = videoRef.current;
    if (!kap || !video) return;
    // iOS Safari otomatik oynatma icin bu ozniteliklerin DOM'da olmasini istiyor; React `muted`'i yazmiyor.
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    const azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const oynuyor = () => kap.setAttribute('data-oynuyor', 'true');
    video.addEventListener('playing', oynuyor);

    const izleyici = new IntersectionObserver(
      ([g]) => {
        if (g.isIntersecting) {
          kap.dataset.gorunur = 'true';
          if (azHareket) return;
          if (video.preload !== 'auto') {
            video.preload = 'auto';
            video.load();
          }
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: '25% 0px', threshold: 0.01 }
    );
    izleyici.observe(kap);
    return () => {
      izleyici.disconnect();
      video.removeEventListener('playing', oynuyor);
    };
  }, []);

  const son = sira === BOLUMLER.length - 1;

  return (
    <section
      ref={(el) => {
        kapRef.current = el;
        kartRef(el);
      }}
      className="hikaye-bolum sticky top-0 h-[100svh] overflow-hidden bg-[#141B2D]"
      aria-labelledby={`hikaye-${bolum.kod}`}
    >
      <div className="hikaye-sahne absolute inset-0 origin-top will-change-transform">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <picture>
          <source media="(min-width: 1024px)" srcSet={`/hikaye/${bolum.kod}-genis.jpg`} />
          <img src={`/hikaye/${bolum.kod}.jpg`} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        </picture>
        <video
          ref={videoRef}
          className="hikaye-video absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
          autoPlay={false}
          preload="none"
          aria-hidden="true"
        >
          <source src={`/hikaye/${bolum.kod}-genis.mp4`} type="video/mp4" media="(min-width: 1024px)" />
          <source src={`/hikaye/${bolum.kod}.mp4`} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,27,45,.15)_0%,rgba(20,27,45,0)_35%,rgba(20,27,45,.55)_70%,rgba(20,27,45,.88)_100%)]" />
        <div className="hikaye-perde pointer-events-none absolute inset-0 bg-[#141B2D] opacity-0" />

        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-screen-xl px-6 pb-16 text-[#FBF6EF] md:px-10 md:pb-24">
          <div className="max-w-xl">
            <div className="hikaye-acil flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-[#FBF6EF]/85">
              <span className="font-serif text-[15px] normal-case tracking-normal">0{sira + 1} / 0{BOLUMLER.length}</span>
              <span className="h-px w-12 bg-current opacity-60" />
              <span>{bolum.etiket}</span>
            </div>
            <h2
              id={`hikaye-${bolum.kod}`}
              className="hikaye-acil hikaye-g1 mt-5 font-serif text-[clamp(2.75rem,12vw,5.75rem)] font-semibold leading-[0.95] tracking-tight text-[#FBF6EF]"
            >
              {bolum.baslik[0]}
              <br />
              <em className="font-normal italic text-[#F2B47E]">{bolum.baslik[1]}</em>
              <br />
              {bolum.baslik[2]}
            </h2>
            <p className="hikaye-acil hikaye-g2 mt-5 max-w-[34ch] text-base leading-relaxed text-[#FBF6EF]/90 md:text-lg">
              {bolum.metin}
            </p>
            {son && (
              <a
                href="#urunler"
                className="hikaye-acil hikaye-g3 mt-7 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#FBF6EF] px-6 py-3 text-sm font-semibold text-[#141B2D] transition-colors hover:bg-white"
              >
                Ürünleri keşfet <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </div>

        <div className="absolute inset-x-6 bottom-6 z-10 flex gap-1.5 md:inset-x-10" aria-hidden="true">
          {BOLUMLER.map((b, i) => (
            <span key={b.kod} className={`h-0.5 flex-1 rounded ${i <= sira ? 'bg-[#FBF6EF]' : 'bg-[#FBF6EF]/30'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AtolyeHikayesi() {
  const kartlar = useRef<(HTMLElement | null)[]>([]);

  // Kartlar ust uste biner: sonraki kart kaydikca alttaki hafifce kuculur ve kararir.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let kare = 0;
    const guncelle = () => {
      cancelAnimationFrame(kare);
      kare = requestAnimationFrame(() => {
        const yukseklik = window.innerHeight;
        kartlar.current.forEach((kart, i) => {
          const sonraki = kartlar.current[i + 1];
          if (!kart || !sonraki) return;
          const ortulme = Math.min(1, Math.max(0, 1 - sonraki.getBoundingClientRect().top / yukseklik));
          const sahne = kart.firstElementChild as HTMLElement | null;
          const perde = kart.querySelector<HTMLElement>('.hikaye-perde');
          if (sahne) sahne.style.transform = `scale(${1 - ortulme * 0.08})`;
          if (perde) perde.style.opacity = String(ortulme * 0.6);
        });
      });
    };
    guncelle();
    window.addEventListener('scroll', guncelle, { passive: true });
    window.addEventListener('resize', guncelle);
    return () => {
      cancelAnimationFrame(kare);
      window.removeEventListener('scroll', guncelle);
      window.removeEventListener('resize', guncelle);
    };
  }, []);

  return (
    <div className="relative mt-16" aria-label="Atölye hikâyesi">
      {BOLUMLER.map((b, i) => (
        <HikayeKarti
          key={b.kod}
          bolum={b}
          sira={i}
          kartRef={(el) => {
            kartlar.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}
