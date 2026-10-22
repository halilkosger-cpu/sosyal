'use client';

import React from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { ProductCardProps } from './ProductCard';
import SensorySpotlight from './SensorySpotlight';
import PreOrderTimeline from './PreOrderTimeline';

export interface ProductDetailProps extends ProductCardProps {
  /** Detaylı ürün açıklaması */
  description?: string;
  /** Özellikler listesi */
  features?: { label: string; value: string }[];
  /** Sepete ekleme geri çağrımı */
  onAddToCart?: () => void;
  /** Gıda veya el sanatı ürünleri için organik iç doku / hasat görseli */
  storyImage?: string;
  /** Duyusal hasat rozet metni */
  storyBadge?: string;
  /** Ön sipariş aşama indeksi (0-4) */
  currentStepIndex?: number;
  /** Ön sipariş başlangıç tarihi */
  orderDate?: Date | string;
  /** Ön sipariş olası atölye gecikmesi */
  hasDelay?: boolean | number;
}

/**
 * ProductDetail - Ürün Detay Sayfası Ana Görsel ve Bilgi Bileşeni
 *
 * - Framer Motion Shared Element Transition (layoutId) ile ProductCard'dan gelen
 *   ürün görseliyle eşleşerek pürüzsüz büyütme/küçültme geçişi sağlar.
 * - Gıda ve zanaat ürünlerinde `storyImage` sağlandığında, `SensorySpotlight` bileşeniyle
 *   iç dokuyu veya hasat anını ortaya çıkaran interaktif duyusal maske sunar.
 * - Stokta olmayan ürünlerde (`inStock: false`), atölye üretim sürecini ve tahmini teslimat
 *   tarihini gösteren `PreOrderTimeline` çizelgesini entegre eder.
 * - LazyMotion (domAnimation) ile minimum JS paket yükü ve 60fps GPU performansı sağlar.
 */
export default function ProductDetail({
  name,
  price,
  imageUrl,
  description,
  category,
  inStock = true,
  layoutId,
  slug,
  rating,
  reviewCount,
  features,
  onAddToCart,
  storyImage,
  storyBadge,
  currentStepIndex = 0,
  orderDate,
  hasDelay,
  className = '',
  'data-testid': testId = 'product-detail',
}: ProductDetailProps) {
  const activeLayoutId = layoutId || (slug ? `product-img-${slug}` : undefined);

  return (
    <LazyMotion features={domAnimation}>
      <div
        data-testid={testId}
        className={`max-w-6xl mx-auto px-4 py-8 bg-white rounded-3xl ${className}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Sol Alan: Shared Element Geçişli Görsel veya Duyusal Maske (SensorySpotlight) */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
            {storyImage ? (
              <SensorySpotlight
                packageImage={imageUrl}
                storyImage={storyImage}
                packageAlt={name}
                storyAlt={`${name} - Hasat ve İç Doku`}
                storyBadge={storyBadge}
                className="w-full h-full"
              />
            ) : (
              <m.img
                layoutId={activeLayoutId}
                data-layoutid={activeLayoutId}
                data-testid="product-detail-image"
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Sağ Alan: Ürün Detay Bilgileri ve Aksiyonlar */}
          <div className="flex flex-col">
            {category && (
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {category}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-snug">
              {name}
            </h1>

            {rating !== undefined && (
              <div className="flex items-center gap-1.5 mb-4 text-sm text-amber-500">
                <span className="font-bold">★ {rating.toFixed(1)}</span>
                {reviewCount !== undefined && (
                  <span className="text-gray-400">({reviewCount} Değerlendirme)</span>
                )}
              </div>
            )}

            <div className="text-3xl font-bold text-[#0F2040] mb-6">
              {price.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </div>

            {description && (
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
                {description}
              </p>
            )}

            {features && features.length > 0 && (
              <div className="border-t border-b border-gray-100 py-4 mb-6 space-y-2">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-500">{feat.label}:</span>
                    <span className="font-medium text-gray-800">{feat.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={!inStock}
              onClick={onAddToCart}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 ${
                inStock
                  ? 'bg-[#0F2040] text-white hover:bg-[#FF6000] active:scale-[0.99] shadow-lg shadow-gray-200 hover:shadow-orange-500/20'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {inStock ? 'Sepete Ekle' : 'Stokta Bulunmuyor'}
            </button>
          </div>
        </div>

        {/* Stokta Olmadığında: Ön Sipariş & Atölye İlerleme Çizelgesi */}
        {!inStock && (
          <div className="mt-10 pt-8 border-t border-gray-100">
            <PreOrderTimeline
              currentStepIndex={currentStepIndex}
              orderDate={orderDate}
              hasDelay={hasDelay}
            />
          </div>
        )}
      </div>
    </LazyMotion>
  );
}
