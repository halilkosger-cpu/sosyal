'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';
import UrunKarti from '@/components/UrunKarti';
import HarvestFilter, { HarvestSeasonType } from '@/components/HarvestFilter';
import { urunYedegi } from '@/app/urun-yedegi';

interface Product { id: string; name: string; slug: string; price: number; quantity: number; imageUrl?: string; category: { name: string; slug: string }; }

export default function AnaSayfaVitrini({ products, tumUrunler }: { products: Product[]; tumUrunler: string }) {
  const [activeSeason, setActiveSeason] = useState<HarvestSeasonType>('tumu');

  const filteredProducts = products.filter((p) => {
    if (!p.category) return false;
    if (activeSeason === 'tumu') return true;
    if (activeSeason === 'taze-hasat') {
      const isFood = p.category.slug === 'gida' || p.category.slug === 'gida-urunleri';
      const nameL = p.name.toLowerCase();
      const foodTerms = ['bal', 'reçel', 'zeytin', 'zeytinya', 'pekmez', 'sirke', 'salça', 'ceviz', 'fıstık', 'nohut', 'fasulye', 'tarhana', 'çay'];
      return isFood || foodTerms.some((term) => nameL.includes(term));
    }
    if (activeSeason === 'on-siparis') {
      return p.quantity <= 0;
    }
    if (activeSeason === 'dort-mevsim') {
      const craftSlugs = ['ahsap', 'ahsap-urunler', 'tekstil', 'tekstil-urunleri', 'dokuma', 'sanat-zanaat', 'mobilya', 'hediyelik'];
      return craftSlugs.includes(p.category.slug);
    }
    return true;
  });


  return (
    <>
      {/* ─── EL EMEĞİ ÜRÜNLER ───
          Kare kadraj ve genis satir araligi: kartlar birbirine
          yapismiyor, fotograflar ayni oranda duruyor. */}
      <section id="urunler" className="max-w-screen-xl mx-auto px-4 pt-12 scroll-mt-24">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
          <h2 className="font-serif text-2xl md:text-[1.9rem] font-semibold text-gray-900 tracking-tight">El emeği ürünler</h2>
          <Link href={tumUrunler} className="inline-flex items-center gap-1.5 text-[#BA4700] hover:text-[#8F3700] text-sm font-semibold">
            Tümünü gör <LuArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ─── HASAT & MEVSİM FİLTRESİ ─── */}
        <div className="mb-6">
          <HarvestFilter
            activeSeason={activeSeason}
            onSeasonChange={setActiveSeason}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-8 text-center my-4">
            <span className="text-3xl block mb-2">🌿</span>
            <p className="text-sm font-semibold text-gray-800 mb-1">Bu sezona/kategoriye ait ürün bulunamadı</p>
            <p className="text-xs text-gray-500 mb-4">Diğer mevsim ve zanaat ürünlerini inceleyebilirsiniz.</p>
            <button
              onClick={() => setActiveSeason('tumu')}
              className="px-4 py-2 bg-[#CC4E00] text-white text-xs font-semibold rounded-lg hover:bg-[#A63F00] transition"
            >
              Tüm Ürünleri Göster
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
            {filteredProducts.map((product, sira) => (
              <UrunKarti
                key={product.id}
                urun={product}
                kompakt
                favoriButonu={false}
                gorselYedek={urunYedegi(product.category.slug)}
                gorselArkaPlani="from-white to-[#F7F2EA]"
                gorselYuksekligi="aspect-square"
                gorselBoyutlari="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 300px"
                gorselOncelikli={sira < 4}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
