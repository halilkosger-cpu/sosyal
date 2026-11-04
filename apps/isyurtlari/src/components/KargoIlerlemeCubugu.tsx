'use client';

import { LuTruck, LuPartyPopper } from 'react-icons/lu';
import { UCRETSIZ_KARGO_ESIGI, kargoUcretsizMi, kargoEsigineKalan } from '@/lib/fiyat';

interface KargoIlerlemeCubuguProps {
  /** Odenecek (kampanya indirimi dusulmus) urun toplami. */
  urunToplami: number;
  className?: string;
  kompakt?: boolean;
}

const tl = (n: number) => `${n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`;

/**
 * Ucretsiz kargo ilerleme cubugu.
 *
 * Kargo karsi odemeli; esik ve uzerindeki siparislerde isletme karsiladigi
 * icin musteri teslimatta kargo ucreti odemez. Esigin altinda kargo, kapida
 * kargo firmasina odenir.
 */
export default function KargoIlerlemeCubugu({ urunToplami, className = '', kompakt = false }: KargoIlerlemeCubuguProps) {
  const tamamlandi = kargoUcretsizMi(urunToplami);
  const kalan = kargoEsigineKalan(urunToplami);
  const yuzde = Math.min(100, Math.max(0, Math.round((urunToplami / UCRETSIZ_KARGO_ESIGI) * 100)));

  return (
    <div
      className={`rounded-2xl border ${kompakt ? 'p-2.5' : 'p-3.5'} ${
        tamamlandi ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50/70 border-orange-200'
      } ${className}`}
    >
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-900 mb-2">
        {tamamlandi ? (
          <>
            <LuPartyPopper className="text-emerald-600 shrink-0" size={16} />
            <span className="text-emerald-900">Kargo ücretsiz! Teslimatta kargo ücreti ödemeyeceksiniz.</span>
          </>
        ) : (
          <>
            <LuTruck className="text-[#CC4E00] shrink-0" size={16} />
            <span>
              <strong className="text-[#CC4E00]">{tl(kalan)}</strong> daha ekleyin, kargo ücretsiz olsun
              {!kompakt && <span className="block text-[11px] font-normal text-gray-500">Aksi hâlde kargo, teslimatta kargo firmasına ödenir.</span>}
            </span>
          </>
        )}
      </div>
      <div
        className="w-full h-2 bg-gray-200/70 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={yuzde}
        aria-label="Ücretsiz kargo ilerlemesi"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            tamamlandi ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'
          }`}
          style={{ width: `${yuzde}%` }}
        />
      </div>
    </div>
  );
}
