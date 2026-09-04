'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LuArrowLeft, LuStar } from 'react-icons/lu';
import FavoriteButton from '@/components/FavoriteButton';

interface Campaign {
  id: string;
  name: string;
  discount: number;
  discountedPrice: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category: { name: string; slug: string };
  campaign?: Campaign;
}

const productEmojis: Record<string, string> = {
  'badem':'🌰','biber-receli':'🫙','biber-salcasi':'🌶️','domates-salcasi':'🍅',
  'findik':'🥜','incir-receli':'🍓','kuru-baklagil':'🫘','pirinc':'🍚',
  'tereyag':'🧈','yesil-zeytin':'🫒','zeytinyag':'🫒','peynir':'🧀',
  'havlu-beyaz':'🛁','havlu-renkli':'🛁','ahsap-sandalye':'🪑','ahsap-masa':'🪑',
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Arama hatası:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchResults();
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#CC4E00] hover:text-[#cc4e00] font-medium mb-4 transition">
            <LuArrowLeft size={18} /> Geri
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Arama Sonuçları</h1>
          {query && (
            <p className="text-gray-600 text-sm mt-2">
              "<strong>{query}</strong>" için <strong>{products.length}</strong> sonuç bulundu
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {!query ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Arama yapmak için arama çubuğunu kullanın</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              "<strong>{query}</strong>" ile eşleşen ürün bulunamadı
            </p>
            <Link href="/" className="inline-block mt-4 text-[#CC4E00] hover:text-[#cc4e00] font-semibold">
              Ana sayfaya dön
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link key={product.id} href={`/urun/${product.slug}`}
                className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="relative h-44 bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300 select-none">
                      {productEmojis[product.slug] ?? '📦'}
                    </span>
                  )}
                  {product.quantity === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Tükendi</span>
                    </div>
                  )}
                  {product.campaign && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      %{product.campaign.discount}
                    </span>
                  )}
                  {product.quantity > 0 && !product.campaign && (
                    <span className="absolute top-2 right-2 bg-[#CC4E00] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">YENİ</span>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{product.category.name}</p>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-[#CC4E00] transition-colors leading-snug">{product.name}</h3>
                  <div className="flex items-center gap-0.5 mt-1.5 mb-2">
                    {[1,2,3,4,5].map((s) => <LuStar key={s} size={10} fill="#FF6000" color="#FF6000" />)}
                    <span className="text-[10px] text-gray-400 ml-1">5.0</span>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      {product.price > 0 ? (
                        <div>
                          {product.campaign ? (
                            <>
                              <p className="text-xs text-gray-400 line-through tracking-tight">₺{product.price.toFixed(2)}</p>
                              <p className="text-lg font-bold text-red-600 tracking-tight">₺{product.campaign.discountedPrice.toFixed(2)}</p>
                            </>
                          ) : (
                            <p className="text-lg font-bold text-[#CC4E00] tracking-tight">₺{product.price.toFixed(2)}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Fiyat belirleniyor</p>
                      )}
                    </div>
                    <FavoriteButton productId={product.id} size="sm" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
