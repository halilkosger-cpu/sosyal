'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LuSparkles, LuArrowRight, LuShieldCheck, LuShoppingBag } from 'react-icons/lu';

export default function KampanyaHeroBanner() {
  return (
    <section className="max-w-screen-xl mx-auto px-4 pt-10" aria-label="Büyük Açılış ve Efsane Kasım Kampanyası">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C130D] via-[#2A180E] to-[#120D0A] text-white shadow-2xl border border-amber-900/30">
        
        {/* Dekoratif Işık Efektleri */}
        <div className="absolute top-0 right-1/4 -mt-16 h-72 w-72 rounded-full bg-[#E8620C]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 -mb-16 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Sol: Metin ve Aksiyon Alanı */}
          <div className="lg:col-span-6 p-6 sm:p-8 md:p-10 lg:pr-0 z-10">
            
            {/* Üst Rozet */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600/90 via-amber-600/90 to-orange-600/90 px-3.5 py-1.5 text-xs font-extrabold tracking-wider uppercase text-white shadow-md border border-white/20 mb-5">
              <LuSparkles size={14} className="text-amber-200" />
              <span>Büyük Açılış &amp; Efsane Kasım</span>
            </div>

            {/* Başlık */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-white leading-[1.15] mb-4">
              Tüm Ürünlerde <br />
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                Sepette Net %10 İndirim
              </span>
            </h2>

            {/* Açıklama */}
            <p className="text-sm sm:text-base text-[#D4C3B3] leading-relaxed mb-6 max-w-xl">
              Doğal taş baskı zeytinyağından tulum peynirine, cevizden el emeği deri cüzdan ve ahşap atölye ürünlerine kadar tüm ürünlerde indirim sepette <strong>otomatik uygulanır</strong>.
            </p>

            {/* Avantaj Rozetleri */}
            <div className="flex flex-wrap gap-2.5 sm:gap-3 text-xs font-medium text-amber-200/90 mb-7">
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <LuShieldCheck size={14} className="text-amber-300" /> Kuponsuz Otomatik İndirim
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <LuShoppingBag size={14} className="text-amber-300" /> Tüm Ürünlerde Geçerli
              </span>
            </div>

            {/* Butonlar */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/#urunler"
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#BA4700] via-[#CC4E00] to-[#BA4700] px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-orange-900/40 transition hover:brightness-110 active:scale-[0.99]"
              >
                <span>İndirimli Ürünleri Keşfet</span>
                <LuArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Sağ: Büyük Doğal Gıda & El Sanatları Görseli */}
          <div className="lg:col-span-6 relative h-64 sm:h-80 md:h-96 lg:h-full min-h-[300px] lg:min-h-[420px] overflow-hidden">
            <Image
              src="/kampanya/kasim-firsati.webp"
              alt="İşyurtları Doğal Gıda ve El Sanatları Büyük Açılış İndirimi"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              className="object-cover object-center transition-transform duration-700 hover:scale-105"
              priority
            />
            {/* Yumuşak degradeler: mobilde üstten, masaüstünde soldan geçiş */}
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#1C130D] via-[#1C130D]/40 to-transparent" />
          </div>

        </div>
      </div>
    </section>
  );
}
