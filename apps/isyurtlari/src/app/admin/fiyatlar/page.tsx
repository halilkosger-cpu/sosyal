'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LuDownload, LuUpload, LuSave, LuTriangleAlert, LuCheck } from 'react-icons/lu';
import { fiyatiCoz } from '@/lib/csv';

interface Urun {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  category?: { name: string } | null;
}

interface Onizleme {
  degisecek: { slug: string; ad: string; eskiFiyat: number; yeniFiyat: number }[];
  sorunlar: { satir: number; slug: string; sebep: string }[];
  atlananSayisi: number;
  toplamSatir: number;
}

export default function AdminFiyatlarPage() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [taslak, setTaslak] = useState<Record<string, string>>({});
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [arama, setArama] = useState('');
  const [sadeceFiyatsiz, setSadeceFiyatsiz] = useState(false);
  const [onizleme, setOnizleme] = useState<Onizleme | null>(null);
  const dosyaRef = useRef<HTMLInputElement | null>(null);

  const yukle = () => {
    fetch('/api/admin/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setUrunler(Array.isArray(d) ? d : []);
        setTaslak({});
        setYukleniyor(false);
      })
      .catch(() => setYukleniyor(false));
  };

  useEffect(() => { yukle(); }, []);

  const gorunen = useMemo(() => {
    const a = arama.trim().toLocaleLowerCase('tr');
    return urunler.filter((u) => {
      if (sadeceFiyatsiz && u.price > 0) return false;
      if (!a) return true;
      return (
        u.name.toLocaleLowerCase('tr').includes(a) ||
        u.slug.includes(a) ||
        (u.category?.name ?? '').toLocaleLowerCase('tr').includes(a)
      );
    });
  }, [urunler, arama, sadeceFiyatsiz]);

  const fiyatsizSayisi = urunler.filter((u) => u.price <= 0).length;

  /** Kullanicinin degistirdigi, eskisinden farkli olan satirlar */
  const bekleyen = useMemo(() => {
    const cikti: { slug: string; price: number }[] = [];
    for (const [slug, ham] of Object.entries(taslak)) {
      if (ham.trim() === '') continue;
      // CSV ile ayni ayristirici: "1.450,50" gibi Turkce yazimlar da dogru okunsun
      const n = fiyatiCoz(ham);
      if (n === null) continue;
      const urun = urunler.find((u) => u.slug === slug);
      if (!urun || urun.price === n) continue;
      cikti.push({ slug, price: n });
    }
    return cikti;
  }, [taslak, urunler]);

  const kaydet = async (guncellemeler: { slug: string; price: number }[]) => {
    if (guncellemeler.length === 0) return;
    setKaydediliyor(true);
    setMesaj(null);
    try {
      const r = await fetch('/api/admin/products/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: guncellemeler }),
      });
      const d = await r.json();
      setMesaj(r.ok ? `✅ ${d.guncellenen} ürünün fiyatı güncellendi.` : `⚠️ ${d.error}`);
      if (r.ok) { setOnizleme(null); yukle(); }
    } catch {
      setMesaj('⚠️ Bağlantı hatası, fiyatlar kaydedilemedi.');
    } finally {
      setKaydediliyor(false);
    }
  };

  const dosyaSecildi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setMesaj(null);
    const csv = await dosya.text();
    try {
      const r = await fetch('/api/admin/products/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const d = await r.json();
      if (!r.ok) { setMesaj(`⚠️ ${d.error}`); return; }
      setOnizleme(d);
    } catch {
      setMesaj('⚠️ Dosya okunamadı.');
    } finally {
      if (dosyaRef.current) dosyaRef.current.value = '';
    }
  };

  const tl = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fiyatlar</h1>
        <p className="text-gray-500 text-sm mt-1">
          {urunler.length} ürün ·{' '}
          <strong className={fiyatsizSayisi > 0 ? 'text-[#BA4700]' : ''}>{fiyatsizSayisi}</strong>{' '}
          ürünün fiyatı girilmemiş
        </p>
      </div>

      {fiyatsizSayisi > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-2">
          <LuTriangleAlert size={18} className="flex-shrink-0 mt-0.5" />
          <span>
            Fiyatı girilmemiş ürünler sepete eklenemez; sitede &quot;Fiyat belirleniyor&quot; yazar.
            Satışa açmak için fiyat girilmesi gerekiyor.
          </span>
        </div>
      )}

      {mesaj && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800">
          {mesaj}
        </div>
      )}

      {/* ─── EXCEL / CSV ─── */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-gray-900 mb-1">Excel ile toplu fiyat girişi</h2>
        <p className="text-sm text-gray-600 mb-4">
          Listeyi indir, Excel&apos;de aç, <strong>fiyat</strong> sütununu doldur, kaydet ve geri yükle.
          Boş bıraktığın satırlar değişmez. Eşleştirme <strong>slug</strong> sütunundan yapılır, onu değiştirme.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/admin/products/prices"
            className="inline-flex items-center gap-2 bg-[#0F2040] hover:bg-[#1a3260] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            <LuDownload size={16} /> Listeyi indir (CSV)
          </a>
          <button
            onClick={() => dosyaRef.current?.click()}
            className="inline-flex items-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            <LuUpload size={16} /> Doldurulmuş dosyayı yükle
          </button>
          <input
            ref={dosyaRef}
            type="file"
            accept=".csv,text/csv"
            onChange={dosyaSecildi}
            className="hidden"
          />
        </div>
      </div>

      {/* ─── YUKLEME ONIZLEMESI ─── */}
      {onizleme && (
        <div className="mb-6 rounded-2xl border-2 border-[#FF6000] bg-orange-50/50 p-5">
          <h2 className="font-bold text-gray-900 mb-1">Yüklenen dosyanın özeti</h2>
          <p className="text-sm text-gray-700 mb-4">
            {onizleme.toplamSatir} satır okundu · <strong>{onizleme.degisecek.length}</strong> fiyat
            değişecek · {onizleme.atlananSayisi} satır aynı ya da boş
            {onizleme.sorunlar.length > 0 && <> · <strong className="text-red-600">{onizleme.sorunlar.length} sorunlu satır</strong></>}
          </p>

          {onizleme.sorunlar.length > 0 && (
            <div className="mb-4 bg-white rounded-xl border border-red-200 p-3 max-h-40 overflow-y-auto">
              {onizleme.sorunlar.map((s, i) => (
                <p key={i} className="text-xs text-red-700">
                  Satır {s.satir}{s.slug && ` (${s.slug})`}: {s.sebep}
                </p>
              ))}
              <p className="text-xs text-gray-600 mt-2">Bu satırlar atlanacak, diğerleri uygulanabilir.</p>
            </div>
          )}

          {onizleme.degisecek.length > 0 && (
            <div className="mb-4 bg-white rounded-xl border border-gray-200 max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {onizleme.degisecek.map((d) => (
                    <tr key={d.slug} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2 text-gray-900">{d.ad}</td>
                      <td className="px-3 py-2 text-right text-gray-500 whitespace-nowrap">
                        {d.eskiFiyat > 0 ? `₺${tl(d.eskiFiyat)}` : 'fiyatsız'}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-400">→</td>
                      <td className="px-3 py-2 text-right font-bold text-[#BA4700] whitespace-nowrap">
                        ₺{tl(d.yeniFiyat)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setOnizleme(null)}
              className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={() => kaydet(onizleme.degisecek.map((d) => ({ slug: d.slug, price: d.yeniFiyat })))}
              disabled={kaydediliyor || onizleme.degisecek.length === 0}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
            >
              <LuCheck size={16} />
              {kaydediliyor ? 'Uygulanıyor…' : `${onizleme.degisecek.length} fiyatı uygula`}
            </button>
          </div>
        </div>
      )}

      {/* ─── TABLODAN ELLE GIRIS ─── */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Ürün, kategori veya slug ara…"
          className="flex-1 min-w-[220px] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FF6000]"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={sadeceFiyatsiz}
            onChange={(e) => setSadeceFiyatsiz(e.target.checked)}
            className="w-4 h-4 accent-[#FF6000]"
          />
          Sadece fiyatı olmayanlar
        </label>
      </div>

      {yukleniyor ? (
        <p className="text-gray-500 text-sm">Yükleniyor…</p>
      ) : gorunen.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500">Bu filtrede ürün yok.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Ürün</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Kategori</th>
                <th className="text-right px-4 py-3 font-semibold">Stok</th>
                <th className="text-right px-4 py-3 font-semibold">Mevcut</th>
                <th className="text-right px-4 py-3 font-semibold w-36">Yeni fiyat</th>
              </tr>
            </thead>
            <tbody>
              {gorunen.map((u) => {
                const degisti = bekleyen.some((b) => b.slug === u.slug);
                const ham = taslak[u.slug] ?? '';
                const gecersiz = ham.trim() !== '' && fiyatiCoz(ham) === null;
                return (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-[11px] text-gray-400">{u.slug}</p>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 hidden sm:table-cell">{u.category?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{u.quantity}</td>
                    <td className="px-4 py-2.5 text-right">
                      {u.price > 0 ? (
                        <span className="text-gray-900">₺{tl(u.price)}</span>
                      ) : (
                        <span className="text-[#BA4700] text-xs font-semibold">girilmemiş</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        inputMode="decimal"
                        value={taslak[u.slug] ?? ''}
                        onChange={(e) => setTaslak({ ...taslak, [u.slug]: e.target.value })}
                        placeholder={u.price > 0 ? String(u.price).replace('.', ',') : '0,00'}
                        className={`w-28 text-right border rounded-lg px-2 py-1.5 text-sm focus:outline-none ${
                          gecersiz
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : degisti
                              ? 'border-[#FF6000] bg-orange-50 font-semibold'
                              : 'border-gray-200'
                        }`}
                        title={gecersiz ? 'Bu değer sayıya çevrilemedi' : undefined}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── KAYDET CUBUGU ─── */}
      {bekleyen.length > 0 && (
        <div className="sticky bottom-4 mt-4 flex justify-end">
          <button
            onClick={() => kaydet(bekleyen)}
            disabled={kaydediliyor}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-3 rounded-xl font-bold shadow-lg transition-colors"
          >
            <LuSave size={18} />
            {kaydediliyor ? 'Kaydediliyor…' : `${bekleyen.length} fiyatı kaydet`}
          </button>
        </div>
      )}
    </div>
  );
}
