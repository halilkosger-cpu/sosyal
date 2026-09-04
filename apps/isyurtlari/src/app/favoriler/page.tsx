'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuHeart, LuShoppingCart, LuArrowLeft } from 'react-icons/lu';

interface Favorite {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl?: string;
    category: { name: string; slug: string };
  };
}

const productEmojis: Record<string, string> = {
  'badem': '🌰', 'biber-receli': '🫙', 'peynir': '🧀', 'pirinc': '🍚',
  'tereyag': '🧈', 'zeytinyag': '🫒', 'havlu-beyaz': '🛁', 'ahsap-sandalye': '🪑',
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Simulated user (future: from session/auth)
    const mockUserId = localStorage.getItem('userId') || 'guest-user-' + Date.now();
    setUserId(mockUserId);
    localStorage.setItem('userId', mockUserId);

    // Fetch favorites
    fetch(`/api/favorites?userId=${mockUserId}`)
      .then((res) => res.json())
      .then((data) => {
        setFavorites(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleRemoveFavorite = async (productId: string) => {
    if (!userId) return;

    try {
      await fetch(`/api/favorites?userId=${userId}&productId=${productId}`, {
        method: 'DELETE',
      });
      setFavorites(favorites.filter((f) => f.productId !== productId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleAddToCart = (product: any) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((i: any) => i.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        slug: product.slug,
        imageUrl: product.imageUrl,
        campaign: null,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#CC4E00] hover:text-[#A63F00] font-medium mb-4 transition">
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
            {favorites.map((favorite) => (
              <div key={favorite.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col">
                {/* Image */}
                <div className="relative h-40 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center overflow-hidden">
                  {favorite.product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={favorite.product.imageUrl}
                      alt={favorite.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">{productEmojis[favorite.product.slug] ?? '📦'}</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                    {favorite.product.category.name}
                  </p>
                  <Link
                    href={`/urun/${favorite.product.slug}`}
                    className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-[#CC4E00] transition mb-3"
                  >
                    {favorite.product.name}
                  </Link>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                    <span className="text-lg font-bold text-[#CC4E00]">
                      ₺{favorite.product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(favorite.product)}
                      className="w-8 h-8 bg-[#CC4E00] hover:bg-[#A63F00] text-white rounded-lg flex items-center justify-center transition"
                      title="Sepete ekle"
                    >
                      <LuShoppingCart size={15} strokeWidth={2} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveFavorite(favorite.productId)}
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
