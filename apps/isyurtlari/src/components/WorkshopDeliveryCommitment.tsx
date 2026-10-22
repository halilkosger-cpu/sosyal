'use client';

import React from 'react';
import { LuHammer, LuShieldCheck, LuTruck, LuClock, LuSparkles } from 'react-icons/lu';

export interface CartProductBrief {
  id: string;
  name: string;
  quantity: number;
  price: number;
  slug?: string;
}

export interface WorkshopDeliveryCommitmentProps {
  items: CartProductBrief[];
  className?: string;
}

/**
 * WorkshopDeliveryCommitment
 *
 * Sepet ve Ödeme (Checkout) aşamasında müşteriye atölye üretim sürecini,
 * zanaat hazırlık taahhüdünü ve tahmini kargo penceresini şeffafça sunar.
 */
export default function WorkshopDeliveryCommitment({
  items,
  className = '',
}: WorkshopDeliveryCommitmentProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-amber-200/80 bg-gradient-to-br from-[#FFFBF7] to-[#FDF4EB] p-5 shadow-xs ${className}`}
      data-testid="workshop-delivery-commitment"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap pb-3.5 border-b border-amber-200/60">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-orange-100 text-[#BA4700]">
            <LuHammer size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Atölye Teslimat Taahhüdü
            </h3>
            <p className="text-xs text-gray-600">
              Adalet Bakanlığı İşyurtları Atölye Güvencesi
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-300 text-xs font-bold text-[#BA4700] shadow-xs">
          <LuClock size={14} className="text-[#CC4E00]" />
          <span>3 - 6 İş Günü İçinde Kargoda</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
        {/* 1. Atölye Üretimi */}
        <div className="flex items-start gap-2.5 bg-white/80 rounded-xl p-3 border border-amber-100">
          <LuSparkles size={16} className="text-[#CC4E00] shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-gray-900">Atölye Üretimi &amp; Taze Hazırlık</p>
            <p className="text-gray-600 mt-0.5 leading-snug">
              Zanaatkâr hükümlüler ve usta öğreticiler denetiminde titizlikle hazırlanır.
            </p>
          </div>
        </div>

        {/* 2. Hijyenik Korumalı Paketleme */}
        <div className="flex items-start gap-2.5 bg-white/80 rounded-xl p-3 border border-amber-100">
          <LuShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-gray-900">Hijyenik Korumalı Paketleme</p>
            <p className="text-gray-600 mt-0.5 leading-snug">
              Darbe emici koruma ve gıdaya uygun sertifikalı ambalajlama.
            </p>
          </div>
        </div>

        {/* 3. Adım Adım Canlı Takip */}
        <div className="flex items-start gap-2.5 bg-white/80 rounded-xl p-3 border border-amber-100">
          <LuTruck size={16} className="text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-gray-900">Adım Adım Canlı Takip</p>
            <p className="text-gray-600 mt-0.5 leading-snug">
              Üretim aşamaları ve kargo teslim kodu SMS / e-posta ile anlık iletilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
