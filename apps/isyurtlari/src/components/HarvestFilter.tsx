'use client';

import React from 'react';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';

export type HarvestSeasonType = 'tumu' | 'taze-hasat' | 'on-siparis' | 'dort-mevsim';

export interface HarvestSeasonOption {
  id: HarvestSeasonType;
  label: string;
  badge: string;
  icon: string;
  description: string;
}

export const HARVEST_SEASONS: HarvestSeasonOption[] = [
  {
    id: 'tumu',
    label: 'Tüm Ürünler',
    badge: 'Tümü',
    icon: '✨',
    description: 'Katalogdaki tüm el emeği ve gıda ürünleri',
  },
  {
    id: 'taze-hasat',
    label: 'Taze Hasat (Yeni Mahsul)',
    badge: 'Taze Hasat',
    icon: '🌿',
    description: 'İçinde bulunduğumuz ayda hasat edilmiş taze ve organik mahsuller',
  },
  {
    id: 'on-siparis',
    label: 'Yeni Sezon Ön Sipariş',
    badge: 'Ön Sipariş',
    icon: '⏳',
    description: 'Gelecek hasat ve üretim dönemi için erken rezerve edilebilir ürünler',
  },
  {
    id: 'dort-mevsim',
    label: 'Dört Mevsim Atölye',
    badge: 'Zanaat',
    icon: '🪵',
    description: 'Ahşap, deri, çini, bakır ve tekstil zanaat ürünleri',
  },
];

export interface HarvestFilterProps {
  /** Aktif seçili sezon filtresi */
  activeSeason: HarvestSeasonType;
  /** Sezon filtresi değiştiğinde tetiklenen geri çağrım */
  onSeasonChange: (season: HarvestSeasonType) => void;
  /** Ek Tailwind CSS sınıfları */
  className?: string;
  /** Test kimliği */
  'data-testid'?: string;
}

/**
 * HarvestFilter
 *
 * İşyurtları gıda ve zanaat ürünleri için dönemsel hasat ve sezonluk filtre çubuğu:
 * - Taze Hasat (Yeni Mahsul), Gelecek Sezon Ön Sipariş ve Dört Mevsim Atölye
 *   seçenekleri arasında pürüzsüz geçiş sunar.
 * - Framer Motion `layoutId` pill animasyonu ile seçili sekmenin arkasında akışkan
 *   yay fiziği oluşturur.
 * - WCAG 2.2 uyumlu `tablist` ve `aria-selected` erişilebilirlik niteliklerini taşır.
 * - `useReducedMotion` aktif olduğunda animasyonu devre dışı bırakır.
 */
export default function HarvestFilter({
  activeSeason = 'tumu',
  onSeasonChange,
  className = '',
  'data-testid': testId = 'harvest-filter-container',
}: HarvestFilterProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <div
        data-testid={testId}
        data-reduced-motion={shouldReduceMotion ? 'true' : 'false'}
        className={`w-full max-w-4xl mx-auto py-2 ${className}`}
      >
        <div
          role="tablist"
          aria-label="Hasat ve Sezonluk Ürün Filtresi"
          className="flex items-center gap-1.5 p-1.5 bg-gray-100/80 backdrop-blur rounded-2xl overflow-x-auto scrollbar-hide border border-gray-200/60 shadow-inner"
        >
          {HARVEST_SEASONS.map((season) => {
            const isActive = activeSeason === season.id;

            return (
              <button
                key={season.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-label={season.label}
                onClick={() => onSeasonChange(season.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CC4E00] flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                {/* Framer Motion ile seçili sekmeyi takip eden arka plan pill'i */}
                {isActive && (
                  <m.div
                    layoutId={shouldReduceMotion ? undefined : 'activeHarvestPill'}
                    data-testid="active-harvest-pill"
                    transition={{
                      type: 'spring',
                      damping: 26,
                      stiffness: 340,
                      mass: 0.6,
                    }}
                    className="absolute inset-0 bg-[#0F2040] rounded-xl shadow-md -z-10"
                  />
                )}

                <span className="text-sm sm:text-base leading-none">{season.icon}</span>
                <span>{season.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </LazyMotion>
  );
}

/**
 * HarvestBadge - Ürün Kartları İçin Sezon Rozeti
 */
export function HarvestBadge({
  season,
  className = '',
}: {
  season?: HarvestSeasonType;
  className?: string;
}) {
  if (!season || season === 'tumu') return null;

  const config = HARVEST_SEASONS.find((s) => s.id === season);
  if (!config) return null;

  const colorStyles = {
    'taze-hasat': 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-500/20',
    'on-siparis': 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/20',
    'dort-mevsim': 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20',
    'tumu': '',
  };

  return (
    <span
      data-testid="harvest-badge"
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs ${colorStyles[season]} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.badge}</span>
    </span>
  );
}
