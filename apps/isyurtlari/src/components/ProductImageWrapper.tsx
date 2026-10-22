'use client';

import React from 'react';
import { motion, useReducedMotion, Transition } from 'framer-motion';

export interface ProductImageWrapperProps {
  /**
   * Ürün listesinden detay sayfasına geçiş için benzersiz Shared Element kimliği.
   * Örneğin: `product-image-${product.slug}` veya `product-hero-${product.id}`
   */
  layoutId: string;
  /**
   * Sarmalanacak ürün görseli (ör. next/image veya <img />)
   */
  children: React.ReactNode;
  /**
   * Tailwind CSS sınıfları
   */
  className?: string;
  /**
   * Test veya erişilebilirlik kimliği
   */
  'data-testid'?: string;
  /**
   * Özel geçiş konfigürasyonu (opsiyonel)
   */
  transition?: Transition;
}

/**
 * ProductImageWrapper - Next.js App Router Shared Element Transition Bileşeni
 *
 * Ürün kataloğu (kategori / ana sayfa) ve ürün detay sayfası arasında
 * akıcı görsel geçişi sağlar. İşletim sistemi düzeyinde 'hareketi azalt'
 * (prefers-reduced-motion) aktif olduğunda performansı ve erişilebilirliği
 * korumak için animasyonu anında yüklenecek şekilde devre dışı bırakır.
 */
export default function ProductImageWrapper({
  layoutId,
  children,
  className = '',
  'data-testid': testId = 'product-transition-wrapper',
  transition,
}: ProductImageWrapperProps) {
  const systemReducedMotion = useReducedMotion();

  // İşletim sistemi düzeyinde animasyon kısıtlaması (WCAG 2.2 ve kullanıcı tercihi)
  const isReduced = React.useMemo(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (media?.matches) return true;
    }
    return Boolean(systemReducedMotion);
  }, [systemReducedMotion]);

  // 'Hareketi Azalt' aktifken anında (0ms) yüklenme; kapalıyken pürüzsüz yay / ease geçişi
  const initialVariants = isReduced
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 15 };

  const animateVariants = { opacity: 1, y: 0 };

  const exitVariants = isReduced
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: -15 };

  const defaultTransition: Transition = isReduced
    ? { duration: 0 }
    : transition || {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      };

  return (
    <motion.div
      layoutId={layoutId}
      data-layoutid={layoutId}
      data-testid={testId}
      data-reduced-motion={isReduced ? 'true' : 'false'}
      data-initial={JSON.stringify(initialVariants)}
      data-animate={JSON.stringify(animateVariants)}
      data-exit={JSON.stringify(exitVariants)}
      initial={initialVariants}
      animate={animateVariants}
      exit={exitVariants}
      transition={defaultTransition}
      className={`relative overflow-hidden will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}
