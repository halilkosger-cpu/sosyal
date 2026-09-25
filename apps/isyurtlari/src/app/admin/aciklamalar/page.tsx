'use client';

import { useState } from 'react';
import { LuCheck, LuTriangleAlert, LuFileText } from 'react-icons/lu';

/**
 * Toplu urun aciklamasi yazma.
 *
 * Aciklamalar repoda hazir duruyor (config/urun-aciklamalari.json); bu
 * sayfa yalnizca "once goster, sonra yaz" adimini yonetiyor. Yonetici
 * 20 KB'lik bir JSON'u yapistirmiyor, iki dugmeye basiyor.
 *
 * Onizleme yazma yapmaz: uc `onayla` bayragi olmadan yalnizca neyin
 * degisecegini donduruyor.
 */

interface Degisiklik {
  slug: string;
  ad: string;
  eskiUzunluk: number;
  yeniUzunluk: number;
}

interface Onizleme {
  degisecek: Degisiklik[];
  ayni: string[];
  bulunamadi: string[];
}

export default function AdminAciklamalarPage() {
  const [onizleme, setOnizleme] = useState<Onizleme | null>(null);
  const [mesaj, setMesaj] = useState<{ tur: 'ok' | 'hata'; metin: string } | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const cagir = async (onayla: boolean) => {
    setCalisiyor(true);
    setMesaj(null);
    try {
      const r = await fetch('/api/admin/products/descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hazir: true, ...(onayla ? { onayla: true } : {}) }),
      });
      const d = await r.json();

      if (!r.ok) {
        setMesaj({ tur: 'hata', metin: d.error ?? 'İşlem başarısız' });
        if (d.degisecek) setOnizleme(d as Onizleme);
        return;
      }

      if (onayla) {
        setOnizleme(null);
        setMesaj({
          tur: 'ok',
          metin: `${d.yazildi} ürünün açıklaması yazıldı. ${d.ayni} ürün zaten günceldi.`,
        });
      } else {
        setOnizleme(d as Onizleme);
      }
    } catch {
      setMesaj({ tur: 'hata', metin: 'Sunucuya ulaşılamadı' });
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Ürün Açıklamaları</h1>
      <p className="text-sm text-gray-600 mb-6">
        Hazırlanmış açıklamalar depoda duruyor. Önce neyin değişeceğini görün, sonra yazın.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => cagir(false)}
          disabled={calisiyor}
          className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <LuFileText size={16} /> Önizle
        </button>
        <button
          onClick={() => cagir(true)}
          disabled={calisiyor || !onizleme || onizleme.degisecek.length === 0}
          className="inline-flex items-center gap-2 bg-[#CC4E00] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#A63F00] disabled:opacity-50"
        >
          <LuCheck size={16} /> Yaz
        </button>
      </div>

      {mesaj && (
        <div
          className={`flex items-start gap-2 rounded-lg p-3 mb-6 text-sm ${
            mesaj.tur === 'ok'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {mesaj.tur === 'ok' ? (
            <LuCheck size={16} className="mt-0.5 shrink-0" />
          ) : (
            <LuTriangleAlert size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{mesaj.metin}</span>
        </div>
      )}

      {onizleme && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 text-sm text-gray-700">
            <strong>{onizleme.degisecek.length}</strong> ürün değişecek ·{' '}
            <strong>{onizleme.ayni.length}</strong> ürün zaten güncel
            {onizleme.bulunamadi.length > 0 && (
              <>
                {' '}
                · <strong className="text-red-700">{onizleme.bulunamadi.length}</strong> slug bulunamadı
              </>
            )}
          </div>

          {onizleme.bulunamadi.length > 0 && (
            <div className="px-4 py-3 bg-red-50 text-sm text-red-800 border-b border-red-200">
              Bulunamayan slug&apos;lar düzeltilmeden hiçbir şey yazılmaz: {onizleme.bulunamadi.join(', ')}
            </div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-white border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 font-semibold">Ürün</th>
                <th className="px-4 py-2 font-semibold text-right">Eski</th>
                <th className="px-4 py-2 font-semibold text-right">Yeni</th>
              </tr>
            </thead>
            <tbody>
              {onizleme.degisecek.map((d) => (
                <tr key={d.slug} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2">
                    <span className="text-gray-900">{d.ad}</span>
                    <span className="block text-xs text-gray-400">{d.slug}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-500">{d.eskiUzunluk}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-900">{d.yeniUzunluk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
