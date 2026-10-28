'use client';

import React, { useMemo } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import {
  LuPackageCheck,
  LuBoxes,
  LuShieldCheck,
  LuTruck,
  LuMapPin,
  LuCheck,
  LuClock,
  LuTriangleAlert,
} from 'react-icons/lu';
import {
  PREORDER_STEPS,
  PreOrderStep,
  calculateDeliveryDate,
} from '@/lib/preorder-timeline';
import ActiveStageIcon from './ActiveStageIcon';

export interface PreOrderTimelineProps {
  /**
   * Aktif aşama indeksi (0: Sipariş Alındı, 1: Tedarik, 2: Kalite Kontrol, 3: Kargo, 4: Teslimat)
   */
  currentStepIndex: number;
  /**
   * Sipariş tarihi
   */
  orderDate?: Date | string;
  /**
   * Üretim / atölye gecikmesi (+2 gün veya sayısal gün)
   */
  hasDelay?: boolean | number;
  /**
   * Hafta sonlarını hesaba katma
   */
  skipWeekends?: boolean;
  /**
   * Özel aşama tanımları (opsiyonel)
   */
  steps?: PreOrderStep[];
  /**
   * Ek Tailwind CSS sınıfları
   */
  className?: string;
}

const STEP_ICONS = [
  LuPackageCheck,
  LuBoxes,
  LuShieldCheck,
  LuTruck,
  LuMapPin,
];

/**
 * PreOrderTimeline
 *
 * Modern, erişilebilir ve Framer Motion destekli Ön Sipariş İlerleme Bileşeni.
 * İşletim sistemi 'hareketi azalt' (prefers-reduced-motion) modunu destekler.
 */
export default function PreOrderTimeline({
  currentStepIndex = 0,
  orderDate = new Date(),
  hasDelay = false,
  skipWeekends = true,
  steps = PREORDER_STEPS,
  className = '',
}: PreOrderTimelineProps) {
  const systemReducedMotion = useReducedMotion();

  // Erişilebilirlik: prefers-reduced-motion kontrolü
  const isReduced = useMemo(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (media?.matches) return true;
    }
    return Boolean(systemReducedMotion);
  }, [systemReducedMotion]);

  // İlerleme yüzdesi hesabı (5 aşama için: 0%, 25%, 50%, 75%, 100%)
  const maxIndex = Math.max(1, steps.length - 1);
  const clampedIndex = Math.min(maxIndex, Math.max(0, currentStepIndex));
  const progressPercent = Math.round((clampedIndex / maxIndex) * 100);

  // Tahmini teslimat tarihi
  const stepDaysArray = useMemo(() => steps.map((s) => s.days), [steps]);
  const tahminiTeslimat = useMemo(() => {
    return calculateDeliveryDate(orderDate, stepDaysArray, hasDelay, skipWeekends);
  }, [orderDate, stepDaysArray, hasDelay, skipWeekends]);

  const teslimatMetni = useMemo(() => {
    return tahminiTeslimat.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  }, [tahminiTeslimat]);

  const transitionDuration = isReduced ? 0 : 0.65;

  return (
    <div
      data-testid="preorder-timeline-container"
      data-reduced-motion={isReduced ? 'true' : 'false'}
      className={`bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 ${className}`}
    >
      {/* Üst Bilgi Kartı: Tahmini Teslimat & Durum Rozeti */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-orange-50 text-[#CC4E00] border border-orange-200">
              <span className="w-2 h-2 rounded-full bg-[#FF6000] animate-pulse" />
              Ön Sipariş Takibi
            </span>
            {hasDelay && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <LuTriangleAlert size={12} />
                Ek Üretim Süresi (+{typeof hasDelay === 'number' ? hasDelay : 2} Gün)
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Tahmini Teslimat: <span className="text-[#CC4E00]">{teslimatMetni}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            İşyurtları hükümlü iş atölyelerinde titizlikle hazırlanan ürününüzün anlık durum tablosu.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 sm:text-right flex items-center sm:block gap-3">
          <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">İlerleme</div>
          <div className="text-2xl font-black text-gray-900">%{progressPercent}</div>
        </div>
      </div>

      {/* İlerleme Çubuğu Alanı */}
      <div className="relative pt-10 pb-6">
        {/* Arka plan gri çizgi */}
        <div className="absolute top-16 left-6 right-6 sm:left-12 sm:right-12 h-1.5 bg-gray-100 rounded-full z-0 -translate-y-1/2" />

        {/* Aktif renkli dolgu çubuğu (Framer Motion) */}
        <m.div
          data-testid="preorder-progress-bar"
          data-progress-percent={`${progressPercent}%`}
          data-transition-duration={isReduced ? '0' : '0.65'}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{
            duration: transitionDuration,
            ease: isReduced ? 'linear' : [0.25, 0.1, 0.25, 1],
          }}
          className="absolute top-16 left-6 right-6 sm:left-12 sm:right-12 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 rounded-full z-0 -translate-y-1/2 origin-left shadow-sm"
          style={{ maxWidth: 'calc(100% - 3rem)' }}
        />

        {/* Adım Düğümleri (5 Aşama) */}
        <div className="relative z-10 grid grid-cols-5 gap-2">
          {steps.map((step, idx) => {
            const isCompleted = idx < clampedIndex;
            const isCurrent = idx === clampedIndex;
            const IconComponent = STEP_ICONS[idx] || LuClock;

            return (
              <div key={step.id} className="flex flex-col items-center text-center group">
                {/* Düğüm İkonu (Aktifken mikro-etkileşimli ActiveStageIcon) */}
                <ActiveStageIcon isActive={isCurrent} effectType="pulse">
                  <div
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                      isCompleted
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 shadow-emerald-200'
                        : isCurrent
                        ? 'bg-[#0F2040] text-white ring-4 ring-orange-100 shadow-orange-200 border-2 border-[#FF6000]'
                        : 'bg-white text-gray-300 border border-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <LuCheck className="stroke-[3]" size={20} />
                    ) : (
                      <IconComponent size={20} className={isCurrent ? 'text-amber-400' : ''} />
                    )}
                  </div>
                </ActiveStageIcon>

                {/* Adım Başlığı & Açıklaması */}
                <div className="mt-3 w-full">
                  <div
                    className={`text-xs sm:text-sm font-black transition-colors ${
                      isCurrent
                        ? 'text-[#CC4E00]'
                        : isCompleted
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="hidden sm:block text-[11px] text-gray-400 mt-1 line-clamp-2 px-1">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alt Bilgilendirme Notu */}
      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
        <span>Sipariş Başlangıcı: {new Date(orderDate).toLocaleDateString('tr-TR')}</span>
        <span>Resmi Adalet Bakanlığı İşyurtları Güvencesi</span>
      </div>
    </div>
  );
}
