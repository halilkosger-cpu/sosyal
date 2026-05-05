'use client';

import Link from 'next/link';
import { LuArrowLeft, LuHouse, LuSearch } from 'react-icons/lu';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[#FF6000] opacity-10 mb-4">404</h1>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Sayfa Bulunamadı</h2>
          <p className="text-lg text-gray-600">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        </div>

        {/* Icon */}
        <div className="mb-8">
          <div className="inline-block bg-white rounded-full p-6 shadow-lg">
            <LuSearch size={48} className="text-[#FF6000]" />
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          Üzgünüz, aradığınız sayfaya ulaşamadık. Lütfen aşağıdaki bağlantılardan birine tıklayarak devam edin.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#FF6000] hover:bg-[#CC4E00] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <LuHouse size={18} />
            Ana Sayfa
          </Link>
          <Link
            href="/ara"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 py-3 rounded-lg border border-gray-200 transition-colors"
          >
            <LuSearch size={18} />
            Ürün Ara
          </Link>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-2 text-[#FF6000] hover:text-[#CC4E00] font-medium transition-colors"
        >
          <LuArrowLeft size={18} />
          Geri Dön
        </button>
      </div>
    </div>
  );
}
