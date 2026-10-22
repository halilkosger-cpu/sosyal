'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

export interface MagneticButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  /** Manyetik çekim kuvveti çarpanı (0.1 - 0.6 arası, varsayılan: 0.35) */
  strength?: number;
  /** Manyetik etkileşim anında merkez koordinatlarını ve hover durumunu bildiren geri çağrım */
  onMagneticHover?: (data: { centerX: number; centerY: number; isHovered: boolean }) => void;
  /** Ek Tailwind sınıfları */
  className?: string;
  /** Test kimliği */
  'data-testid'?: string;
}

/**
 * MagneticButton - Fareye Doğru Çekilen Manyetik Buton Bileşeni
 *
 * Özellikler:
 * - Fare butonun üzerine geldiğinde (hover) `getBoundingClientRect` ile kendi
 *   geometrik merkezini hesaplar ve imleç ile merkez arasındaki mesafeye göre
 *   butonu fareye doğru yay fiziğiyle (spring physics) çeker.
 * - `CustomCursor` ile senkronize olarak merkez koordinatlarını ve manyetik
 *   etkileşimi iletir.
 * - Erişilebilirlik: `useReducedMotion` aktifse manyetik yer değiştirme
 *   devre dışı kalır (`data-magnetic-active="false"`).
 */
export default function MagneticButton({
  children,
  strength = 0.35,
  onMagneticHover,
  className = '',
  'data-testid': testId = 'magnetic-button',
  onClick,
  disabled,
  ...rest
}: MagneticButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Butonun manyetik kayma mesafeleri
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);

  // Yay fiziği konfigürasyonu
  const springConfig = { damping: 18, stiffness: 220, mass: 0.4 };
  const smoothX = useSpring(offsetX, springConfig);
  const smoothY = useSpring(offsetY, springConfig);

  const notifyMagneticState = (centerX: number, centerY: number, isHovered: boolean) => {
    onMagneticHover?.({ centerX, centerY, isHovered });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cursor:magnetic', {
          detail: { centerX, centerY, isHovered },
        })
      );
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    notifyMagneticState(centerX, centerY, true);

    if (!shouldReduceMotion) {
      const distanceX = (e.clientX - centerX) * strength;
      const distanceY = (e.clientY - centerY) * strength;
      offsetX.set(distanceX);
      offsetY.set(distanceY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shouldReduceMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = (e.clientX - centerX) * strength;
    const distanceY = (e.clientY - centerY) * strength;

    offsetX.set(distanceX);
    offsetY.set(distanceY);
  };

  const handleMouseLeave = () => {
    offsetX.set(0);
    offsetY.set(0);
    notifyMagneticState(0, 0, false);
  };

  return (
    <motion.button
      ref={buttonRef}
      data-testid={testId}
      data-reduced-motion={shouldReduceMotion ? 'true' : 'false'}
      data-magnetic-active={shouldReduceMotion ? 'false' : 'true'}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      style={{
        x: shouldReduceMotion ? 0 : smoothX,
        y: shouldReduceMotion ? 0 : smoothY,
      }}
      className={`relative inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white bg-[#0F2040] hover:bg-[#FF6000] active:scale-95 transition-colors duration-200 shadow-md will-change-transform ${className}`}
      {...rest}
    >
      <span className="relative z-10 pointer-events-none">{children}</span>
    </motion.button>
  );
}
