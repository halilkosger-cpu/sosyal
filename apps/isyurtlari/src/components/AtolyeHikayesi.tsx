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

function HikayeBolumu({ bolum, sira }: { bolum: Bolum; sira: number }) {
  const kapRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cubukRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const kap = kapRef.current;
    const video = videoRef.current;
    if (!kap || !video) return;
    const azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Video yalnizca ekrana yaklasinca iner ve gorunurken oynar.
    const izleyici = new IntersectionObserver(
      ([g]) => {
        if (g.isIntersecting) {
          kap.dataset.gorunur = 'true';
          if (!azHareket) {
            if (video.preload !== 'auto') {
              video.preload = 'auto';
              video.load();
            }
            video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { rootMargin: '200px 0px', threshold: 0.15 }
    );
    izleyici.observe(kap);

    if (azHareket) return () => izleyici.disconnect();

    let kare = 0;
    const kaydir = () => {
      cancelAnimationFrame(kare);
      kare = requestAnimationFrame(() => {
        const r = kap.getBoundingClientRect();
        const t = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
        video.style.transform = `scale(${1.08 - t * 0.08})`;
        if (cubukRef.current) cubukRef.current.style.transform = `scaleX(${t})`;
      });
    };
    window.addEventListener('scroll', kaydir, { passive: true });
    return () => {
      izleyici.disconnect();
      window.removeEventListener('scroll', kaydir);
      cancelAnimationFrame(kare);
    };
  }, []);

  return (
    <section ref={kapRef} className="hikaye-bolum group relative h-[150vh]" aria-labelledby={`hikaye-${bolum.kod}`}>
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#141B2D]">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover will-change-transform motion-reduce:!transform-none"
          style={{ transform: 'scale(1.08)' }}
          poster={`/hikaye/${bolum.kod}.jpg`}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        >
          <source src={`/hikaye/${bolum.kod}.mp4`} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,27,45,.15)_0%,rgba(20,27,45,0)_35%,rgba(20,27,45,.55)_70%,rgba(20,27,45,.88)_100%)]" />

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
            {sira === BOLUMLER.length - 1 && (
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
            <span key={b.kod} className="h-0.5 flex-1 overflow-hidden rounded bg-[#FBF6EF]/30">
              {i < sira && <i className="block h-full w-full bg-[#FBF6EF]" />}
              {i === sira && <i ref={cubukRef} className="block h-full w-full origin-left scale-x-0 bg-[#FBF6EF]" />}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AtolyeHikayesi() {
  return (
    <div className="mt-16" aria-label="Atölye hikâyesi">
      {BOLUMLER.map((b, i) => (
        <HikayeBolumu key={b.kod} bolum={b} sira={i} />
      ))}
    </div>
  );
}
