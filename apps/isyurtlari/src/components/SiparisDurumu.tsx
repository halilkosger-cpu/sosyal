'use client';

import { useState } from 'react';
import { LuCopy, LuCheck, LuTruck, LuExternalLink } from 'react-icons/lu';
import {
  SIPARIS_AKISI,
  SIPARIS_DURUM_ACIKLAMASI,
  SIPARIS_DURUM_METNI,
  durumAdimi,
  kargoFirmasi,
  kargoFirmaAdi,
  type SiparisDurumu as Durum,
} from '@/lib/kargo';

/**
 * Sipariş durumu çubuğu ve kargo takip bilgisi.
 *
 * Sipariş "Gönderildi" durumuna geçtiğinde müşteri bunu yalnızca bir rozet
 * olarak görüyordu: hangi firmayla gönderildiği, takip numarasının ne
 * olduğu hiçbir yerde yazmıyordu. Kargo karşı ödemeli olduğu için müşteri
 * teslimatta ne ödeyeceğini de bilmiyordu.
 *
 * Hem hesap sahibi hem misafir sorgusu aynı bileşeni kullanıyor - iki ayrı
 * yerde iki ayrı biçim, zamanla birbirinden ayrışırdı.
 */

interface Props {
  durum: string;
  kargoKodu?: string | null;
  takipNo?: string | null;
  kargoyaVerilme?: string | null;
  teslimEdilme?: string | null;
}

export default function SiparisDurumu({
  durum,
  kargoKodu,
  takipNo,
  kargoyaVerilme,
  teslimEdilme,
}: Props) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const adim = durumAdimi(durum);
  const iptal = durum === 'CANCELLED';
  const firma = kargoFirmasi(kargoKodu);

  const kopyala = async () => {
    if (!takipNo) return;
    try {
      await navigator.clipboard.writeText(takipNo);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      // Pano izni yoksa numara zaten ekranda yazıyor; sessiz geçiliyor.
    }
  };

  const tarih = (deger?: string | null) =>
    deger
      ? new Date(deger).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
      : null;

  return (
    <div className="mb-4 border-b border-gray-200 pb-4">
      {iptal ? (
        <p className="text-sm text-red-700">{SIPARIS_DURUM_ACIKLAMASI.CANCELLED}</p>
      ) : (
        <>
          {/* İlerleme çubuğu */}
          <ol className="flex items-center gap-1" aria-label="Sipariş durumu">
            {SIPARIS_AKISI.map((asama, sira) => {
              const tamam = adim >= sira;
              return (
                <li key={asama} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full ${tamam ? 'bg-[#FF6000]' : 'bg-gray-200'}`}
                    aria-hidden
                  />
                  <p
                    className={`mt-1.5 text-[11px] leading-tight ${
                      tamam ? 'font-semibold text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {SIPARIS_DURUM_METNI[asama]}
                  </p>
                </li>
              );
            })}
          </ol>

          <p className="mt-3 text-sm text-gray-600">
            {SIPARIS_DURUM_ACIKLAMASI[durum as Durum] ?? ''}
            {tarih(teslimEdilme) && durum === 'DELIVERED' ? ` (${tarih(teslimEdilme)})` : ''}
          </p>
        </>
      )}

      {/* Kargo bilgisi: yalnızca gerçekten girilmişse. Boş bir "Takip
          numarası: —" satırı müşteriye hiçbir şey söylemez. */}
      {(firma || takipNo) && !iptal && (
        <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <LuTruck size={16} className="text-[#BA4700]" />
            {kargoFirmaAdi(kargoKodu) ?? 'Kargo'}
            {tarih(kargoyaVerilme) && (
              <span className="font-normal text-gray-500">· {tarih(kargoyaVerilme)}</span>
            )}
          </div>

          {takipNo && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-2.5 py-1">
                {takipNo}
              </span>
              <button
                type="button"
                onClick={kopyala}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 transition"
              >
                {kopyalandi ? <LuCheck size={14} /> : <LuCopy size={14} />}
                {kopyalandi ? 'Kopyalandı' : 'Kopyala'}
              </button>
              {firma?.takipSayfasi && (
                <a
                  href={firma.takipSayfasi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#BA4700] hover:text-[#8F3700] border border-orange-200 rounded-lg px-2.5 py-1.5 transition"
                >
                  Kargoyu takip et <LuExternalLink size={13} />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
