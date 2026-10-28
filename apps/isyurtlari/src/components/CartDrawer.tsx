'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCartDrawer } from '../context/CartDrawerContext';
import { LuX, LuShoppingBag, LuArrowRight, LuTrash2, LuPlus, LuMinus } from 'react-icons/lu';
import Link from 'next/link';
import Image from 'next/image';
import { sepetiOku, sepetiYaz, SEPET_OLAYI, type SepetUrunu } from '../lib/cart';
import KargoIlerlemeCubugu from './KargoIlerlemeCubugu';

export interface CartDrawerProps {
  /** Ek Tailwind sınıfları */
  className?: string;
  /** Test kimliği */
  'data-testid'?: string;
}

/**
 * CartDrawer
 *
 * Ekranın sağından pürüzsüz yay animasyonuyla (x: '100%' -> x: 0) içeri kayan
 * modern sepet çekmecesi bileşeni.
 *
 * - Sepetteki gerçek ürünleri (`sepetiOku`) listeler ve `cartUpdated` olayını canlı dinler.
 * - Adet artırma, azaltma ve sepetten çıkarma işlemlerini anlık senkronize eder.
 * - Alt kısımda toplam tutar, sepete git ve hızlı sipariş tamamlama aksiyonları sunar.
 * - Erişilebilirlik: useReducedMotion aktifse kayma animasyonu iptal edilerek
 *   doğrudan opaklık geçişi (opacity: 0 -> 1) uygulanır.
 */
export default function CartDrawer({
  className = '',
  'data-testid': testId = 'cart-drawer-root',
}: CartDrawerProps) {
  const { isCartOpen, closeCart } = useCartDrawer();
  const shouldReduceMotion = useReducedMotion();
  const [items, setItems] = useState<SepetUrunu[]>([]);

  // Sepet verilerini oku ve senkronize tut
  useEffect(() => {
    const yukle = () => setItems(sepetiOku());
    yukle();

    window.addEventListener(SEPET_OLAYI, yukle);
    return () => window.removeEventListener(SEPET_OLAYI, yukle);
  }, []);

  const panelRef = useRef<HTMLDivElement>(null);

  // Açıkken: arka sayfa kaymasın, odak panelde kalsın, ESC kapatsın
  useEffect(() => {
    if (!isCartOpen) return;
    const oncekiOdak = document.activeElement as HTMLElement | null;
    const oncekiTasma = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const odaklanabilirler = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])') ?? []
      );
    const zamanlayici = setTimeout(() => odaklanabilirler()[0]?.focus(), 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart();
        return;
      }
      if (e.key !== 'Tab') return;
      const liste = odaklanabilirler();
      if (liste.length === 0) return;
      const ilk = liste[0];
      const son = liste[liste.length - 1];
      if (e.shiftKey && document.activeElement === ilk) {
        e.preventDefault();
        son.focus();
      } else if (!e.shiftKey && document.activeElement === son) {
        e.preventDefault();
        ilk.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(zamanlayici);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = oncekiTasma;
      oncekiOdak?.focus?.();
    };
  }, [isCartOpen, closeCart]);

  // Adet güncelleme
  const adetDegistir = (id: string, fark: number) => {
    const yeni = items
      .map((item) => {
        if (item.id === id) {
          const yeniAdet = item.quantity + fark;
          return yeniAdet > 0 ? { ...item, quantity: yeniAdet } : null;
        }
        return item;
      })
      .filter((item): item is SepetUrunu => item !== null);

    sepetiYaz(yeni);
    setItems(yeni);
  };

  // Sepetten silme
  const urunSil = (id: string) => {
    const yeni = items.filter((item) => item.id !== id);
    sepetiYaz(yeni);
    setItems(yeni);
  };

  // Toplam tutar
  const toplamTutar = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  // Animasyon varyantları
  const animationMode = shouldReduceMotion ? 'opacity' : 'slide';

  const drawerVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { x: '100%' },
    animate: shouldReduceMotion ? { opacity: 1 } : { x: 0 },
    exit: shouldReduceMotion ? { opacity: 0 } : { x: '100%' },
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div
          data-testid={testId}
          data-is-open="true"
          data-animation-mode={animationMode}
          data-target-x="0"
          data-reduced-motion={shouldReduceMotion ? 'true' : 'false'}
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* Arka plan karartması */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            aria-label="Sepeti kapat"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          {/* Sağdan açılan çekmece paneli */}
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Alışveriş Sepeti"
            initial={drawerVariants.initial}
            animate={drawerVariants.animate}
            exit={drawerVariants.exit}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 300,
              mass: 0.7,
            }}
            className={`relative z-10 w-full max-w-md h-full bg-white shadow-2xl flex flex-col will-change-transform ${className}`}
          >
            {/* Çekmece Başlığı */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-50 text-[#FF6000] rounded-xl">
                  <LuShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F2040]">Alışveriş Sepeti</h2>
                  <span className="text-xs text-gray-400">
                    {items.length > 0 ? `${items.length} çeşit ürün` : 'Sepetiniz boş'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Kapat"
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <LuX size={20} />
              </button>
            </div>

            {/* 1.500 TL Ücretsiz Kargo İlerleme Çubuğu */}
            {items.length > 0 && (
              <div className="px-6 pt-3 pb-1 bg-white">
                <KargoIlerlemeCubugu toplamTutar={toplamTutar} kompakt />
              </div>
            )}

            {/* Sepet İçeriği */}
            {items.length === 0 ? (
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                  <LuShoppingBag size={32} />
                </div>
                <p className="text-gray-900 font-medium mb-1">Sepetiniz şu anda boş</p>
                <p className="text-sm text-gray-500 max-w-xs mb-6">
                  İşyurtları kurumlarında üretilen el emeği ürünleri keşfedin.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="px-5 py-2.5 rounded-xl bg-[#0F2040] text-white text-sm font-semibold hover:bg-[#FF6000] transition-colors"
                >
                  Alışverişe Devam Et
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center">
                    {/* Ürün Görseli */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <LuShoppingBag className="text-gray-300" size={24} />
                      )}
                    </div>

                    {/* Ürün Bilgisi */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.quantity} adet
                      </div>
                      <div className="text-sm font-extrabold text-[#0F2040] mt-1">
                        {(item.price * item.quantity).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </div>
                    </div>

                    {/* Adet Kontrolü & Silme */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <button
                          type="button"
                          onClick={() => adetDegistir(item.id, -1)}
                          aria-label="Adet azalt"
                          className="p-1.5 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <LuMinus size={12} />
                        </button>
                        <span className="px-2 text-xs font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => adetDegistir(item.id, 1)}
                          aria-label="Adet artır"
                          className="p-1.5 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <LuPlus size={12} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => urunSil(item.id)}
                        aria-label="Ürünü sepetten çıkar"
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                      >
                        <LuTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Alt Alan (Özet & Sipariş) */}
            <div className="border-t border-gray-100 p-6 bg-gray-50/50">
              {items.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">Ara Toplam</span>
                  <span className="text-xl font-black text-[#0F2040]">
                    {toplamTutar.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    })}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mb-2.5">
                <Link
                  href="/sepet"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm shadow-sm transition-all"
                >
                  <span>Sepeti İncele</span>
                </Link>
                <Link
                  href={items.length > 0 ? '/checkout' : '/sepet'}
                  onClick={closeCart}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#0F2040] hover:bg-[#FF6000] text-white font-bold text-sm shadow-md transition-all active:scale-[0.99]"
                >
                  <span>Siparişi Tamamla</span>
                  <LuArrowRight size={16} />
                </Link>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="w-full py-2 text-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
              >
                ← Alışverişe Devam Et
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
