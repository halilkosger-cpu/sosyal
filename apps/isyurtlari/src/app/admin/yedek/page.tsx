'use client';

import { useEffect, useState } from 'react';
import { LuDownload, LuDatabase, LuTriangleAlert } from 'react-icons/lu';

interface Sayim { tablo: string; satir: number }

export default function AdminYedekPage() {
  const [sayimlar, setSayimlar] = useState<Sayim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [calisiyor, setCalisiyor] = useState(false);
  const [ilerleme, setIlerleme] = useState('');
  const [mesaj, setMesaj] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/export', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setSayimlar(Array.isArray(d.tablolar) ? d.tablolar : []);
        setYukleniyor(false);
      })
      .catch(() => { setYukleniyor(false); setMesaj('⚠️ Tablo listesi alınamadı.'); });
  }, []);

  const dolu = sayimlar.filter((s) => s.satir > 0);
  const toplam = sayimlar.reduce((a, s) => a + Math.max(0, s.satir), 0);

  async function indir() {
    setCalisiyor(true);
    setMesaj(null);
    const yedek: Record<string, any[]> = {};

    try {
      for (const s of dolu) {
        let atla = 0;
        yedek[s.tablo] = [];
        // Sayfa sayfa cek: tek istekte tum tabloyu almak sunucu yanit sinirini asabilir
        while (atla < s.satir) {
          setIlerleme(`${s.tablo} — ${atla}/${s.satir}`);
          const r = await fetch(`/api/admin/export?tablo=${s.tablo}&atla=${atla}&adet=500`, { cache: 'no-store' });
          const d = await r.json();
          if (!r.ok) throw new Error(`${s.tablo}: ${d.error || 'okunamadı'}`);
          yedek[s.tablo].push(...d.satirlar);
          if (d.satirlar.length === 0) break;
          atla += d.satirlar.length;
        }
      }

      const icerik = JSON.stringify(
        { olusturma: new Date().toISOString(), kaynak: 'isyurtlari.com.tr', tablolar: yedek },
        null,
        1
      );
      const blob = new Blob([icerik], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `isyurtlari-yedek-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);

      const mb = (blob.size / 1024 / 1024).toFixed(1);
      setMesaj(`✅ Yedek indirildi: ${toplam} satır, ${mb} MB.`);
    } catch (e: any) {
      setMesaj('⚠️ ' + (e?.message || 'Yedek alınamadı'));
    } finally {
      setCalisiyor(false);
      setIlerleme('');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Veritabanı Yedeği</h1>
        <p className="text-gray-500 text-sm mt-1">
          {dolu.length} dolu tablo · toplam <strong>{toplam.toLocaleString('tr-TR')}</strong> satır
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-2">
        <LuTriangleAlert size={18} className="flex-shrink-0 mt-0.5" />
        <span>
          İndirilen dosya <strong>tüm müşteri verilerini</strong> içerir: adlar, e-postalar,
          teslimat adresleri, siparişler. Güvenli bir yerde saklayın, paylaşmayın.
        </span>
      </div>

      {mesaj && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800">
          {mesaj}
        </div>
      )}

      <button
        onClick={indir}
        disabled={calisiyor || dolu.length === 0}
        className="mb-6 inline-flex items-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-bold transition-colors"
      >
        {calisiyor ? <LuDatabase size={18} /> : <LuDownload size={18} />}
        {calisiyor ? `İndiriliyor… ${ilerleme}` : 'Tam yedeği indir (JSON)'}
      </button>

      {yukleniyor ? (
        <p className="text-gray-500 text-sm">Tablolar okunuyor…</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Tablo</th>
                <th className="text-right px-4 py-3 font-semibold">Satır</th>
              </tr>
            </thead>
            <tbody>
              {sayimlar.map((s) => (
                <tr key={s.tablo} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900">{s.tablo}</td>
                  <td className={`px-4 py-2 text-right ${s.satir > 0 ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                    {s.satir < 0 ? 'okunamadı' : s.satir.toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
