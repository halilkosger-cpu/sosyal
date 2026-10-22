'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

export interface CustomCursorProps {
  /** İmleç boyutu (piksel, varsayılan: 24) */
  size?: number;
  /** Manyetik etkileşimde genişleme boyutu (piksel, varsayılan: 56) */
  hoverSize?: number;
  /** Ek Tailwind sınıfları */
  className?: string;
  /** Test kimliği */
  'data-testid'?: string;
}

/**
 * CustomCursor - Global Performanslı Özel İmleç Bileşeni
 *
 * Özellikler:
 * - Performans: Re-render maliyetini sıfırlamak için React state yerine
 *   Framer Motion `useMotionValue` ve `useSpring` kullanarak doğrudan
 *   GPU/transform katmanında 60-120fps pürüzsüz takip sağlar.
 * - mix-blend-difference: Sayfa altındaki arka plan ve metin renklerine göre
 *   otomatik zıt renk (invert) efekti üretir.
 * - Erişilebilirlik: `useReducedMotion` aktifse veya dokunmatik cihazlarda
 *   kendini gizler.
 */
export default function CustomCursor({
  size = 24,
  hoverSize = 56,
  className = '',
  'data-testid': testId = 'custom-cursor',
}: CustomCursorProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Koordinatlar için MotionValue'lar (Re-render TETİKLEMEZ)
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Yay fiziği (spring physics) ile yumuşak takip
  const springConfig = { damping: 28, stiffness: 450, mass: 0.4 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Dokunmatik cihazlarda özel imleci devre dışı bırak
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Manyetik buton veya interaktif eleman dinleyicisi
    const handleMagneticEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ isHovered: boolean }>;
      if (customEvent.detail) {
        setIsHovered(Boolean(customEvent.detail.isHovered));
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('cursor:magnetic', handleMagneticEvent);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('cursor:magnetic', handleMagneticEvent);
    };
  }, [cursorX, cursorY, isVisible]);

  if (shouldReduceMotion) {
    return null;
  }

  const currentSize = isHovered ? hoverSize : size;

  return (
    <motion.div
      data-testid={testId}
      aria-hidden="true"
      style={{
        x: smoothX,
        y: smoothY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: currentSize,
        height: currentSize,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 400,
      }}
      className={`pointer-events-none fixed top-0 left-0 z-[9999] rounded-full bg-white mix-blend-difference will-change-transform ${className}`}
    />
  );
}
