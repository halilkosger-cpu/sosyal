'use client';

import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LuSearch, LuX, LuArrowRight, LuTrendingUp, LuShoppingBag } from 'react-icons/lu';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  category?: {
    name: string;
    slug: string;
  };
}

const POPULER_ARAMALAR = [
  { etiket: '🌿 Soğuk Sıkım Zeytinyağı', sorgu: 'zeytinyağı' },
  { etiket: '✂️ Hakiki Deri', sorgu: 'deri' },
  { etiket: '🪵 Sedef Kakma Ahşap', sorgu: 'ahşap' },
  { etiket: '🍯 Yayla Balı', sorgu: 'bal' },
  { etiket: '🏺 El Yapımı Çini', sorgu: 'çini' },
  { etiket: '🌸 Gül Kolonyası', sorgu: 'kolonya' },
];

export const SPOTLIGHT_ARAMA_OLAYI = 'open_spotlight_search';

export default function SpotlightArama() {
  const [acik, setAcik] = useState(false);
  const [sorgu, setSorgu] = useState('');
  const [sonuclar, setSonuclar] = useState<ProductItem[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Dışarıdan açma tetikleyicisi
  useEffect(() => {
    const ac = () => {
      setAcik(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener(SPOTLIGHT_ARAMA_OLAYI, ac);
    return () => window.removeEventListener(SPOTLIGHT_ARAMA_OLAYI, ac);
  }, []);

  // ESC ile kapatma & Cmd+K / Ctrl+K ile açma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && acik) {
        setAcik(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAcik((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [acik]);

  // Canlı arama debounced
  useEffect(() => {
    const trimmed = sorgu.trim();
    if (trimmed.length < 2) {
      setSonuclar([]);
      setYukleniyor(false);
      return;
    }

    setYukleniyor(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!controller.signal.aborted) {
          setSonuclar(Array.isArray(data) ? data.slice(0, 8) : []);
        }
      } catch {
        if (!controller.signal.aborted) setSonuclar([]);
      } finally {
        if (!controller.signal.aborted) setYukleniyor(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [sorgu]);

  const uruneGit = (slug: string) => {
    setAcik(false);
    setSorgu('');
    router.push(`/urun/${slug}`);
  };

  const tumunuAra = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = sorgu.trim();
    if (!trimmed) return;
    setAcik(false);
    router.push(`/ara?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-md animate-fadeIn">
          {/* Overlay tıklama */}
          <div className="absolute inset-0" onClick={() => setAcik(false)} />

          {/* Spotlight Konteyner */}
          <m.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-2xl mx-auto mt-2 sm:mt-12 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[80vh] border border-gray-100"
          >
            {/* Arama Başlığı & Girişi */}
            <form onSubmit={tumunuAra} className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/70">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#CC4E00] flex items-center justify-center shrink-0">
                <LuSearch size={18} />
              </div>
              <input
                ref={inputRef}
                type="search"
                value={sorgu}
                onChange={(e) => setSorgu(e.target.value)}
                placeholder="Ürün adı, kategori veya zanaat türü arayın..."
                className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              {sorgu && (
                <button
                  type="button"
                  onClick={() => setSorgu('')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg shrink-0"
                >
                  <LuX size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setAcik(false)}
                className="px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 shrink-0 rounded-lg hover:bg-gray-200/60 transition"
              >
                Kapat
              </button>
            </form>

            {/* İçerik Alanı */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Popüler Aramalar (Sorgu Boşken) */}
              {!sorgu.trim() && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-3">
                    <LuTrendingUp size={14} className="text-[#CC4E00]" />
                    <span>Popüler El Emeği Aramalar</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULER_ARAMALAR.map((item) => (
                      <button
                        key={item.sorgu}
                        type="button"
                        onClick={() => setSorgu(item.sorgu)}
                        className="px-3 py-2 bg-gray-100 hover:bg-orange-50 hover:text-[#CC4E00] hover:border-orange-200 border border-transparent rounded-xl text-xs font-medium text-gray-700 transition-all flex items-center gap-1"
                      >
                        {item.etiket}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Yükleniyor Göstergesi */}
              {yukleniyor && (
                <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#CC4E00] border-t-transparent rounded-full animate-spin" />
                  <span>Ürünler taranıyor...</span>
                </div>
              )}

              {/* Canlı Sonuçlar */}
              {!yukleniyor && sonuclar.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-3">
                    <span>Eşleşen Ürünler ({sonuclar.length})</span>
                    <button
                      type="button"
                      onClick={() => tumunuAra()}
                      className="text-[#CC4E00] hover:underline flex items-center gap-0.5"
                    >
                      Tümünü Gör <LuArrowRight size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {sonuclar.map((urun) => (
                      <div
                        key={urun.id}
                        onClick={() => uruneGit(urun.slug)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-100 bg-white hover:bg-orange-50/50 hover:border-orange-200 transition-all cursor-pointer group"
                      >
                        <div className="relative w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 shrink-0 overflow-hidden flex items-center justify-center">
                          {urun.imageUrl ? (
                            <Image src={urun.imageUrl} alt={urun.name} fill sizes="48px" className="object-cover" />
                          ) : (
                            <LuShoppingBag size={20} className="text-[#CC4E00]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {urun.category && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
                              {urun.category.name}
                            </span>
                          )}
                          <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#CC4E00] transition-colors">
                            {urun.name}
                          </p>
                          <p className="text-xs font-black text-[#BA4700]">
                            {urun.price > 0 ? `₺${urun.price.toFixed(2)}` : 'Fiyat Belirleniyor'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sonuç Bulunamadı */}
              {!yukleniyor && sorgu.trim().length >= 2 && sonuclar.length === 0 && (
                <div className="py-12 text-center">
                  <span className="text-4xl block mb-2">🔍</span>
                  <p className="text-sm font-bold text-gray-800">&quot;{sorgu}&quot; ile eşleşen ürün bulunamadı</p>
                  <p className="text-xs text-gray-400 mt-1">Farklı bir kelime deneyebilir veya kategorileri keşfedebilirsiniz.</p>
                </div>
              )}
            </div>

            {/* Alt Footer */}
            {sonuclar.length > 0 && (
              <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => tumunuAra()}
                  className="w-full py-2.5 bg-[#0F2040] hover:bg-[#CC4E00] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>&quot;{sorgu}&quot; ile İlgili Tüm Sonuçları Gör</span>
                  <LuArrowRight size={14} />
                </button>
              </div>
            )}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
