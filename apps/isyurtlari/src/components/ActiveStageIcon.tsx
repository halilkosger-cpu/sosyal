'use client';

import React from 'react';
import { m, useReducedMotion, Variants } from 'framer-motion';

export type EffectType = 'pulse' | 'shake';

export interface ActiveStageIconProps {
  /**
   * İkon içeriği (örneğin React Icon, SVG vb.)
   */
  children: React.ReactNode;
  /**
   * Aşamanın şu an aktif/seçili olup olmadığı
   */
  isActive?: boolean;
  /**
   * Mikro etkileşim animasyon tipi: 'pulse' (nefes alma/büyüme) veya 'shake' (sağa-sola sallanma)
   */
  effectType?: EffectType;
  /**
   * Ek Tailwind CSS sınıfları
   */
  className?: string;
  /**
   * Test kimliği
   */
  'data-testid'?: string;
}

/**
 * Sonsuz döngü 'pulse' varyantı:
 * Hafif ve ritmik bir büyüme-küçülme ile aktif aşamayı vurgular.
 */
const pulseVariants: Variants = {
  inactive: {
    scale: 1,
    rotate: 0,
  },
  active: {
    scale: [1, 1.14, 1],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Sonsuz döngü 'shake' varyantı:
 * Belirli aralıklarla dikkat çeken sağa-sola sallanma hareketi.
 */
const shakeVariants: Variants = {
  inactive: {
    scale: 1,
    rotate: 0,
  },
  active: {
    rotate: [0, -8, 8, -6, 6, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 2,
      ease: 'easeInOut',
    },
  },
};

/**
 * ActiveStageIcon - İlerleme Çubuğu Aktif Aşama İkonu
 *
 * Mikro etkileşimler ile sipariş veya form adımlarında kullanıcının dikkatini
 * odaklayan, WCAG 2.2 ve prefers-reduced-motion erişilebilirlik standartlarına
 * tam uyumlu modern ikon bileşeni.
 */
export default function ActiveStageIcon({
  children,
  isActive = false,
  effectType = 'pulse',
  className = '',
  'data-testid': testId = 'active-stage-icon',
}: ActiveStageIconProps) {
  // İşletim sistemi 'hareketi azalt' kontrolü
  const shouldReduceMotion = useReducedMotion();

  // Erişilebilirlik: Kullanıcı sisteminde hareket kısıtlıysa animasyon 'inactive' moduna zorlanır
  const shouldAnimate = Boolean(isActive) && !shouldReduceMotion;
  const animateState = shouldAnimate ? 'active' : 'inactive';

  const selectedVariants = effectType === 'shake' ? shakeVariants : pulseVariants;

  return (
    <m.div
      data-testid={testId}
      data-is-active={isActive ? 'true' : 'false'}
      data-effect-type={effectType}
      data-animate-state={animateState}
      variants={selectedVariants}
      initial="inactive"
      animate={animateState}
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      {/* 4. Durum: Yalnızca pulse ve isActive=true iken parlama/glow efekti */}
      {isActive && effectType === 'pulse' && (
        <m.div
          data-testid="active-stage-glow"
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={
            shouldReduceMotion
              ? { scale: 1, opacity: 0 }
              : { scale: [0.9, 1.55, 0.9], opacity: [0.6, 0, 0.6] }
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-2xl bg-orange-500/25 blur-md pointer-events-none -z-10"
        />
      )}

      {children}
    </m.div>
  );
}
