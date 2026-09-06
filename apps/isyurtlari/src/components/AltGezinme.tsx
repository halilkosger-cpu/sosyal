'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LuHouse, LuSearch, LuHeart, LuShoppingCart, LuUser } from 'react-icons/lu';
import { useMusteri } from '@/lib/musteri-istemci';
import { SEPET_OLAYI, sepetiOku } from '@/lib/cart';
import { FAVORI_OLAYI, favorileriGetir } from '@/lib/favoriler';

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

const YOK_SAYILAN_YOLLAR = ['/admin', '/checkout'];

export default function AltGezinme() {
  const yol = usePathname();
  const { musteri } = useMusteri();
  const [sepetAdedi, setSepetAdedi] = useState(0);
  const [favoriAdedi, setFavoriAdedi] = useState(0);

  useEffect(() => {
    const guncelle = () => {
      setSepetAdedi(sepetiOku().reduce((t, k) => t + (k.quantity || 0), 0));
      setFavoriAdedi(favorileriGetir().length);
    };

    guncelle();
    window.addEventListener(SEPET_OLAYI, guncelle);
    window.addEventListener(FAVORI_OLAYI, guncelle);
    return () => {
      window.removeEventListener(SEPET_OLAYI, guncelle);
      window.removeEventListener(FAVORI_OLAYI, guncelle);
    };
  }, []);

  /**
   * Yönetim panelinde ve ödeme akışında gizli.
   *
   * Ödeme sayfasında müşterinin tek bir işi var; alt çubuk hem yer kaplar
   * hem dikkat dağıtır. Pazaryerlerinin hepsi ödeme adımında gezinmeyi
   * sadeleştiriyor.
   */
  if (YOK_SAYILAN_YOLLAR.some((p) => yol?.startsWith(p))) return null;

  const maddeler = [
    { href: '/', Ikon: LuHouse, metin: 'Ana Sayfa', rozet: 0 },
    { href: '/ara', Ikon: LuSearch, metin: 'Ara', rozet: 0 },
    { href: '/favoriler', Ikon: LuHeart, metin: 'Favoriler', rozet: favoriAdedi },
    { href: '/sepet', Ikon: LuShoppingCart, metin: 'Sepetim', rozet: sepetAdedi },
    {
      href: musteri ? '/hesabim' : '/giris',
      Ikon: LuUser,
      metin: musteri ? 'Hesabım' : 'Giriş',
      rozet: 0,
    },
  ];

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
          {maddeler.map((madde) => {
            const etkin = madde.href === '/' ? yol === '/' : yol?.startsWith(madde.href);
            return (
              <li key={madde.metin}>
                <Link
                  href={madde.href}
                  aria-current={etkin ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                    etkin ? 'text-[#BA4700]' : 'text-gray-500'
                  }`}
                >
                  <span className="relative">
                    <madde.Ikon size={20} strokeWidth={etkin ? 2.4 : 2} />
                    {madde.rozet > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-[#CC4E00] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {madde.rozet > 99 ? '99+' : madde.rozet}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium">{madde.metin}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
