'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuHeart, LuArrowLeft } from 'react-icons/lu';
import { favorileriGetir, favoriyiCikar, FAVORI_OLAYI } from '@/lib/favoriler';
import UrunKarti from '@/components/UrunKarti';

/**
 * Favoriler sayfasi.
 *
 * Onceden /api/favorites'i sahte bir "userId" ile cagiriyordu; o uc gercek
 * User kaydi bekledigi ve sitede musteri hesabi olmadigi icin sayfa hicbir
 * zaman favori gosteremiyordu.
 *
 * Favoriler artik tarayicida (lib/favoriler.ts). Sayfa yalnizca urun
 * kimliklerini okuyup detaylari urun ucundan tamamliyor.
 *
 * Bu sayfa onceden /api/products'i cagirip TUM katalogu indiriyor ve
 * icinden favorileri ayikliyordu: on urun icin yuzlerce urunluk yanit.
 * Artik /api/urunler'e yalnizca favori kimlikleri gonderiliyor; uc hem
 * sadece o urunleri donuyor hem de gonderilen sirayi koruyor.
 */
interface Urun {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  category?: { name: string; slug: string; kdvOrani?: number } | null;
  /** Kampanyali urunlerde indirimli fiyat kartta da gorunsun. */
  campaign?: { discount: number; discountedPrice: number } | null;
  puan?: number | null;
  yorumSayisi?: number;
}


export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Urun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Favori listesi sekmeler arasinda degisebiliyor (FAVORI_OLAYI). Ust
     * uste gelen istekler yaris kazanip eski listeyi ekrana basmasin diye
     * her yuklemenin bir sirasi var; yalnizca en sonuncusu yaziyor.
     */
    let sonIstek = 0;
    let iptal = false;

    const yukle = () => {
      const kimlikler = favorileriGetir();
      const sira = ++sonIstek;

      if (kimlikler.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const adres = `/api/urunler?kimlikler=${encodeURIComponent(kimlikler.join(','))}&adet=${kimlikler.length}`;

      fetch(adres, { cache: 'no-store' })
        .then((res) => res.json())
        .then((veri: { urunler?: Urun[] }) => {
          if (iptal || sira !== sonIstek) return;
          // Sira sunucuda korunuyor: gonderilen kimlik sirasi = favoriye
          // eklenme sirasi.
          setFavorites(Array.isArray(veri?.urunler) ? veri.urunler : []);
          setLoading(false);
        })
        .catch(() => {
          if (iptal || sira !== sonIstek) return;
          setLoading(false);
        });
    };

    yukle();
    window.addEventListener(FAVORI_OLAYI, yukle);
    return () => {
      iptal = true;
      window.removeEventListener(FAVORI_OLAYI, yukle);
    };
  }, []);

  const handleRemoveFavorite = (productId: string) => {
    favoriyiCikar(productId);
    setFavorites((mevcut) => mevcut.filter((u) => u.id !== productId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#BA4700] hover:text-[#8F3700] font-medium mb-4 transition">
            <LuArrowLeft size={18} /> Geri
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <LuHeart size={22} className="text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Favorilerim</h1>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            {loading ? '...' : `${favorites.length} ürün`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6000]"></div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <span className="text-6xl block mb-4">🤍</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Favorileri Boş</h2>
            <p className="text-gray-600 mb-6">Beğendiğin ürünleri buraya kaydet ve daha sonra satın al</p>
            <Link
              href="/"
              className="inline-block bg-[#CC4E00] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#A63F00] transition"
            >
              Ürünleri Gözle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {favorites.map((urun) => (
              <UrunKarti
                key={urun.id}
                urun={urun}
                gorselYuksekligi="h-40"
                gorselBoyutlari="(max-width: 768px) 50vw, 25vw"
                kategoriGoster
                favoriButonu={false}
                sepetButonu
                sarmalaLink={false}
                altAlan={
                  <button
                    onClick={() => handleRemoveFavorite(urun.id)}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-lg transition text-sm"
                  >
                    <LuHeart size={14} fill="currentColor" /> Favorilerden Çıkar
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
