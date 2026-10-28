'use client';

import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { useCartDrawer } from '../context/CartDrawerContext';

export interface PushBackLayoutProps {
  children: React.ReactNode;
  /** Ek Tailwind sınıfları */
  className?: string;
  /** Test kimliği */
  'data-testid'?: string;
}

/**
 * PushBackLayout
 *
 * Sepet açıldığında (isCartOpen=true) tüm sayfa içeriğini geriye doğru iten
 * (scale: 0.95, borderRadius: 24px, opacity: 0.85), transformOrigin='top center'
 * kullanarak düzen kaymasını (CLS) sıfırda tutan Framer Motion sarmalayıcısı.
 *
 * Erişilebilirlik: useReducedMotion aktifse ölçekleme efekti iptal edilerek scale: 1 korunur.
 */
export default function PushBackLayout({
  children,
  className = '',
  'data-testid': testId = 'push-back-main',
}: PushBackLayoutProps) {
  const { isCartOpen, closeCart } = useCartDrawer();
  const shouldReduceMotion = useReducedMotion();

  // Animasyon değerleri
  const targetScale = shouldReduceMotion ? 1 : isCartOpen ? 0.95 : 1;
  const targetBorderRadius = shouldReduceMotion ? '0px' : isCartOpen ? '24px' : '0px';
  const targetOpacity = shouldReduceMotion ? 1 : isCartOpen ? 0.85 : 1;

  return (
    <div className="relative w-full min-h-screen bg-neutral-900 overflow-x-hidden">
      <m.div
        data-testid={testId}
        data-is-cart-open={isCartOpen ? 'true' : 'false'}
        data-scale={targetScale.toString()}
        data-border-radius={targetBorderRadius}
        data-opacity={targetOpacity.toString()}
        data-reduced-motion={shouldReduceMotion ? 'true' : 'false'}
        initial={false}
        animate={{
          scale: targetScale,
          borderRadius: targetBorderRadius,
          opacity: targetOpacity,
        }}
        transition={{
          type: 'spring',
          damping: 26,
          stiffness: 280,
          mass: 0.6,
        }}
        style={{
          transformOrigin: 'top center',
        }}
        className={`relative w-full min-h-screen bg-white overflow-hidden shadow-2xl ${isCartOpen ? 'will-change-transform' : ''} ${className}`}
      >
        {children}

        {/* Sepet açıkken ana sayfaya tıklandığında sepeti kapatan karartma katmanı */}
        {isCartOpen && (
          <div
            data-testid="push-back-overlay"
            onClick={closeCart}
            aria-label="Sepeti kapat"
            className="absolute inset-0 z-30 bg-black/20 backdrop-blur-[1px] transition-opacity cursor-pointer"
          />
        )}
      </m.div>
    </div>
  );
}
