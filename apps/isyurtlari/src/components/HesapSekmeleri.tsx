'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuUser, LuPackage, LuMapPin, LuHeart, LuRotateCcw } from 'react-icons/lu';
import { useMusteri } from '@/lib/musteri-istemci';

/**
 * Hesap sayfalari arasinda gezinme sekmeleri (2026 Eylul tasarimi).
 *
 * Eskiden her hesap sayfasinin basinda yalnizca "← Hesabım" baglantisi
 * vardi; Siparislerim'den Adreslerim'e gecmek icin once Hesabim'a donmek
 * gerekiyordu. Giris yapilmamissa hicbir sey cizilmiyor (siparis sorgulama
 * ve favoriler misafire de acik).
 */
const SEKMELER = [
  { href: '/hesabim', ad: 'Hesabım', Icon: LuUser },
  { href: '/siparislerim', ad: 'Siparişlerim', Icon: LuPackage },
  { href: '/adreslerim', ad: 'Adreslerim', Icon: LuMapPin },
  { href: '/favoriler', ad: 'Favorilerim', Icon: LuHeart },
  { href: '/iadelerim', ad: 'İadelerim', Icon: LuRotateCcw },
];

export default function HesapSekmeleri() {
  const yol = usePathname();
  const { musteri } = useMusteri();
  if (!musteri) return null;

  return (
    <nav aria-label="Hesap" className="-mx-4 px-4 mb-5 flex gap-2 overflow-x-auto scrollbar-hide">
      {SEKMELER.map(({ href, ad, Icon }) => {
        const secili = yol === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={secili ? 'page' : undefined}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold border transition-colors ${
              secili
                ? 'bg-[#CC4E00] border-[#CC4E00] text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:border-orange-200 hover:text-[#BA4700]'
            }`}
          >
            <Icon size={15} /> {ad}
          </Link>
        );
      })}
    </nav>
  );
}
