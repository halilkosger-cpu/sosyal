'use client';

import React from 'react';
import { m, useReducedMotion } from 'framer-motion';

export interface TemplateProps {
  children: React.ReactNode;
}

/**
 * Root Template (Next.js App Router)
 *
 * Next.js App Router'da `layout.tsx` sayfalar arası geçişlerde unmount olmaz ve durumunu korur.
 * Bu nedenle Framer Motion sayfa geçişleri ve Shared Element Transition (layoutId)
 * animasyonlarının sayfa rotası değişimlerinde tetiklenebilmesi için `template.tsx` kullanılır.
 * Her rotaya geçişte yeni bir instance oluşturarak animasyonları devreye sokar.
 */
export default function Template({ children }: TemplateProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 },
  };

  return (
    <m.div
      data-testid="page-template-wrapper"
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.25,
        ease: 'easeOut',
      }}
      className="w-full flex-1"
    >
      {children}
    </m.div>
  );
}
