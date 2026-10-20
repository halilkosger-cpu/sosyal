'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LuDownload, LuUpload, LuSave, LuTriangleAlert, LuCheck, LuPercent } from 'react-icons/lu';
import { fiyatiCoz } from '@/lib/csv';

interface Urun {
  id: string;
  slug: string;
  name: string;
  price: number;
  purchasePrice?: number;
  vatRate?: number;
  quantity: number;
  category?: { name: string } | null;
}

interface Onizleme {
  degisecek: {
    slug: string;
    ad: string;
    eskiFiyat: number;
    yeniFiyat?: number;
    eskiMaliyet: number;
    yeniMaliyet?: number;
    eskiKdv: number;
    yeniKdv?: number;
  }[];
  sorunlar: { satir: number; slug: string; sebep: string }[];
  atlananSayisi: number;
  toplamSatir: number;
}

export default function AdminFiyatlarPage() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [taslakFiyat, setTaslakFiyat] = useState<Record<string, string>>({});
  const [taslakMaliyet, setTaslakMaliyet] = useState<Record<string, string>>({});
  const [taslakKdv, setTaslakKdv] = useState<Record<string, number>>({});
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [arama, setArama] = useState('');
  const [sadeceFiyatsiz, setSadeceFiyatsiz] = useState(false);
  const [sadeceMaliyetsiz, setSadeceMaliyetsiz] = useState(false);
  const [onizleme, setOnizleme] = useState<Onizleme | null>(null);
  const dosyaRef = useRef<HTMLInputElement | null>(null);

  const yukle = () => {
    fetch('/api/admin/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setUrunler(Array.isArray(d) ? d : []);
        setTaslakFiyat({});
        setTaslakMaliyet({});
        setTaslakKdv({});
        setYukleniyor(false);
      })
      .catch(() => setYukleniyor(false));
  };

  useEffect(() => {
    yukle();
  }, []);

  const gorunen = useMemo(() => {
    const a = arama.trim().toLocaleLowerCase('tr');
    return urunler.filter((u) => {
      if (sadeceFiyatsiz && u.price > 0) return false;
      if (sadeceMaliyetsiz && (u.purchasePrice ?? 0) > 0) return false;
      if (!a) return true;
      return (
        u.name.toLocaleLowerCase('tr').includes(a) ||
        u.slug.includes(a) ||
        (u.category?.name ?? '').toLocaleLowerCase('tr').includes(a)
      );
    });
  }, [urunler, arama, sadeceFiyatsiz, sadeceMaliyetsiz]);

  const fiyatsizSayisi = urunler.filter((u) => u.price <= 0).length;
  const maliyetsizSayisi = urunler.filter((u) => (u.purchasePrice ?? 0) <= 0).length;

  /** Kullanıcının değiştirdiği satırlar */
  const bekleyen = useMemo(() => {
    const map = new Map<
      string,
      { slug: string; price?: number; purchasePrice?: number; vatRate?: number }
    >();

    // 1. Fiyat değişiklikleri
    for (const [slug, ham] of Object.entries(taslakFiyat)) {
      if (ham.trim() === '') continue;
      const n = fiyatiCoz(ham);
      if (n === null) continue;
      const urun = urunler.find((u) => u.slug === slug);
      if (!urun || urun.price === n) continue;
      const mev = map.get(slug) || { slug };
      mev.price = n;
      map.set(slug, mev);
    }

    // 2. Maliyet değişiklikleri
    for (const [slug, ham] of Object.entries(taslakMaliyet)) {
      if (ham.trim() === '') continue;
      const n = fiyatiCoz(ham);
      if (n === null) continue;
      const urun = urunler.find((u) => u.slug === slug);
      if (!urun || (urun.purchasePrice ?? 0) === n) continue;
      const mev = map.get(slug) || { slug };
      mev.purchasePrice = n;
      map.set(slug, mev);
    }

    // 3. KDV değişiklikleri
    for (const [slug, kdv] of Object.entries(taslakKdv)) {
      const urun = urunler.find((u) => u.slug === slug);
      if (!urun || (urun.vatRate ?? 20) === kdv) continue;
      const mev = map.get(slug) || { slug };
      mev.vatRate = kdv;
      map.set(slug, mev);
    }

    return Array.from(map.values());
  }, [taslakFiyat, taslakMaliyet, taslakKdv, urunler]);

  const kaydet = async (guncellemeler: any[]) => {
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
      setMesaj(
        r.ok
          ? `✅ ${d.guncellenen} ürünün fiyat, maliyet ve KDV bilgileri başarıyla güncellendi.`
          : `⚠️ ${d.error}`
      );
      if (r.ok) {
        setOnizleme(null);
        yukle();
      }
    } catch {
      setMesaj('⚠️ Bağlantı hatası, veriler kaydedilemedi.');
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
      if (!r.ok) {
        setMesaj(`⚠️ ${d.error}`);
        return;
      }
      setOnizleme(d);
    } catch {
      setMesaj('⚠️ Dosya okunamadı.');
    } finally {
      if (dosyaRef.current) dosyaRef.current.value = '';
    }
  };

  const tl = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 });

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fiyat & Maliyet Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">
            Toplam {urunler.length} ürün ·{' '}
            <strong className={fiyatsizSayisi > 0 ? 'text-[#BA4700]' : ''}>
              {fiyatsizSayisi} fiyatsız
            </strong>{' '}
            ·{' '}
            <strong className={maliyetsizSayisi > 0 ? 'text-amber-600' : ''}>
              {maliyetsizSayisi} maliyetsiz
            </strong>
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href="/api/admin/products/prices"
            className="inline-flex items-center gap-1.5 bg-[#0F2040] hover:bg-[#1a3260] text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            <LuDownload size={15} /> Excel (CSV) İndir
          </a>
          <button
            onClick={() => dosyaRef.current?.click()}
            className="inline-flex items-center gap-1.5 bg-[#CC4E00] hover:bg-[#A63F00] text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            <LuUpload size={15} /> CSV Yükle
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

      {(fiyatsizSayisi > 0 || maliyetsizSayisi > 0) && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <LuTriangleAlert size={20} className="flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Logo GO3 Ön Muhasebe & Kâr Uyumu İçin:</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Fiyatı olmayan ürünler sepete eklenemez. Alış maliyeti (girdi fiyatı) olmayan ürünlerde ise P&L Gelir Tablosunda SMM ve kârlılık 0 görünür.
              </p>
            </div>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <button
              onClick={() => {
                setSadeceFiyatsiz(true);
                setSadeceMaliyetsiz(false);
              }}
              className="bg-white border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-amber-900"
            >
              Fiyatsızları Göster ({fiyatsizSayisi})
            </button>
            <button
              onClick={() => {
                setSadeceMaliyetsiz(true);
                setSadeceFiyatsiz(false);
              }}
              className="bg-white border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-amber-900"
            >
              Maliyetsizleri Göster ({maliyetsizSayisi})
            </button>
          </div>
        </div>
      )}

      {mesaj && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm">
          {mesaj}
        </div>
      )}

      {/* ─── YÜKLEME ÖNİZLEMESİ (CSV) ─── */}
      {onizleme && (
        <div className="mb-6 rounded-2xl border-2 border-[#FF6000] bg-orange-50/60 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">CSV Yükleme Önizlemesi</h2>
          <p className="text-sm text-gray-700 mb-4">
            {onizleme.toplamSatir} satır okundu · <strong>{onizleme.degisecek.length}</strong> ürün
            güncellenecek · {onizleme.atlananSayisi} satır aynı veya boş
            {onizleme.sorunlar.length > 0 && (
              <>
                {' '}
                · <strong className="text-red-600">{onizleme.sorunlar.length} sorunlu satır</strong>
              </>
            )}
          </p>

          {onizleme.degisecek.length > 0 && (
            <div className="mb-4 bg-white rounded-xl border border-gray-200 max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Ürün</th>
                    <th className="px-3 py-2 text-right">Eski Fiyat → Yeni</th>
                    <th className="px-3 py-2 text-right">Eski Maliyet → Yeni</th>
                    <th className="px-3 py-2 text-center">KDV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {onizleme.degisecek.map((d) => (
                    <tr key={d.slug}>
                      <td className="px-3 py-2 font-medium text-gray-900">{d.ad}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <span className="text-gray-400">₺{tl(d.eskiFiyat)}</span> →{' '}
                        <strong className="text-[#BA4700]">
                          {d.yeniFiyat !== undefined ? `₺${tl(d.yeniFiyat)}` : 'Değişmedi'}
                        </strong>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <span className="text-gray-400">₺{tl(d.eskiMaliyet)}</span> →{' '}
                        <strong className="text-blue-700">
                          {d.yeniMaliyet !== undefined ? `₺${tl(d.yeniMaliyet)}` : 'Değişmedi'}
                        </strong>
                      </td>
                      <td className="px-3 py-2 text-center">
                        %{d.yeniKdv ?? d.eskiKdv}
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
              className="px-4 py-2 rounded-xl font-bold text-xs text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={() =>
                kaydet(
                  onizleme.degisecek.map((d) => ({
                    slug: d.slug,
                    ...(d.yeniFiyat !== undefined ? { price: d.yeniFiyat } : {}),
                    ...(d.yeniMaliyet !== undefined ? { purchasePrice: d.yeniMaliyet } : {}),
                    ...(d.yeniKdv !== undefined ? { vatRate: d.yeniKdv } : {}),
                  }))
                )
              }
              disabled={kaydediliyor || onizleme.degisecek.length === 0}
              className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors"
            >
              <LuCheck size={16} />
              {kaydediliyor ? 'Uygulanıyor…' : `${onizleme.degisecek.length} ürünü onayla & uygula`}
            </button>
          </div>
        </div>
      )}

      {/* ─── FİLTRELER ─── */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Ürün, kategori veya slug ara…"
          className="flex-1 min-w-[240px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6000] bg-white"
        />

        <div className="flex items-center gap-4 bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
            <input
              type="checkbox"
              checked={sadeceFiyatsiz}
              onChange={(e) => {
                setSadeceFiyatsiz(e.target.checked);
                if (e.target.checked) setSadeceMaliyetsiz(false);
              }}
              className="w-3.5 h-3.5 accent-[#FF6000]"
            />
            Sadece Fiyatsızlar ({fiyatsizSayisi})
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
            <input
              type="checkbox"
              checked={sadeceMaliyetsiz}
              onChange={(e) => {
                setSadeceMaliyetsiz(e.target.checked);
                if (e.target.checked) setSadeceFiyatsiz(false);
              }}
              className="w-3.5 h-3.5 accent-[#0F2040]"
            />
            Sadece Maliyetsizler ({maliyetsizSayisi})
          </label>
        </div>
      </div>

      {/* ─── TABLO ─── */}
      {yukleniyor ? (
        <p className="text-gray-500 text-sm py-8 text-center">Yükleniyor…</p>
      ) : gorunen.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500">Seçilen kriterde ürün bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Ürün & Kategori</th>
                  <th className="text-center px-3 py-3 font-semibold w-20">Stok</th>
                  <th className="text-right px-3 py-3 font-semibold w-36">
                    Alış Maliyeti (Girdi ₺)
                  </th>
                  <th className="text-right px-3 py-3 font-semibold w-36">
                    Satış Fiyatı (₺)
                  </th>
                  <th className="text-center px-3 py-3 font-semibold w-24">
                    Brüt Kâr %
                  </th>
                  <th className="text-center px-3 py-3 font-semibold w-28">
                    KDV Oranı
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gorunen.map((u) => {
                  // Fiyat hesabı
                  const hamFiyat = taslakFiyat[u.slug];
                  const efektifFiyat =
                    hamFiyat !== undefined ? fiyatiCoz(hamFiyat) ?? u.price : u.price;

                  // Maliyet hesabı
                  const hamMaliyet = taslakMaliyet[u.slug];
                  const efektifMaliyet =
                    hamMaliyet !== undefined
                      ? fiyatiCoz(hamMaliyet) ?? (u.purchasePrice ?? 0)
                      : u.purchasePrice ?? 0;

                  // KDV hesabı
                  const efektifKdv = taslakKdv[u.slug] ?? u.vatRate ?? 20;

                  // Kâr Marjı %
                  const karMarji =
                    efektifFiyat > 0 && efektifMaliyet > 0
                      ? Math.round(((efektifFiyat - efektifMaliyet) / efektifFiyat) * 100)
                      : null;

                  const fiyatDegisti = taslakFiyat[u.slug] !== undefined;
                  const maliyetDegisti = taslakMaliyet[u.slug] !== undefined;
                  const kdvDegisti = taslakKdv[u.slug] !== undefined;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-gray-50/50 transition-colors ${
                        fiyatDegisti || maliyetDegisti || kdvDegisti ? 'bg-orange-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">
                          {u.category?.name ?? 'Kategorisiz'} ·{' '}
                          <code className="text-[10px] text-gray-400">{u.slug}</code>
                        </p>
                      </td>

                      <td className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700">
                        {u.quantity}
                      </td>

                      {/* Alış Maliyeti */}
                      <td className="px-3 py-2.5 text-right">
                        <input
                          inputMode="decimal"
                          value={
                            taslakMaliyet[u.slug] ??
                            ((u.purchasePrice ?? 0) > 0
                              ? String(u.purchasePrice).replace('.', ',')
                              : '')
                          }
                          onChange={(e) =>
                            setTaslakMaliyet({ ...taslakMaliyet, [u.slug]: e.target.value })
                          }
                          placeholder="0,00"
                          className={`w-28 text-right border rounded-lg px-2.5 py-1 text-xs focus:outline-none ${
                            maliyetDegisti
                              ? 'border-blue-500 bg-blue-50/50 font-bold text-blue-900'
                              : 'border-gray-200'
                          }`}
                        />
                      </td>

                      {/* Satış Fiyatı */}
                      <td className="px-3 py-2.5 text-right">
                        <input
                          inputMode="decimal"
                          value={
                            taslakFiyat[u.slug] ??
                            (u.price > 0 ? String(u.price).replace('.', ',') : '')
                          }
                          onChange={(e) =>
                            setTaslakFiyat({ ...taslakFiyat, [u.slug]: e.target.value })
                          }
                          placeholder="0,00"
                          className={`w-28 text-right border rounded-lg px-2.5 py-1 text-xs focus:outline-none ${
                            fiyatDegisti
                              ? 'border-[#FF6000] bg-orange-50/50 font-bold text-[#BA4700]'
                              : u.price <= 0
                                ? 'border-amber-300 bg-amber-50/30'
                                : 'border-gray-200'
                          }`}
                        />
                      </td>

                      {/* Tahmini Brüt Kâr */}
                      <td className="px-3 py-2.5 text-center">
                        {karMarji !== null ? (
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              karMarji >= 40
                                ? 'bg-emerald-100 text-emerald-800'
                                : karMarji >= 20
                                  ? 'bg-blue-100 text-blue-800'
                                  : karMarji > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            %{karMarji}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* KDV Oranı */}
                      <td className="px-3 py-2.5 text-center">
                        <select
                          value={efektifKdv}
                          onChange={(e) =>
                            setTaslakKdv({ ...taslakKdv, [u.slug]: parseInt(e.target.value, 10) })
                          }
                          className={`text-xs border rounded-lg px-2 py-1 font-semibold focus:outline-none ${
                            kdvDegisti
                              ? 'border-[#0F2040] bg-blue-50 text-[#0F2040]'
                              : 'border-gray-200 text-gray-700'
                          }`}
                        >
                          <option value={20}>%20 (Genel)</option>
                          <option value={1}>%1 (Gıda)</option>
                          <option value={10}>%10</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── YAPIŞKAN KAYDET ÇUBUĞU ─── */}
      {bekleyen.length > 0 && (
        <div className="fixed bottom-6 right-8 z-50 flex items-center gap-3 bg-gray-900/90 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-700 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <p className="text-sm font-bold">
              {bekleyen.length} üründe değişiklik yapıldı
            </p>
            <p className="text-xs text-gray-300">
              Fiyat, maliyet ve KDV güncellemeleri bekliyor.
            </p>
          </div>
          <button
            onClick={() => kaydet(bekleyen)}
            disabled={kaydediliyor}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
          >
            <LuSave size={17} />
            {kaydediliyor ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      )}
    </div>
  );
}
