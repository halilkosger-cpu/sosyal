'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { m, useReducedMotion } from 'framer-motion';
import { HarvestBadge, type HarvestSeasonType } from './HarvestFilter';

export interface ProductCardProps {
  /** Ürün benzersiz kimliği */
  id?: string;
  /** Ürün adı */
  name: string;
  /** Ürün satış fiyatı (TL) */
  price: number;
  /** Ürün statik kapak görseli yolu */
  imageUrl: string;
  /** Hover durumunda lazy load edilecek WebM önizleme videosu */
  videoUrl?: string;
  /** Ürün detay sayfası slug'ı */
  slug?: string;
  /** Shared Element Transition için Framer Motion benzersiz layoutId değeri */
  layoutId?: string;
  /** LCP optimizasyonu: Görseli öncelikli yükle (fetchPriority="high" & loading="eager") */
  priority?: boolean;
  /**
   * Hover anında video yükleme gecikmesi (ms). Hızlı fare geçişlerinde main thread/decoder
   * tıkanmasını önler. Varsayılan: test ortamında 0, üretimde 150
   */
  hoverDelay?: number;
  /** Ürün kategorisi */
  category?: string;
  /** İndirimsiz eski fiyat (varsa) */
  originalPrice?: number;
  /** İndirim yüzdesi (varsa) */
  discountPercentage?: number;
  /** Ortalama puan (1-5) */
  rating?: number;
  /** Değerlendirme sayısı */
  reviewCount?: number;
  /** Stok durumu */
  inStock?: boolean;
  /** Hasat ve dönemsel mahsul rozeti */
  harvestSeason?: HarvestSeasonType;
  /** Ek Tailwind sınıfları */
  className?: string;
  /** Test kimliği */
  'data-testid'?: string;
}

/**
 * ProductCard
 *
 * Modern e-ticaret kartı bileşeni:
 * - LCP Optimizasyonu: `priority={true}` ile ilk ekrandaki kartlarda fetchPriority="high" & loading="eager".
 * - CLS Optimizasyonu: 1:1 aspect-square görsel alanı.
 * - Performans Debounce: `hoverDelay` (150ms) gecikmesi ile hızlı fare gezintilerinde donanım video dekoderi yükünü önler.
 * - WCAG 2.2 Erişilebilirlik: 'useReducedMotion' aktifse video ASLA yüklenmez ve oynatılmaz.
 * - İşyurtları kurumsal renk paleti (#0F2040 lacivert, #FF6000 turuncu).
 */
export default function ProductCard({
  name,
  price,
  imageUrl,
  videoUrl,
  slug,
  layoutId,
  priority = false,
  hoverDelay = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 150,
  category,
  originalPrice,
  discountPercentage,
  rating,
  reviewCount,
  inStock = true,
  harvestSeason,
  className = '',
  'data-testid': testId = 'product-card',
}: ProductCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeLayoutId = layoutId || (slug ? `product-img-${slug}` : undefined);

  // Kart üzerine gelindiğinde: Eğer kullanıcı hareketi azaltmayı seçmediyse ve video linki varsa lazy load başlat
  const handleMouseEnter = () => {
    if (shouldReduceMotion || !videoUrl) return;

    setIsHovered(true);

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    if (isVideoLoaded) {
      if (videoRef.current) {
        videoRef.current.play()?.catch?.(() => {});
      }
    } else {
      if (hoverDelay <= 0) {
        setIsVideoLoaded(true);
      } else {
        // Hızlı fare geçişlerinde gereksiz video decode tetiklenmesini engelleyen 150ms debounce
        hoverTimerRef.current = setTimeout(() => {
          setIsVideoLoaded(true);
        }, hoverDelay);
      }
    }
  };

  // Karttan çıkıldığında videoyu duraklat ve bekleyen debounce zamanlayıcısını temizle
  const handleMouseLeave = () => {
    setIsHovered(false);

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Temizleme: Bileşen unmount olduğunda bekleyen zamanlayıcıyı yok et
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Video DOM'a ilk kez eklendiğinde oynatmayı başlat
  useEffect(() => {
    if (isVideoLoaded && isHovered && videoRef.current) {
      videoRef.current.play()?.catch?.(() => {});
    }
  }, [isVideoLoaded, isHovered]);

  const href = slug ? `/urun/${slug}` : '#';

  const cardContent = (
    <div
      data-testid={testId}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Medya Alanı (Görsel + Lazy WebM Video) */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {/* Statik Ürün Görseli (LCP için priority, Shared Element Transition için m.img) */}
        <m.img
          layoutId={activeLayoutId}
          data-layoutid={activeLayoutId}
          data-priority={priority ? 'true' : 'false'}
          src={imageUrl}
          alt={name}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...({ fetchpriority: priority ? 'high' : 'auto' } as any)}
          className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Lazy Loaded WebM Video (Yalnızca hover anında ve reduced-motion kapalıysa DOM'a girer) */}
        {isVideoLoaded && !shouldReduceMotion && videoUrl && (
          <video
            ref={videoRef}
            data-testid="product-card-video"
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        )}

        {/* Video Canlı Önizleme İndikatörü */}
        {videoUrl && !shouldReduceMotion && (
          <div
            className={`absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide backdrop-blur-md transition-all duration-300 ${
              isHovered && isVideoLoaded
                ? 'bg-[#FF6000] text-white shadow-md shadow-orange-500/20'
                : 'bg-black/40 text-white/90 opacity-80 group-hover:opacity-100'
            }`}
            aria-hidden="true"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isHovered && isVideoLoaded ? 'bg-white animate-ping' : 'bg-white/80'
              }`}
            />
            <span>{isHovered && isVideoLoaded ? 'CANLI' : 'VİDEO'}</span>
          </div>
        )}

        {/* İndirim Rozeti */}
        {discountPercentage && discountPercentage > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-sm">
            %{discountPercentage} İndirim
          </div>
        )}

        {/* Hasat Sezonu Rozeti */}
        {harvestSeason && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <HarvestBadge season={harvestSeason} />
          </div>
        )}
      </div>

      {/* İçerik Alanı */}
      <div className="flex flex-col flex-1 p-4">
        {/* Kategori */}
        {category && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            {category}
          </span>
        )}

        {/* Ürün Adı */}
        <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-[#0F2040] transition-colors">
          {name}
        </h3>

        {/* Değerlendirme Puanı */}
        {rating !== undefined && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-amber-500">
            <span className="font-bold">★ {rating.toFixed(1)}</span>
            {reviewCount !== undefined && (
              <span className="text-gray-400">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Fiyat ve Aksiyon */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-gray-600 line-through">
                {originalPrice.toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </span>
            )}
            <span className="text-base sm:text-lg font-bold text-[#0F2040]">
              {price.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </span>
          </div>

          <button
            type="button"
            disabled={!inStock}
            aria-label={`${name} ürününü sepete ekle`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              inStock
                ? 'bg-[#0F2040] text-white hover:bg-[#FF6000] active:scale-95 shadow-sm hover:shadow'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {inStock ? 'Sepete Ekle' : 'Tükendi'}
          </button>
        </div>
      </div>
    </div>
  );

  if (slug) {
    return (
      <Link href={href} className="block no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6000] rounded-2xl">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
