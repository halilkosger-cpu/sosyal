'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { kampanyaGosterilebilir, sayfaGoruntulendi } from '@/lib/katman-sirasi';
import Image from 'next/image';
import Link from 'next/link';
import { LuX, LuSparkles, LuCheck, LuArrowRight } from 'react-icons/lu';

const MODAL_STORAGE_KEY = 'isyurtlari_kasim_popup_v1';
const GIZLEME_SURESI_MS = 24 * 60 * 60 * 1000; // 24 saat

export default function KampanyaModal() {
  const [acik, setAcik] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const sonKapatma = localStorage.getItem(MODAL_STORAGE_KEY);
      if (sonKapatma) {
        const zaman = parseInt(sonKapatma, 10);
        if (Date.now() - zaman < GIZLEME_SURESI_MS) {
          return; // 24 saat dolmamışsa gösterme
        }
      }
    } catch {
      // localStorage erişim hatası durumunda devam et
    }

    if (!kampanyaGosterilebilir(sayfaGoruntulendi())) return;

    const timer = setTimeout(() => {
      setAcik(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [pathname]);

  const kapat = () => {
    setAcik(false);
    try {
      localStorage.setItem(MODAL_STORAGE_KEY, Date.now().toString());
    } catch {}
  };

  if (!acik) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kampanya-modal-baslik"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={kapat}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-amber-100/60 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapat Butonu */}
        <button
          onClick={kapat}
          aria-label="Kapat"
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition shadow-md"
        >
          <LuX size={18} />
        </button>

        {/* Görsel Alanı */}
        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-amber-50">
          <Image
            src="/kampanya/kasim-firsati.webp"
            alt="Büyük Açılış & Efsane Kasım Fırsatları"
            fill
            sizes="(max-width: 640px) 100vw, 520px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Vurgulu Rozet */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-orange-600 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg border border-white/20 animate-pulse">
              <LuSparkles size={13} className="text-amber-200" />
              Büyük Açılış &amp; Efsane Kasım
            </span>
          </div>

          {/* Görsel Üzeri Alt Başlık */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <p id="kampanya-modal-baslik" className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md">
              Sepette Net <span className="text-amber-300 underline decoration-amber-400">%10 İndirim</span>
            </p>
          </div>
        </div>

        {/* İçerik Alanı */}
        <div className="p-5 sm:p-6 text-gray-800">
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
            Doğal zeytinyağından tulum peynirine, cevizden el yapımı deri ve ahşap atölye ürünlerine kadar <strong>tüm ürünlerde</strong> sepette anında net %10 indirim uygulanır.
          </p>

          {/* Avantaj Maddeleri */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-700 mb-5 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/50">
            <div className="flex items-center gap-1.5 text-emerald-800">
              <LuCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Kupon kodu gerekmez</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <LuCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Sepette otomatik düşer</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <LuCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Tüm ürünlerde geçerli</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <LuCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Açılışa özel sınırlı süre</span>
            </div>
          </div>

          {/* Eylem Butonları */}
          <div className="space-y-2.5">
            <Link
              href="/#urunler"
              onClick={kapat}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#BA4700] via-[#CC4E00] to-[#BA4700] py-3.5 px-4 text-sm sm:text-base font-bold text-white shadow-lg shadow-orange-700/25 transition hover:brightness-110 active:scale-[0.99]"
            >
              <span>Alışverişe Başla · İndirimden Yararlan</span>
              <LuArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>

            <button
              type="button"
              onClick={kapat}
              className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-800 py-1 transition"
            >
              Alışverişe devam et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
