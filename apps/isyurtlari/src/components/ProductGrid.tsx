'use client';

import React from 'react';
import { m, LazyMotion, domAnimation, AnimatePresence, useReducedMotion, Transition } from 'framer-motion';
import ProductCard, { ProductCardProps } from './ProductCard';

export interface ProductGridProps {
  /**
   * Izgarada listelenecek ürünler dizisi
   */
  products: ProductCardProps[];
  /**
   * Kapsayıcı grid için Tailwind CSS sınıfları
   * Varsayılan: Mobil tek sütun, tablet 2-3, masaüstü 4 sütun
   */
  className?: string;
  /**
   * AnimatePresence animasyon modu.
   * 'popLayout' modu; çıkan elemanları akıştan (flow) çıkararak mutlak konuma (absolute)
   * alır. Bu sayede filtreleme anında kalan elemanların gecikmeden ve çakışmadan
   * yeni grid koordinatlarına 'layout' animasyonuyla kaymasını sağlar.
   */
  mode?: 'popLayout' | 'sync' | 'wait';
  /**
   * LCP optimizasyonu: İlk kaç ürünün priority={true} ile yükleneceği.
   * Varsayılan: 4 (above-the-fold masaüstü görünümü)
   */
  priorityFirstCount?: number;
  /**
   * Özel animasyon geçiş konfigürasyonu (opsiyonel)
   */
  transition?: Transition;
  /**
   * Filtreleme sonucu ürün bulunamadığında gösterilecek boş durum içeriği
   */
  emptyState?: React.ReactNode;
  /**
   * Test kimliği
   */
  'data-testid'?: string;
}

/**
 * ProductGrid - LazyMotion & m.div Mimarili Optimize Edilmiş Ürün Izgarası
 *
 * Performans & Bundle Size İyileştirmeleri:
 * - LCP Optimizasyonu: `priorityFirstCount={4}` ile ilk 4 karta otomatik `priority={true}` aktarılır.
 * - Standart motion bileşenleri yerine hafif m.div proxy bileşenleri kullanır.
 * - `<LazyMotion features={domAnimation} strict>` sağlayıcısı ile donatılarak
 *   çalışma zamanında gereksiz Framer Motion JS yükünü engeller (~%60 bundle tasarrufu).
 * - Hızlı filtrelemelerde animasyon çakışmasını önleyen `AnimatePresence mode="popLayout"`
 *   ve layout/layoutId projeksiyonunu korur.
 */
export default function ProductGrid({
  products,
  className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6',
  mode = 'popLayout',
  priorityFirstCount = 4,
  transition,
  emptyState,
  'data-testid': testId = 'product-grid',
}: ProductGridProps) {
  const shouldReduceMotion = useReducedMotion();

  // Hızlı filtreleme geçişleri için optimize edilmiş yay (spring) fizik ayarı
  const defaultTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : transition || {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.6,
      };

  // Eleman giriş/çıkış varyantları
  const itemVariants = {
    initial: shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: shouldReduceMotion
      ? { opacity: 0 }
      : {
          opacity: 0,
          scale: 0.85,
          transition: { duration: 0.18, ease: 'easeOut' as const },
        },
  };

  if (products.length === 0 && emptyState) {
    return (
      <LazyMotion features={domAnimation} strict>
        <div data-testid={testId} data-presence-mode={mode} className={className}>
          {emptyState}
        </div>
      </LazyMotion>
    );
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        data-testid={testId}
        data-presence-mode={mode}
        data-product-count={products.length}
        className={`relative w-full ${className}`}
      >
        <AnimatePresence mode={mode}>
          {products.map((product, index) => {
            const itemKey = product.id || product.slug || `prod-${index}`;

            return (
              <m.div
                key={itemKey}
                layout={shouldReduceMotion ? false : true}
                initial={itemVariants.initial}
                animate={itemVariants.animate}
                exit={itemVariants.exit}
                transition={defaultTransition}
                data-testid={`product-grid-item-${itemKey}`}
                data-layout={shouldReduceMotion ? 'false' : 'true'}
                data-has-exit="true"
                data-exit-variants={JSON.stringify(itemVariants.exit)}
                className="relative will-change-transform"
              >
                <ProductCard
                  {...product}
                  priority={product.priority !== undefined ? product.priority : index < priorityFirstCount}
                />
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
