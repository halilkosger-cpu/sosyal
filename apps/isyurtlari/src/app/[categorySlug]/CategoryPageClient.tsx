'use client';

import { useEffect, useState } from 'react';
import PreOrderBadge from '@/components/PreOrderBadge';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { LuShoppingCart, LuHouse, LuX } from 'react-icons/lu';
import FavoriteButton from '@/components/FavoriteButton';
import {
  IconFood,
  IconTextile,
  IconWood,
  IconWeaving,
  IconFurniture,
  IconProductOrigin,
} from '@/components/Icons';

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
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category: { name: string; slug: string };
  campaign?: Campaign;
}

const categoryMeta: Record<string, { Icon: React.ElementType; iconColor: string; bg: string; banner: string; purpose: string; impact: string; imgBg: string; seoTitle: string }> = {
  // Eski slug format
  'gida-urunleri':        { Icon: IconFood,      iconColor: '#15803d', bg: 'bg-green-100',  banner: 'from-emerald-600 to-teal-500',   purpose: 'Beslenme & Aşçılık Eğitimi', impact: 'Aşçılık meslek eğitimi', imgBg: 'from-emerald-200 to-green-100', seoTitle: 'İsyurtları Gıda Ürünleri | Cezaevi Sosyal Girişim' },
  'tekstil-urunleri':     { Icon: IconTextile,   iconColor: '#1d4ed8', bg: 'bg-blue-100',   banner: 'from-blue-600 to-indigo-500',    purpose: 'Derzillik Meslek Eğitimi', impact: 'Tekstil üretim becerisi', imgBg: 'from-blue-200 to-indigo-100', seoTitle: 'İsyurtları Tekstil Ürünleri | Hapishane Eğitim Ürünleri' },
  'ahsap-urunler':        { Icon: IconWood,      iconColor: '#b45309', bg: 'bg-amber-100',  banner: 'from-amber-600 to-yellow-500',   purpose: 'Marangozluk Beceri Programı', impact: 'Marangozluk eğitimi', imgBg: 'from-amber-200 to-yellow-100', seoTitle: 'İsyurtları Ahşap Ürünleri | Cezaevi Marangozluk' },
  'dokuma':               { Icon: IconWeaving,   iconColor: '#7e22ce', bg: 'bg-purple-100', banner: 'from-violet-600 to-purple-500',  purpose: 'Dokuma & Sanat Terapisi', impact: 'Dokuma ve sanat terapisi', imgBg: 'from-violet-200 to-purple-100', seoTitle: 'İsyurtları Dokuma Ürünleri | Hapishane El Sanatları' },
  'mobilya-urunleri':     { Icon: IconFurniture, iconColor: '#be123c', bg: 'bg-rose-100',   banner: 'from-rose-600 to-pink-500',      purpose: 'Mobilya Tasarım Eğitimi', impact: 'Mobilya tasarım eğitimi', imgBg: 'from-rose-200 to-pink-100', seoTitle: 'İsyurtları Mobilya Ürünleri | Cezaevi Tasarım' },
  'demir-metal-urunleri': { Icon: IconFurniture, iconColor: '#334155', bg: 'bg-slate-100',  banner: 'from-slate-600 to-gray-500',     purpose: 'Metal İşleri Ustası Programı', impact: 'Metal işleri eğitimi', imgBg: 'from-slate-200 to-gray-100', seoTitle: 'İsyurtları Metal Ürünleri | Hapishane Ustası' },
  // Yeni slug format (seed script'ten)
  'gida':                 { Icon: IconFood,      iconColor: '#15803d', bg: 'bg-green-100',  banner: 'from-emerald-600 to-teal-500',   purpose: 'Beslenme & Aşçılık Eğitimi', impact: 'Aşçılık meslek eğitimi', imgBg: 'from-emerald-200 to-green-100', seoTitle: 'İsyurtları Gıda Ürünleri | Cezaevi Sosyal Girişim' },
  'tekstil':              { Icon: IconTextile,   iconColor: '#1d4ed8', bg: 'bg-blue-100',   banner: 'from-blue-600 to-indigo-500',    purpose: 'Derzillik Meslek Eğitimi', impact: 'Tekstil üretim becerisi', imgBg: 'from-blue-200 to-indigo-100', seoTitle: 'İsyurtları Tekstil Ürünleri | Hapishane Eğitim' },
  'ahsap':                { Icon: IconWood,      iconColor: '#b45309', bg: 'bg-amber-100',  banner: 'from-amber-600 to-yellow-500',   purpose: 'Marangozluk Beceri Programı', impact: 'Marangozluk eğitimi', imgBg: 'from-amber-200 to-yellow-100', seoTitle: 'İsyurtları Ahşap Ürünleri | Cezaevi Marangozluk' },
  'temizlik':             { Icon: IconWeaving,   iconColor: '#0891b2', bg: 'bg-cyan-100',   banner: 'from-cyan-600 to-blue-500',      purpose: 'Temizlik & Kozmetik Eğitimi', impact: 'Kozmetik üretim eğitimi', imgBg: 'from-cyan-200 to-blue-100', seoTitle: 'İsyurtları Temizlik Ürünleri | Hapishane Kozmetik' },
  'hediyelik':            { Icon: IconWeaving,   iconColor: '#dc2626', bg: 'bg-red-100',    banner: 'from-red-600 to-pink-500',      purpose: 'El Sanatları & Tasarım', impact: 'El sanatları becerisi', imgBg: 'from-red-200 to-pink-100', seoTitle: 'İsyurtları Hediyelik Ürünler | Cezaevi El Sanatları' },
  'peyzaj-cicek':         { Icon: IconWood,      iconColor: '#059669', bg: 'bg-green-100',  banner: 'from-green-600 to-emerald-500',  purpose: 'Peyzaj & Çiçek Tasarımı', impact: 'Peyzaj tasarım eğitimi', imgBg: 'from-green-200 to-emerald-100', seoTitle: 'İsyurtları Peyzaj & Çiçek | Hapishane Tasarım' },
};

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name';

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.categorySlug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('default');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/products?category=${categorySlug}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [categorySlug]);

  // Update page title with mission messaging
  useEffect(() => {
    if (products.length > 0) {
      const categoryName = products[0]?.category.name ?? 'Ürünler';
      document.title = `${categoryName} | Sosyal Girişim`;
    }
  }, [products]);

  // Calculate max price from products with price (minimum 5000 TL)
  const maxPriceAvailable = products.length > 0 ? Math.max(...products.filter(p => p.price > 0).map(p => p.price), 5000) : 5000;

  // Apply filters
  const filtered = products.filter((product) => {
    // Price filter
    if (product.price > 0 && (product.price < minPrice || product.price > maxPrice)) {
      return false;
    }
    // Stock filter
    if (stockFilter === 'in-stock' && product.quantity === 0) return false;
    if (stockFilter === 'out-of-stock' && product.quantity > 0) return false;
    return true;
  });

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'name') return a.name.localeCompare(b.name, 'tr');
    return 0;
  });

  const meta = categoryMeta[categorySlug];
  const Icon = meta?.Icon ?? IconProductOrigin;
  const categoryName = products[0]?.category.name ?? 'Ürünler';

  // Initialize max price on first load
  useEffect(() => {
    if (products.length > 0 && maxPrice === 5000 && maxPriceAvailable > 5000) {
      setMaxPrice(Math.ceil(maxPriceAvailable * 1.2));
    }
  }, [products, maxPriceAvailable]);

  return (
    <div className="store-shell">

      {/* ─── CATEGORY BANNER ─── */}
      <div className={`bg-gradient-to-r ${meta?.banner ?? 'from-gray-600 to-gray-500'} text-white`}>
        <div className="max-w-screen-xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <Link href="/" className="hover:text-white flex items-center gap-1 transition-colors">
              <LuHouse size={14} />
              Ana Sayfa
            </Link>
            <span>/</span>
            <span className="text-white font-medium">{loading ? '...' : categoryName}</span>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
              <Icon className="w-20 h-20 object-contain drop-shadow-md" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold">{loading ? '...' : categoryName}</h1>
              <p className="text-white/90 text-sm mt-2 font-medium">
                {meta?.purpose || 'Meslek Eğitim Programı'} • İsyurtları Cezaevi Ürünleri
              </p>
              <p className="text-white/70 text-sm mt-1">
                {loading ? '' : `${products.length} cezaevi hükümlüsü tarafından el yapımı, doğal ürün`}
              </p>
            </div>
          </div>

          {/* Mission Message */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white text-sm leading-relaxed">
              <span className="font-semibold">Bu kategorideki her satın alma:</span> Cezaevi ve hapishane hükümlülerinin {meta?.purpose?.toLowerCase() || 'meslek eğitimi'}ne destek olur, rehabilitasyon ve topluma yeniden kazanılmalarında kilit rol oynar. İsyurtları sosyal girişim ürünleri satın alarak insani dönüşüme katkı sağlayın.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">

        {/* ─── INFO BANNER ─── */}
        {!loading && products.length > 0 && (
          <div className="mb-6 bg-white border border-orange-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-[#CC4E00]">Sosyal etki:</span> İsyurtları'ndan cezaevi ve hapishane hükümlülerinin ürünlerini satın aldığınızda, {meta?.purpose?.toLowerCase() || 'meslek eğitimi'} alan insanların rehabilitasyonuna ve topluma yeniden kazanılmasına direkt katkı sağlıyorsunuz. Türkiye'de sosyal girişim ile fark yaratın.
            </p>
          </div>
        )}

        {/* ─── MAIN LAYOUT: FILTERS + PRODUCTS ─── */}
        <div className="flex gap-6">

          {/* ─── FILTER PANEL (Desktop + Mobile) ─── */}
          <div className={`
            ${mobileFiltersOpen ? 'fixed inset-0 z-50 bg-black/50' : 'hidden md:block'}
            md:relative md:bg-transparent md:z-auto
          `}>
            <div className={`
              ${mobileFiltersOpen ? 'fixed top-0 left-0 right-0 bottom-0 bg-white overflow-y-auto' : ''}
              md:relative md:bg-white md:h-auto md:overflow-visible
              md:w-64 flex-shrink-0 rounded-xl border border-gray-200 p-6
            `}>
              {/* Close button (mobile only) */}
              {mobileFiltersOpen && (
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="absolute top-4 right-4 md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <LuX size={20} />
                </button>
              )}

              <h3 className="text-lg font-bold text-gray-900 mb-6">Filtrele</h3>

              {/* ─── PRICE FILTER ─── */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Fiyat Aralığı</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-600 block mb-2">
                      Min: <span className="font-bold text-gray-900">₺{minPrice.toFixed(0)}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={maxPriceAvailable}
                      value={minPrice}
                      onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6000]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-2">
                      Max: <span className="font-bold text-gray-900">₺{maxPrice.toFixed(0)}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={maxPriceAvailable}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6000]"
                    />
                  </div>
                </div>
              </div>

              {/* ─── STOCK FILTER ─── */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Stok Durumu</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="stock"
                      value="all"
                      checked={stockFilter === 'all'}
                      onChange={() => setStockFilter('all')}
                      className="w-4 h-4 text-[#FF6000] cursor-pointer accent-[#FF6000]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Tümü</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="stock"
                      value="in-stock"
                      checked={stockFilter === 'in-stock'}
                      onChange={() => setStockFilter('in-stock')}
                      className="w-4 h-4 text-[#FF6000] cursor-pointer accent-[#FF6000]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Stokta Var</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="stock"
                      value="out-of-stock"
                      checked={stockFilter === 'out-of-stock'}
                      onChange={() => setStockFilter('out-of-stock')}
                      className="w-4 h-4 text-[#FF6000] cursor-pointer accent-[#FF6000]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Tükendi</span>
                  </label>
                </div>
              </div>

              {/* Reset filters button */}
              <button
                onClick={() => {
                  setMinPrice(0);
                  setMaxPrice(5000);
                  setStockFilter('all');
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>

          {/* ─── PRODUCTS SECTION ─── */}
          <div className="flex-1">
            {/* ─── MOBILE FILTER BUTTON + SORT BAR ─── */}
            <div className="flex items-center justify-between gap-3 mb-5 bg-white rounded-xl border border-gray-200 px-4 py-3">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="md:hidden flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtrele
              </button>

              <p className="text-sm text-gray-500 font-medium hidden md:block flex-1">
                {loading ? '' : <><span className="text-gray-900 font-bold">{sorted.length}</span> ürün</>}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden sm:inline">Sırala:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-[#FF6000] cursor-pointer"
                >
                  <option value="default">Varsayılan</option>
                  <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
                  <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
                  <option value="name">İsim: A-Z</option>
                </select>
              </div>
            </div>

            {/* ─── LOADING ─── */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`bg-gradient-to-br ${meta?.imgBg ?? 'from-orange-100 to-amber-100'} rounded-xl h-72 animate-pulse`} />
                ))}
              </div>
            )}

            {/* ─── EMPTY ─── */}
            {!loading && filtered.length === 0 && products.length === 0 && (
              <div className="bg-white rounded-2xl p-16 text-center col-span-full">
                <Icon className="w-24 h-24 object-contain mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Bu kategoride henüz ürün bulunmamaktadır</h3>
                <p className="text-gray-400 mb-2">Sosyal Girişim'in eğitim programları devam etmektedir.</p>
                <p className="text-gray-400 mb-6">Yakında bu kategoride el yapımı ürünler eklenecek.</p>
                <Link href="/" className="bg-[#FF6000] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#e55500] transition-colors">
                  Diğer Kategorileri Keşfet
                </Link>
              </div>
            )}

            {/* ─── NO RESULTS WITH FILTERS ─── */}
            {!loading && filtered.length === 0 && products.length > 0 && (
              <div className="bg-white rounded-2xl p-12 text-center col-span-full">
                <span className="text-5xl block mb-4">🔍</span>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Filtrelerinizi eşleşen ürün bulunamadı</h3>
                <p className="text-gray-400 mb-6">Lütfen filtrelerinizi ayarlayıp yeniden deneyin.</p>
                <button
                  onClick={() => {
                    setMinPrice(0);
                    setMaxPrice(5000);
                    setStockFilter('all');
                  }}
                  className="text-[#FF6000] font-medium hover:text-[#e55500] transition-colors"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}

            {/* ─── PRODUCT GRID ─── */}
            {!loading && sorted.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((product) => (
              <Link
                key={product.id}
                href={`/urun/${product.slug}`}
                className="group store-card store-card-hover rounded-2xl overflow-hidden flex flex-col"
              >
                {/* Image */}
                <div className={`relative h-48 bg-gradient-to-br ${meta?.imgBg ?? 'from-orange-100 to-amber-100'} flex items-center justify-center overflow-hidden`}>
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading="lazy"
                      quality={70}
                      placeholder="empty"
                    />
                  ) : (
                    <Icon className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-300" />
                  )}

                  {product.quantity === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Tükendi</span>
                        <PreOrderBadge />
                      </div>
                    </div>
                  )}
                  {product.quantity > 0 && (
                    <span className="absolute top-2 left-2 bg-[#FF6000] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Stokta
                    </span>
                  )}

                  {/* Campaign Badge */}
                  {product.campaign && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      %{product.campaign.discount} İndirim
                    </span>
                  )}

                  {/* Impact Badge */}
                  <span className="absolute bottom-2 right-2 bg-[#0F2040] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full max-w-[150px] line-clamp-2">
                    {meta?.impact || 'Eğitim desteği'}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 min-h-[2.5rem] group-hover:text-[#FF6000] transition-colors leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3 flex-1 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {product.price > 0 ? (
                      <div className="flex flex-col">
                        {product.campaign ? (
                          <>
                            <span className="text-xs text-gray-400 line-through">₺{product.price.toFixed(2)}</span>
                            <span className="text-lg font-extrabold text-red-600">
                              ₺{product.campaign.discountedPrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-extrabold text-[#FF6000]">
                            ₺{product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Fiyat belirleniyor</span>
                    )}
                    <div className="flex items-center gap-2">
                      <FavoriteButton productId={product.id} size="sm" />
                      <button
                        onClick={(e) => { e.preventDefault(); }}
                        className="w-8 h-8 bg-[#FF6000] hover:bg-[#e55500] text-white rounded-lg flex items-center justify-center transition-colors"
                        aria-label="Sepete ekle"
                      >
                        <LuShoppingCart size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}
