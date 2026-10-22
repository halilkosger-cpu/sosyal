'use client';

import React from 'react';

export interface ProductCardSkeletonProps {
  /**
   * Kartın kompakt boyutta olup olmadığı (mobil veya kenar çubuğu görünümleri için)
   */
  kompakt?: boolean;
  /**
   * Görsel alanının en-boy oranı veya yüksekliği. Gerçek ProductCard ile 1:1 piksel hizalanarak CLS önler.
   * Varsayılan: 'aspect-square'
   */
  imageHeight?: string;
  /**
   * Ek Tailwind sınıfları
   */
  className?: string;
  /**
   * Test kimliği
   */
  'data-testid'?: string;
}

/**
 * ProductCardSkeleton
 *
 * Gerçek ProductCard bileşeniyle 1:1 piksel ve aspect-square uyumlu,
 * CLS (Cumulative Layout Shift) puanını sıfırda tutan, Tailwind animate-pulse tabanlı iskelet kart.
 */
export default function ProductCardSkeleton({
  kompakt = false,
  imageHeight = 'aspect-square',
  className = '',
  'data-testid': testId = 'product-card-skeleton',
}: ProductCardSkeletonProps) {
  const containerClasses = kompakt
    ? `group bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col animate-pulse ${className}`
    : `group bg-white rounded-2xl overflow-hidden border border-gray-200 flex flex-col animate-pulse ${className}`;

  return (
    <div data-testid={testId} className={containerClasses}>
      {/* Görsel Alanı: Gerçek karttaki h-44 ve relative yapı ile birebir eşleşir */}
      <div
        data-testid="skeleton-image-container"
        className={`relative ${imageHeight} w-full bg-gray-200 overflow-hidden flex items-center justify-center`}
      >
        {/* Rozet Placeholder */}
        <div className="absolute top-2 left-2 h-4 w-14 bg-gray-300 rounded shadow-sm" />
      </div>

      {/* Gövde Alanı: p-3.5 flex flex-col flex-1 */}
      <div
        data-testid="skeleton-body-container"
        className={kompakt ? 'p-3 flex flex-col flex-1' : 'p-3.5 flex flex-col flex-1'}
      >
        {/* Kategori Satırı Placeholder */}
        <div className="h-2.5 w-16 bg-gray-200 rounded mb-2.5" />

        {/* Ürün Başlığı Placeholder (2 satır) */}
        <div className="space-y-1.5 mb-2.5 min-h-[2.5rem]">
          <div className="h-3.5 w-5/6 bg-gray-200 rounded" />
          <div className="h-3.5 w-3/5 bg-gray-200 rounded" />
        </div>

        {/* Yıldız & Yorum Satırı Placeholder */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-2.5 w-6 bg-gray-200 rounded" />
        </div>

        {/* Fiyat ve Buton Alt Alanı */}
        <div className="pt-2 mt-auto border-t border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-2.5 w-10 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded" />
          </div>
          <div className="h-8 w-14 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export interface ProductGridSkeletonProps {
  /**
   * Render edilecek iskelet kart adedi (Varsayılan: 8)
   */
  count?: number;
  /**
   * Kartların kompakt görünümü
   */
  kompakt?: boolean;
  /**
   * Görsel yüksekliği
   */
  imageHeight?: string;
  /**
   * Grid kapsayıcısı Tailwind sınıfları
   */
  className?: string;
  /**
   * Test kimliği
   */
  'data-testid'?: string;
}

/**
 * ProductGridSkeleton
 *
 * Ürün listeleme sayfaları (Kategori, Arama, Kampanya) için
 * responsive ızgara iskeleti.
 */
export function ProductGridSkeleton({
  count = 8,
  kompakt = false,
  imageHeight = 'aspect-square',
  className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6',
  'data-testid': testId = 'product-grid-skeleton',
}: ProductGridSkeletonProps) {
  return (
    <div data-testid={testId} className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton
          key={idx}
          kompakt={kompakt}
          imageHeight={imageHeight}
        />
      ))}
    </div>
  );
}
