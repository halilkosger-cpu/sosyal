'use client';

import React from 'react';
import { LuTruck, LuPartyPopper, LuSparkles } from 'react-icons/lu';

interface KargoIlerlemeCubuguProps {
  toplamTutar: number;
  className?: string;
  kompakt?: boolean;
}

export const UCRETSIZ_KARGO_LIMITI = 1500;

export default function KargoIlerlemeCubugu({
  toplamTutar,
  className = '',
  kompakt = false,
}: KargoIlerlemeCubuguProps) {
  const kalan = Math.max(0, UCRETSIZ_KARGO_LIMITI - toplamTutar);
  const yuzde = Math.min(100, Math.max(0, Math.round((toplamTutar / UCRETSIZ_KARGO_LIMITI) * 100)));
  const tamamlandi = toplamTutar >= UCRETSIZ_KARGO_LIMITI;

  if (kompakt) {
    return (
      <div className={`p-2.5 rounded-xl border ${tamamlandi ? 'bg-emerald-50/80 border-emerald-200' : 'bg-orange-50/70 border-orange-200/80'} ${className}`}>
        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
          <span className="flex items-center gap-1.5 text-gray-800">
            {tamamlandi ? (
              <>
                <LuPartyPopper className="text-emerald-600" size={14} />
                <span className="text-emerald-800">Kargonuz BEDAVA!</span>
              </>
            ) : (
              <>
                <LuTruck className="text-[#CC4E00]" size={14} />
                <span>
                  🎉 <strong className="text-[#CC4E00]">{kalan.toLocaleString('tr-TR')} TL</strong> daha ekleyin, <span className="text-emerald-700 font-extrabold">KARGO BEDAVA</span> olsun!
                </span>
              </>
            )}
          </span>
          <span className={`text-[11px] font-black ${tamamlandi ? 'text-emerald-700' : 'text-gray-500'}`}>
            %{yuzde}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200/70 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              tamamlandi
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500'
            }`}
            style={{ width: `${yuzde}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3.5 rounded-2xl border shadow-xs transition-all ${
      tamamlandi
        ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300'
        : 'bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-orange-50/90 border-orange-200'
    } ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
          {tamamlandi ? (
            <>
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <LuSparkles size={13} />
              </div>
              <span className="text-emerald-900 font-extrabold tracking-tight">
                🎉 Tebrikler! 1.500 TL üzeri kargonuz BEDAVA!
              </span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-[#CC4E00] text-white flex items-center justify-center shadow-xs shrink-0">
                <LuTruck size={13} />
              </div>
              <span className="text-gray-900 leading-tight">
                🎉 <strong className="text-[#CC4E00] font-black">{kalan.toLocaleString('tr-TR')} TL</strong> daha ekleyin, <strong className="text-emerald-700 font-extrabold underline decoration-emerald-400">KARGO BEDAVA</strong> olsun!
              </span>
            </>
          )}
        </div>
        <span className={`text-xs font-black shrink-0 px-2 py-0.5 rounded-full ${
          tamamlandi ? 'bg-emerald-200/80 text-emerald-900' : 'bg-orange-100 text-[#BA4700]'
        }`}>
          %{yuzde}
        </span>
      </div>

      {/* İlerleme Çubuğu */}
      <div className="relative w-full h-2.5 bg-gray-200/80 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out shadow-xs ${
            tamamlandi
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse'
              : 'bg-gradient-to-r from-[#CC4E00] via-amber-500 to-emerald-500'
          }`}
          style={{ width: `${yuzde}%` }}
        />
      </div>
    </div>
  );
}
