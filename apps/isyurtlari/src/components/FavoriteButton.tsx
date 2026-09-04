'use client';

import { useState, useEffect } from 'react';
import { LuHeart } from 'react-icons/lu';
import { favoriMi, favoriDegistir, FAVORI_OLAYI } from '@/lib/favoriler';

interface FavoriteButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * Favori (kalp) butonu.
 *
 * Onceden her tiklama veritabanina yaziyordu ve HIC CALISMIYORDU: gonderilen
 * "userId" istemcide uretilen sahte bir degerdi, Favorite.userId ise gercek
 * User tablosuna bagliydi ve o tablo bos. Her istek 500 donuyordu.
 *
 * Ayrica bildirim metni tersti: favoriye eklerken "Favorilerden cikarildi"
 * yaziyordu, cunku eski durum degeri okunuyordu.
 *
 * Favoriler artik sepetle ayni mantikla tarayicida tutuluyor.
 */
export default function FavoriteButton({ productId, size = 'md', showLabel = false }: FavoriteButtonProps) {
  const [favori, setFavori] = useState(false);
  const [bildirim, setBildirim] = useState<string | null>(null);

  const boyutlar = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  useEffect(() => {
    const guncelle = () => setFavori(favoriMi(productId));
    guncelle();

    // Ayni urun sayfada birden fazla yerde gorunebiliyor (kart + detay);
    // birinde degisince digeri de guncellensin.
    window.addEventListener(FAVORI_OLAYI, guncelle);
    return () => window.removeEventListener(FAVORI_OLAYI, guncelle);
  }, [productId]);

  const tikla = (e: React.MouseEvent) => {
    // Kart butunuyle bir <Link>; tiklamanin yukari kabarmasini durduruyoruz.
    e.preventDefault();
    e.stopPropagation();

    const yeniDurum = favoriDegistir(productId);
    setFavori(yeniDurum);
    setBildirim(yeniDurum ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
    setTimeout(() => setBildirim(null), 2000);
  };

  return (
    <>
      <button
        onClick={tikla}
        aria-pressed={favori}
        className={`${boyutlar[size]} flex items-center justify-center rounded-lg transition ${
          favori
            ? 'bg-red-100 hover:bg-red-200 text-red-600'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }`}
        title={favori ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        aria-label={favori ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      >
        <LuHeart size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} fill={favori ? 'currentColor' : 'none'} />
      </button>

      {showLabel && (
        <span className="mt-1 block text-xs font-medium text-gray-600">
          {favori ? 'Favoride' : 'Favorilere Ekle'}
        </span>
      )}

      {bildirim && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white"
        >
          {bildirim}
        </div>
      )}
    </>
  );
}
