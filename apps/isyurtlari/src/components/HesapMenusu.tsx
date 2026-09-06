'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuUser, LuPackage, LuHeart, LuMapPin, LuRotateCcw, LuLogOut } from 'react-icons/lu';
import { cikisYap, useMusteri } from '@/lib/musteri-istemci';

/**
 * Baslik cubugundaki hesap girisi.
 *
 * Onceden buradaki "Platform" baglantisi cezaevinden.com'a gidiyordu ve
 * sitede musteri hesabi diye bir sey yoktu. Artik giris yapmamis ziyaretciyi
 * /giris'e, giris yapmis musteriyi kendi hesabina goturuyor.
 */
export default function HesapMenusu() {
  const { musteri, yukleniyor } = useMusteri();
  const [acik, setAcik] = useState(false);
  const router = useRouter();
  const sarmalayici = useRef<HTMLDivElement>(null);

  // Menu disina tiklayinca ve Esc ile kapaniyor.
  useEffect(() => {
    if (!acik) return;

    const disariTiklama = (olay: MouseEvent) => {
      if (!sarmalayici.current?.contains(olay.target as Node)) setAcik(false);
    };
    const tusa = (olay: KeyboardEvent) => {
      if (olay.key === 'Escape') setAcik(false);
    };

    document.addEventListener('mousedown', disariTiklama);
    document.addEventListener('keydown', tusa);
    return () => {
      document.removeEventListener('mousedown', disariTiklama);
      document.removeEventListener('keydown', tusa);
    };
  }, [acik]);

  // Oturum durumu belli olmadan bir sey gostermiyoruz: once "Giriş Yap"
  // gosterip sonra isme donmek basligi ziplatir. Yer ayrilmis kaliyor ki
  // duzen kaymasin.
  if (yukleniyor) {
    return <div className="hidden md:block w-16 flex-shrink-0" aria-hidden="true" />;
  }

  if (!musteri) {
    return (
      <Link
        href="/giris"
        className="hidden md:flex flex-col items-center text-white hover:text-orange-100 transition-colors flex-shrink-0"
      >
        <LuUser className="w-6 h-6 mb-0.5" strokeWidth={2} />
        <span className="text-xs font-semibold">Giriş Yap</span>
      </Link>
    );
  }

  const ilkAd = musteri.name.trim().split(' ')[0];

  return (
    <div ref={sarmalayici} className="relative hidden md:block flex-shrink-0">
      <button
        onClick={() => setAcik((a) => !a)}
        className="flex flex-col items-center text-white hover:text-orange-100 transition-colors"
        aria-haspopup="menu"
        aria-expanded={acik}
      >
        <LuUser className="w-6 h-6 mb-0.5" strokeWidth={2} />
        <span className="text-xs font-semibold max-w-[80px] truncate">{ilkAd}</span>
      </button>

      {acik && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{musteri.name}</p>
            <p className="text-xs text-gray-500 truncate">{musteri.email}</p>
          </div>

          {[
            { href: '/hesabim', Icon: LuUser, metin: 'Hesabım' },
            { href: '/siparislerim', Icon: LuPackage, metin: 'Siparişlerim' },
            { href: '/adreslerim', Icon: LuMapPin, metin: 'Adreslerim' },
            { href: '/iadelerim', Icon: LuRotateCcw, metin: 'İadelerim' },
            { href: '/favoriler', Icon: LuHeart, metin: 'Favorilerim' },
          ].map((madde) => (
            <Link
              key={madde.href}
              href={madde.href}
              onClick={() => setAcik(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#BA4700] transition-colors"
              role="menuitem"
            >
              <madde.Icon size={16} /> {madde.metin}
            </Link>
          ))}

          <button
            onClick={async () => {
              setAcik(false);
              await cikisYap();
              router.push('/');
              router.refresh();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
            role="menuitem"
          >
            <LuLogOut size={16} /> Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
