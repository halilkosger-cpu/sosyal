'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LuHouse, LuSearch, LuHeart, LuShoppingCart, LuUser } from 'react-icons/lu';
import { useMusteri } from '@/lib/musteri-istemci';
import { SEPET_OLAYI, sepetiOku } from '@/lib/cart';
import { FAVORI_OLAYI, favorileriGetir } from '@/lib/favoriler';
import { SPOTLIGHT_ARAMA_OLAYI } from '@/components/SpotlightArama';

/**
 * Mobil alt gezinme çubuğu.
 *
 * Sitede mobilde gezinmenin tek yolu üstteki yatay kaydırmalı kategori
 * şeridiydi; sepete ya da hesaba gitmek için her seferinde yukarı kaydırmak
 * gerekiyordu. Trafiğin çoğunluğu mobilden gelen bir mağazada bu doğrudan
 * dönüşüm kaybı.
 *
 * Yalnızca mobilde görünüyor (md altı). Masaüstünde üst başlık zaten
 * hepsini taşıyor.
 */

import { useCartDrawer } from '@/context/CartDrawerContext';

const YOK_SAYILAN_YOLLAR = ['/admin', '/checkout'];

export default function AltGezinme() {
  const yol = usePathname();
  const { musteri } = useMusteri();
  const { openCart, isCartOpen } = useCartDrawer();
  const [sepetAdedi, setSepetAdedi] = useState(0);
  const [favoriAdedi, setFavoriAdedi] = useState(0);
  const [sepetAnimasyon, setSepetAnimasyon] = useState(false);

  useEffect(() => {
    const guncelle = () => {
      setSepetAdedi(sepetiOku().reduce((t, k) => t + (k.quantity || 0), 0));
      setFavoriAdedi(favorileriGetir().length);
      setSepetAnimasyon(true);
      setTimeout(() => setSepetAnimasyon(false), 800);
    };

    // İlk yüklemede animasyonsuz oku
    setSepetAdedi(sepetiOku().reduce((t, k) => t + (k.quantity || 0), 0));
    setFavoriAdedi(favorileriGetir().length);

    window.addEventListener(SEPET_OLAYI, guncelle);
    window.addEventListener(FAVORI_OLAYI, guncelle);
    return () => {
      window.removeEventListener(SEPET_OLAYI, guncelle);
      window.removeEventListener(FAVORI_OLAYI, guncelle);
    };
  }, []);

  if (YOK_SAYILAN_YOLLAR.some((p) => yol?.startsWith(p))) return null;

  return (
    <>
      {/* Sabit çubuk sayfanın son satırlarını örtmesin diye ayrılan yer. */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      <nav
        aria-label="Alt gezinme"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-5">
          {/* Ana Sayfa */}
          <li>
            <Link
              href="/"
              className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                yol === '/' ? 'text-[#BA4700]' : 'text-gray-500'
              }`}
            >
              <LuHouse size={20} strokeWidth={yol === '/' ? 2.4 : 2} />
              <span className="text-[10px] font-medium">Ana Sayfa</span>
            </Link>
          </li>

          {/* Ara */}
          <li>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  if ('vibrate' in navigator) {
                    try { navigator.vibrate(20); } catch {}
                  }
                  window.dispatchEvent(new Event(SPOTLIGHT_ARAMA_OLAYI));
                }
              }}
              aria-label="Ürün Ara"
              className={`w-full flex flex-col items-center justify-center gap-0.5 py-2 transition-colors active:scale-95 ${
                yol?.startsWith('/ara') ? 'text-[#BA4700]' : 'text-gray-500'
              }`}
            >
              <LuSearch size={20} strokeWidth={yol?.startsWith('/ara') ? 2.4 : 2} />
              <span className="text-[10px] font-medium">Ara</span>
            </button>
          </li>

          {/* Favoriler */}
          <li>
            <Link
              href="/favoriler"
              className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                yol?.startsWith('/favoriler') ? 'text-[#BA4700]' : 'text-gray-500'
              }`}
            >
              <span className="relative">
                <LuHeart size={20} strokeWidth={yol?.startsWith('/favoriler') ? 2.4 : 2} />
                {favoriAdedi > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-[#CC4E00] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {favoriAdedi > 99 ? '99+' : favoriAdedi}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">Favoriler</span>
            </Link>
          </li>

          {/* Sepetim - Slide-over Drawer Açar */}
          <li>
            <button
              type="button"
              onClick={() => openCart()}
              className={`w-full flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                isCartOpen || yol === '/sepet' ? 'text-[#BA4700]' : 'text-gray-500'
              }`}
              aria-label="Sepeti Görüntüle"
            >
              <span className="relative">
                <LuShoppingCart size={20} strokeWidth={isCartOpen ? 2.4 : 2} />
                {sepetAdedi > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-[#CC4E00] text-white text-[10px] font-bold rounded-full flex items-center justify-center transition-all duration-300 ${
                      sepetAnimasyon ? 'scale-125 ring-2 ring-orange-300 shadow-md' : 'scale-100'
                    }`}
                  >
                    {sepetAdedi > 99 ? '99+' : sepetAdedi}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">Sepetim</span>
            </button>
          </li>

          {/* Hesabım / Giriş */}
          <li>
            <Link
              href={musteri ? '/hesabim' : '/giris'}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                yol?.startsWith('/hesabim') || yol?.startsWith('/giris') ? 'text-[#BA4700]' : 'text-gray-500'
              }`}
            >
              <LuUser size={20} strokeWidth={yol?.startsWith('/hesabim') || yol?.startsWith('/giris') ? 2.4 : 2} />
              <span className="text-[10px] font-medium">{musteri ? 'Hesabım' : 'Giriş'}</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
