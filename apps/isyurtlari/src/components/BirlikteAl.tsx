'use client';

import { useState } from 'react';
import { LuCheck, LuShoppingCart } from 'react-icons/lu';
import { sepeteEkle } from '@/lib/cart';
import { urunGorseli } from '@/lib/urun-gorsel';
import type { KartUrunu } from '@/components/UrunKarti';

interface BirlikteAlProps {
  anaUrun: {
    id: string;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    imageUrl?: string | null;
    category?: { name: string; slug: string; kdvOrani?: number } | null;
    campaign?: { discount: number; discountedPrice: number } | null;
  };
  tamamlayicilar: KartUrunu[];
}

export default function BirlikteAl({ anaUrun, tamamlayicilar }: BirlikteAlProps) {
  // Varsayılan olarak tüm ürünler seçili
  const [seciliIds, setSeciliIds] = useState<string[]>([
    anaUrun.id,
    ...tamamlayicilar.map((t) => t.id),
  ]);
  const [eklendi, setEklendi] = useState(false);

  const tumUrunler = [
    {
      id: anaUrun.id,
      name: anaUrun.name,
      slug: anaUrun.slug,
      price: anaUrun.campaign?.discountedPrice ?? anaUrun.price,
      quantity: anaUrun.quantity,
      imageUrl: anaUrun.imageUrl,
      campaign: anaUrun.campaign ?? null,
      kdvOrani: anaUrun.category?.kdvOrani ?? null,
      isAna: true,
    },
    ...tamamlayicilar.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      price: t.campaign?.discountedPrice ?? t.price,
      quantity: t.quantity,
      imageUrl: t.imageUrl,
      campaign: t.campaign ?? null,
      kdvOrani: t.category?.kdvOrani ?? null,
      isAna: false,
    })),
  ];

  const secilenUrunler = tumUrunler.filter((u) => seciliIds.includes(u.id));
  const toplamTutar = secilenUrunler.reduce((sum, u) => sum + u.price, 0);

  const toggleSelect = (id: string) => {
    if (seciliIds.includes(id)) {
      if (seciliIds.length === 1) return; // En az 1 ürün seçili kalsın
      setSeciliIds(seciliIds.filter((item) => item !== id));
    } else {
      setSeciliIds([...seciliIds, id]);
    }
  };

  const handleSepeteTopluEkle = () => {
    secilenUrunler.forEach((u) => {
      sepeteEkle(
        {
          id: u.id,
          name: u.name,
          price: u.price,
          slug: u.slug,
          imageUrl: u.imageUrl,
          quantity: u.quantity,
          campaign: u.campaign,
          kdvOrani: u.kdvOrani,
        },
        1
      );
    });
    setEklendi(true);
    setTimeout(() => setEklendi(false), 3500);
  };

  return (
    <section className="my-8 rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>✨</span> Birlikte Sık Tercih Edilenler
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Bu ürünü inceleyen müşterilerimiz genellikle bu ikili/üçlü kombinle sipariş veriyor.
          </p>
        </div>
        <span className="text-xs font-semibold text-[#BA4700] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 hidden sm:inline-block">
          Avantajlı Kombin
        </span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Ürün Listesi */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
          {tumUrunler.map((u, i) => {
            const secili = seciliIds.includes(u.id);
            const gorsel = urunGorseli(u.slug, u.imageUrl);
            return (
              <div key={u.id} className="flex items-center gap-3">
                <div
                  onClick={() => toggleSelect(u.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none max-w-[230px] ${
                    secili
                      ? 'border-[#CC4E00] bg-orange-50/40 shadow-sm'
                      : 'border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={secili}
                    onChange={() => {}}
                    className="w-4 h-4 text-[#CC4E00] rounded border-gray-300 focus:ring-[#CC4E00] cursor-pointer"
                  />
                  <div className="w-14 h-14 relative shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                    {gorsel ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={gorsel} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">
                      {u.name}
                    </p>
                    <p className="text-xs font-bold text-[#BA4700] mt-1">
                      ₺{u.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>

                {i < tumUrunler.length - 1 && (
                  <div className="text-gray-400 font-bold text-lg select-none px-1">
                    +
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Toplam & Satın Alma Butonu */}
        <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-center">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs text-gray-500">Seçilen ({secilenUrunler.length} Ürün):</span>
            <span className="text-xl font-extrabold text-[#141B2D]">
              ₺{toplamTutar.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mb-3">KDV Dahil · Tek pakette sevk</p>

          <button
            type="button"
            onClick={handleSepeteTopluEkle}
            disabled={secilenUrunler.length === 0}
            className={`w-full h-11 rounded-xl font-bold text-white text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              eklendi
                ? 'bg-emerald-600'
                : 'bg-[#CC4E00] hover:bg-[#A63F00] shadow-orange-950/20'
            }`}
          >
            {eklendi ? (
              <>
                <LuCheck size={16} /> Sepete Eklendi ({secilenUrunler.length})
              </>
            ) : (
              <>
                <LuShoppingCart size={16} /> Seçilenleri Birlikte Ekle
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
