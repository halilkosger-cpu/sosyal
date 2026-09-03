'use client';

import { useEffect, useState } from 'react';
import { LuImage, LuTriangleAlert, LuCheck, LuPlay } from 'react-icons/lu';
import { gorseliKucult } from '@/lib/gorsel';

interface Urun {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

interface Satir {
  urun: Urun;
  eskiKB: number | null;
  yeniKB?: number;
  durum: 'bekliyor' | 'olculuyor' | 'isleniyor' | 'tamam' | 'atlandi' | 'hata';
  not?: string;
}

// Bu esigin altindakilere dokunmuyoruz; kazanc zahmete degmez.
const ESIK_KB = 150;

export default function AdminGorsellerPage() {
  const [satirlar, setSatirlar] = useState<Satir[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [calisiyor, setCalisiyor] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/products', { cache: 'no-store' });
        const d = await r.json();
        const urunler: Urun[] = (Array.isArray(d) ? d : []).filter((u: Urun) => u.imageUrl);
        setSatirlar(urunler.map((u) => ({ urun: u, eskiKB: null, durum: 'olculuyor' })));
        setYukleniyor(false);

        // Boyutlari tek tek olc
        for (const u of urunler) {
          let kb: number | null = null;
          try {
            const h = await fetch(u.imageUrl!, { method: 'HEAD' });
            const uzunluk = Number(h.headers.get('content-length') || 0);
            if (uzunluk) kb = Math.round(uzunluk / 1024);
          } catch { /* olculemedi */ }
          setSatirlar((s) => s.map((x) => (x.urun.id === u.id ? { ...x, eskiKB: kb, durum: 'bekliyor' } : x)));
        }
      } catch {
        setYukleniyor(false);
        setMesaj('⚠️ Ürün listesi alınamadı.');
      }
    })();
  }, []);

  const hedefler = satirlar.filter((s) => s.eskiKB !== null && s.eskiKB > ESIK_KB && s.durum !== 'tamam');
  const toplamEski = satirlar.reduce((a, s) => a + (s.eskiKB ?? 0), 0);
  const tamamlanan = satirlar.filter((s) => s.durum === 'tamam');

  const guncelle = (id: string, y: Partial<Satir>) =>
    setSatirlar((s) => s.map((x) => (x.urun.id === id ? { ...x, ...y } : x)));

  async function calistir() {
    if (!window.confirm(
      `${hedefler.length} ürünün görseli küçültülüp yeniden yüklenecek ve ürün kaydı güncellenecek.\n\n` +
      'Eski görseller silinmez, sadece yeni adres kaydedilir.\n\nDevam edilsin mi?'
    )) return;

    setCalisiyor(true);
    setMesaj(null);
    let basarili = 0, hata = 0;

    for (const s of hedefler) {
      guncelle(s.urun.id, { durum: 'isleniyor' });
      try {
        // 1) Mevcut gorseli indir
        const blob = await (await fetch(s.urun.imageUrl!)).blob();
        const ad = (s.urun.slug || s.urun.id) + '.jpg';
        const { dosya, yeniBayt } = await gorseliKucult(new File([blob], ad, { type: blob.type || 'image/jpeg' }));

        if (yeniBayt >= blob.size) {
          guncelle(s.urun.id, { durum: 'atlandi', not: 'küçültme kazanç sağlamadı' });
          continue;
        }

        // 2) Guncel depoya yukle
        const fd = new FormData();
        fd.append('file', dosya);
        const y = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const yd = await y.json();
        if (!y.ok || !yd.url) throw new Error(yd.error || 'yükleme başarısız');

        // 3) Urun kaydindaki adresi guncelle (PATCH: yalnizca imageUrl)
        const p = await fetch(`/api/admin/products/${s.urun.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: yd.url }),
        });
        if (!p.ok) throw new Error('ürün güncellenemedi');

        guncelle(s.urun.id, { durum: 'tamam', yeniKB: Math.round(yeniBayt / 1024) });
        basarili++;
      } catch (e: any) {
        guncelle(s.urun.id, { durum: 'hata', not: (e?.message || 'bilinmeyen hata').slice(0, 60) });
        hata++;
      }
    }

    setCalisiyor(false);
    setMesaj(`✅ ${basarili} görsel optimize edildi${hata ? `, ${hata} tanesinde hata oluştu` : ''}.`);
  }

  const rozet = (d: Satir['durum']) => {
    const h: Record<string, string> = {
      bekliyor: 'bg-gray-100 text-gray-600',
      olculuyor: 'bg-gray-100 text-gray-400',
      isleniyor: 'bg-blue-50 text-blue-700',
      tamam: 'bg-green-50 text-green-700',
      atlandi: 'bg-gray-100 text-gray-500',
      hata: 'bg-red-50 text-red-700',
    };
    const m: Record<string, string> = {
      bekliyor: 'bekliyor', olculuyor: 'ölçülüyor…', isleniyor: 'işleniyor…',
      tamam: 'tamam', atlandi: 'atlandı', hata: 'hata',
    };
    return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${h[d]}`}>{m[d]}</span>;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Görsel Optimizasyonu</h1>
        <p className="text-gray-500 text-sm mt-1">
          {satirlar.length} görselli ürün · toplam {(toplamEski / 1024).toFixed(1)} MB ·{' '}
          <strong className={hedefler.length ? 'text-[#FF6000]' : ''}>{hedefler.length}</strong> tanesi {ESIK_KB} KB üzerinde
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-2">
        <LuTriangleAlert size={18} className="flex-shrink-0 mt-0.5" />
        <span>
          Site, görselleri Vercel dönüştürme kotasını kullanmadan servis ediyor; yani depoya ne
          yüklenirse ziyaretçiye aynen o gidiyor. Bu araç her görseli tarayıcında en fazla 1000
          piksele küçültüp yeniden yükler ve ürün kaydındaki adresi günceller.
          <strong> Eski görseller silinmez</strong>, istenirse geri dönülebilir.
        </span>
      </div>

      {mesaj && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800">
          {mesaj}
        </div>
      )}

      <button
        onClick={calistir}
        disabled={calisiyor || hedefler.length === 0}
        className="mb-6 inline-flex items-center gap-2 bg-[#FF6000] hover:bg-[#e55500] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-bold transition-colors"
      >
        {calisiyor ? <LuImage size={18} /> : <LuPlay size={18} />}
        {calisiyor ? 'İşleniyor…' : `${hedefler.length} görseli optimize et`}
      </button>

      {yukleniyor ? (
        <p className="text-gray-500 text-sm">Yükleniyor…</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Ürün</th>
                <th className="text-right px-4 py-3 font-semibold">Mevcut</th>
                <th className="text-right px-4 py-3 font-semibold">Yeni</th>
                <th className="text-right px-4 py-3 font-semibold w-28">Durum</th>
              </tr>
            </thead>
            <tbody>
              {satirlar.map((s) => (
                <tr key={s.urun.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 text-gray-900">{s.urun.name}</td>
                  <td className="px-4 py-2.5 text-right">
                    {s.eskiKB === null ? (
                      <span className="text-gray-300">—</span>
                    ) : (
                      <span className={s.eskiKB > ESIK_KB ? 'text-[#FF6000] font-semibold' : 'text-gray-600'}>
                        {s.eskiKB} KB
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-green-700 font-semibold">
                    {s.yeniKB ? `${s.yeniKB} KB` : ''}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {rozet(s.durum)}
                    {s.not && <p className="text-[10px] text-gray-500 mt-0.5">{s.not}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tamamlanan.length > 0 && (
        <p className="mt-4 text-sm text-gray-600 flex items-center gap-2">
          <LuCheck size={16} className="text-green-600" />
          {tamamlanan.length} görsel güncellendi ·{' '}
          {(tamamlanan.reduce((a, s) => a + (s.eskiKB ?? 0), 0) / 1024).toFixed(1)} MB →{' '}
          {(tamamlanan.reduce((a, s) => a + (s.yeniKB ?? 0), 0) / 1024).toFixed(1)} MB
        </p>
      )}
    </div>
  );
}
