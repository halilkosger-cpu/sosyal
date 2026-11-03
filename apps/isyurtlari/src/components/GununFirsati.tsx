'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LuFlame, LuShoppingBag, LuCheck, LuSparkles } from 'react-icons/lu';
import { sepeteEkle } from '@/lib/cart';
import { urunGorseli } from '@/lib/urun-gorsel';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  category?: { name: string; slug: string };
}

interface GununFirsatiProps {
  products: Product[];
}

export default function GununFirsati({ products }: GununFirsatiProps) {
  const [added, setAdded] = useState(false);

  // Öne çıkan ürün olarak stoğu ve fiyatı olan vitrin ürününü seç (Örn: zeytin, peynir, recel veya ilk uygun urun)
  const firsatUrunu =
    products.find((p) => p.price > 0 && p.quantity > 0 && p.imageUrl) ||
    products.find((p) => p.price > 0 && p.imageUrl) ||
    products[0];

  if (!firsatUrunu) return null;

  // 144 px kutu icin 400'luk surum yeterli.
  const gorselAdresi = urunGorseli(firsatUrunu.slug, firsatUrunu.imageUrl)?.replace(/-800\.webp$/, '-400.webp');

  const handleAddToCart = () => {
    const basarili = sepeteEkle({
      id: firsatUrunu.id,
      name: firsatUrunu.name,
      price: firsatUrunu.price,
      slug: firsatUrunu.slug,
      imageUrl: firsatUrunu.imageUrl,
      quantity: firsatUrunu.quantity,
    });
    if (basarili) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    }
  };

  return (
    <section className="max-w-screen-xl mx-auto px-4 pt-10" aria-label="Öne Çıkan Ürün">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F2040] via-[#162B54] to-[#0A162C] text-white shadow-xl border border-blue-900/40 p-6 md:p-8">
        {/* Arka plan süsleme ışıkları */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Sol Kolon: Başlık ve kısa açıklama */}
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold uppercase tracking-wider">
              <LuFlame className="w-4 h-4 text-orange-400 animate-pulse" />
              Öne Çıkan Ürün
            </div>

            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Öne Çıkan El Emeği Lezzeti
            </h2>

            <p className="text-sm text-blue-200/90 max-w-xl">
              İşyurtları atölyelerinde geleneksel yöntemlerle üretilen ürünlerimizden birini sizin için
              öne çıkardık.
            </p>
          </div>

          {/* Sağ Kolon: Fırsat Ürün Kartı */}
          <div className="w-full max-w-md bg-white rounded-2xl p-5 text-gray-900 shadow-2xl flex flex-col sm:flex-row items-center gap-5">
            <Link
              href={`/urun/${firsatUrunu.slug}`}
              className="relative w-36 h-36 shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 group"
            >
              {gorselAdresi ? (
                <Image
                  src={gorselAdresi}
                  alt={firsatUrunu.name}
                  fill
                  sizes="150px"
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <LuSparkles size={32} />
                </div>
              )}
              <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Öne Çıkan
              </span>
            </Link>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <span className="text-[11px] font-semibold text-[#BA4700] uppercase tracking-wide">
                {firsatUrunu.category?.name || 'Doğal Mahsul'}
              </span>

              <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                <Link href={`/urun/${firsatUrunu.slug}`} className="hover:text-[#BA4700] transition-colors">
                  {firsatUrunu.name}
                </Link>
              </h3>

              <div className="flex items-baseline justify-center sm:justify-start gap-2 pt-0.5">
                <span className="text-xl font-extrabold text-[#BA4700]">
                  ₺{Number(firsatUrunu.price).toLocaleString('tr-TR')}
                </span>
              </div>

              {/* Hızlı Eylem Butonları */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={firsatUrunu.quantity === 0}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : firsatUrunu.quantity > 0
                      ? 'bg-[#CC4E00] hover:bg-[#BA4700] text-white shadow-sm hover:shadow'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {added ? (
                    <>
                      <LuCheck size={14} strokeWidth={2.5} />
                      Sepete Eklendi
                    </>
                  ) : firsatUrunu.quantity > 0 ? (
                    <>
                      <LuShoppingBag size={14} />
                      Hemen Yakala
                    </>
                  ) : (
                    'Tükendi'
                  )}
                </button>

                <Link
                  href={`/urun/${firsatUrunu.slug}`}
                  className="py-2.5 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
                >
                  İncele
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
