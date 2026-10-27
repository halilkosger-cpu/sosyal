'use client';

import Link from 'next/link';
import KategoriIkon from './KategoriIkon';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

/**
 * Mobil Kategori Şeridi (Thumb-Zone Ergonomisi - Instagram / Trendyol Hikaye Stili)
 * Mobilde ilk ekranda parmakla yatay kaydırılabilir, tek dokunuşla kategoriye yönlendirir.
 */
export default function MobilKategoriSeridi({ categories }: { categories: CategoryItem[] }) {
  if (!categories || categories.length === 0) return null;

  return (
    <nav
      aria-label="Hızlı Kategoriler"
      className="md:hidden bg-white border-b border-gray-100 py-2.5 px-3"
    >
      <div
        className="flex items-center gap-3.5 overflow-x-auto scrollbar-hide py-1 px-1 -mx-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Özel: Hediye Kutusu Yap */}
        <Link
          href="/hediye-kutusu-yap"
          className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
        >
          <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#FF6000] via-[#BA4700] to-amber-500 shadow-xs group-active:scale-95 transition-transform">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl">
              <span>🎁</span>
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
          </div>
          <span className="text-[11px] font-bold text-[#BA4700] tracking-tight whitespace-nowrap">
            Kutu Yap
          </span>
        </Link>

        {/* Kategoriler */}
        {categories.map((cat) => (
          <Link
            key={cat.id || cat.slug}
            href={`/${cat.slug}`}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gray-100 group-hover:bg-orange-100 border border-gray-200/80 group-active:scale-95 transition-all shadow-xs flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-2">
                <KategoriIkon slug={cat.slug} imageUrl={cat.imageUrl} className="w-9 h-9 object-contain" />
              </div>
            </div>
            <span className="text-[11px] font-semibold text-gray-700 group-hover:text-[#BA4700] tracking-tight whitespace-nowrap max-w-[68px] truncate text-center">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
