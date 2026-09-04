'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuHeart, LuShoppingCart, LuArrowLeft } from 'react-icons/lu';
import { favorileriGetir, favoriyiCikar, FAVORI_OLAYI } from '@/lib/favoriler';
import { sepeteEkle } from '@/lib/cart';

/**
 * Favoriler sayfasi.
 *
 * Onceden /api/favorites'i sahte bir "userId" ile cagiriyordu; o uc gercek
 * User kaydi bekledigi ve sitede musteri hesabi olmadigi icin sayfa hicbir
 * zaman favori gosteremiyordu.
 *
 * Favoriler artik tarayicida (lib/favoriler.ts). Sayfa yalnizca urun
 * kimliklerini okuyup detaylari acik urun ucundan tamamliyor.
 */
interface Urun {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  category?: { name: string; slug: string };
}

const productEmojis: Record<string, string> = {
  'badem': '🌰', 'biber-receli': '🫙', 'peynir': '🧀', 'pirinc': '🍚',
  'tereyag': '🧈', 'zeytinyag': '🫒', 'havlu-beyaz': '🛁', 'ahsap-sandalye': '🪑',
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Urun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const yukle = () => {
      const kimlikler = favorileriGetir();
      if (kimlikler.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      fetch('/api/products')
        .then((res) => res.json())
        .then((veri: Urun[]) => {
          const hepsi = Array.isArray(veri) ? veri : [];
          // Sirasi favoriye eklenme sirasini korusun
          setFavorites(
            kimlikler
              .map((id) => hepsi.find((u) => u.id === id))
              .filter((u): u is Urun => Boolean(u))
          );
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    yukle();
    window.addEventListener(FAVORI_OLAYI, yukle);
    return () => window.removeEventListener(FAVORI_OLAYI, yukle);
  }, []);

  const handleRemoveFavorite = (productId: string) => {
    favoriyiCikar(productId);
    setFavorites((mevcut) => mevcut.filter((u) => u.id !== productId));
  };

  const handleAddToCart = (product: Urun) => {
    // lib/cart.ts stok/fiyat kontrolunu yapiyor ve GA olayini gonderiyor
    sepeteEkle({
      id: product.id,
      name: product.name,
      price: product.price,
      slug: product.slug,
      imageUrl: product.imageUrl,
      quantity: product.quantity,
    });
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
              <div key={urun.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col">
                {/* Image */}
                <div className="relative h-40 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center overflow-hidden">
                  {urun.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urun.imageUrl}
                      alt={urun.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">{productEmojis[urun.slug] ?? '📦'}</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                    {urun.category?.name ?? 'Ürün'}
                  </p>
                  <Link
                    href={`/urun/${urun.slug}`}
                    className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-[#BA4700] transition mb-3"
                  >
                    {urun.name}
                  </Link>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                    {urun.price > 0 ? (
                      <span className="text-lg font-bold text-[#BA4700]">₺{urun.price.toFixed(2)}</span>
                    ) : (
                      <span className="text-xs italic text-gray-400">Fiyat belirleniyor</span>
                    )}
                    {/* Stogu veya fiyati olmayan urun sepete eklenemez */}
                    {urun.quantity > 0 && urun.price > 0 ? (
                      <button
                        onClick={() => handleAddToCart(urun)}
                        className="w-8 h-8 bg-[#CC4E00] hover:bg-[#A63F00] text-white rounded-lg flex items-center justify-center transition"
                        title="Sepete ekle"
                        aria-label={urun.name + ' sepete ekle'}
                      >
                        <LuShoppingCart size={15} strokeWidth={2} />
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-red-600">
                        {urun.quantity > 0 ? '' : 'Tükendi'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveFavorite(urun.id)}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-lg transition text-sm"
                  >
                    <LuHeart size={14} fill="currentColor" /> Favorilerden Çıkar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
