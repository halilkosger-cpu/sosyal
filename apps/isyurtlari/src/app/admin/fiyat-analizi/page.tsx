'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LuTrendingUp, LuRefreshCw, LuDownload, LuPrinter, LuCopy, LuCheck,
  LuSearch, LuArrowUpRight, LuArrowDownRight, LuEqual, LuTriangleAlert,
  LuSparkles, LuFileText, LuShieldCheck, LuTag,
} from 'react-icons/lu';
import type { MerchantRaporSonucu } from '@/lib/google-merchant-api';

type FiltreDurumu = 'TUMU' | 'AVANTAJLI' | 'REKABETCI' | 'PAHALI' | 'FIYATSIZ';

export default function AdminFiyatAnaliziPage() {
  const [rapor, setRapor] = useState<MerchantRaporSonucu | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [arama, setArama] = useState('');
  const [durumFiltresi, setDurumFiltresi] = useState<FiltreDurumu>('TUMU');
  const [seciliKategori, setSeciliKategori] = useState<string>('TUMU');
  const [kopyalandi, setKopyalandi] = useState(false);
  const [raporModalAcik, setRaporModalAcik] = useState(false);

  const veriYukle = async () => {
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch('/api/admin/merchant/reports', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Rapor alınamadı (HTTP ${res.status})`);
      }
      const data: MerchantRaporSonucu = await res.json();
      setRapor(data);
    } catch (err: any) {
      console.error('Fiyat analizi yükleme hatası:', err);
      setHata(err?.message || 'Veriler yüklenirken bir sorun oluştu.');
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    veriYukle();
  }, []);

  // Kategoriler Listesi
  const kategoriler = useMemo(() => {
    if (!rapor?.fiyatRekabeti) return [];
    const set = new Set<string>();
    rapor.fiyatRekabeti.forEach((k) => {
      if (k.kategori) set.add(k.kategori);
    });
    return Array.from(set).sort();
  }, [rapor]);

  // Filtrelenmiş Ürün Listesi
  const filtrelenmisUrunler = useMemo(() => {
    if (!rapor?.fiyatRekabeti) return [];
    const q = arama.trim().toLocaleLowerCase('tr-TR');

    return rapor.fiyatRekabeti.filter((item) => {
      // Durum filtresi
      if (durumFiltresi !== 'TUMU' && item.rekabetDurumu !== durumFiltresi) {
        return false;
      }
      // Kategori filtresi
      if (seciliKategori !== 'TUMU' && item.kategori !== seciliKategori) {
        return false;
      }
      // Arama filtresi
      if (q) {
        const adEslesir = item.baslik.toLocaleLowerCase('tr-TR').includes(q);
        const slugEslesir = item.slug.toLocaleLowerCase('tr-TR').includes(q);
        const markaEslesir = item.marka.toLocaleLowerCase('tr-TR').includes(q);
        if (!adEslesir && !slugEslesir && !markaEslesir) return false;
      }
      return true;
    });
  }, [rapor, arama, durumFiltresi, seciliKategori]);

  // Günlük Rapor Metnini Kopyalama
  const gunlukRaporuKopyala = () => {
    if (!rapor?.ozet?.gunlukOzetMetni) return;
    navigator.clipboard.writeText(rapor.ozet.gunlukOzetMetni);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2500);
  };

  // CSV / Excel İndirme
  const csvIndir = () => {
    if (!rapor?.fiyatRekabeti) return;
    const basliklar = [
      'Ürün ID',
      'Ürün Adı',
      'Kategori',
      'Bizim Satış Fiyatı (TL)',
      'Alış Maliyeti (TL)',
      'Kâr Marjı (%)',
      'Piyasa Kıyaslama Fiyatı (TL)',
      'Fiyat Farkı (TL)',
      'Fiyat Farkı (%)',
      'Rekabet Durumu',
      'Öneri ve Aksiyon',
    ];

    const satirlar = rapor.fiyatRekabeti.map((k) => [
      `"${k.urunId}"`,
      `"${k.baslik.replace(/"/g, '""')}"`,
      `"${k.kategori || ''}"`,
      k.magazaFiyati,
      k.alisMaliyeti,
      k.karMarji ?? '',
      k.piyasaKiyaslamaFiyati,
      k.farkTutari,
      `%${k.farkYuzdesi}`,
      k.rekabetDurumu,
      `"${k.oneri.replace(/"/g, '""')}"`,
    ]);

    const csvIcerik = '\uFEFF' + [basliklar.join(';'), ...satirlar.map((s) => s.join(';'))].join('\n');
    const blob = new Blob([csvIcerik], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Piyasa_Fiyat_Analizi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ozet = rapor?.ozet;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 print:p-0 print:max-w-none">
      {/* ── ÜST BAŞLIK & BUTONLAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl shadow-sm">
              <LuTrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Piyasa Fiyat & Rekabet Analizi
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Google Merchant Center ve pazar yeri muadilleriyle günlük otomatik fiyat kıyaslama motoru
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Fiyatlar sayfasına hızlı geçiş */}
          <Link
            href="/admin/fiyatlar"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <LuTag className="w-3.5 h-3.5" />
            Fiyat Düzenle
          </Link>

          {/* Günlük Rapor Göster & Kopyala */}
          <button
            type="button"
            onClick={() => setRaporModalAcik(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <LuFileText className="w-3.5 h-3.5 text-amber-700" />
            Günlük Rapor
          </button>

          {/* Hızlı Kopyala */}
          <button
            type="button"
            onClick={gunlukRaporuKopyala}
            disabled={!rapor}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              kopyalandi
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {kopyalandi ? <LuCheck className="w-3.5 h-3.5" /> : <LuCopy className="w-3.5 h-3.5" />}
            {kopyalandi ? 'Kopyalandı!' : 'Özeti Kopyala'}
          </button>

          {/* Excel CSV */}
          <button
            type="button"
            onClick={csvIndir}
            disabled={!rapor}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LuDownload className="w-3.5 h-3.5" />
            Excel
          </button>

          {/* Yazdır */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LuPrinter className="w-3.5 h-3.5" />
            Yazdır
          </button>

          {/* Yenile */}
          <button
            type="button"
            onClick={veriYukle}
            disabled={yukleniyor}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#FF6000] text-white hover:bg-[#e05500] disabled:opacity-50 transition-colors shadow-sm"
          >
            <LuRefreshCw className={`w-3.5 h-3.5 ${yukleniyor ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* Hata Bildirimi */}
      {hata && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <LuTriangleAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Rapor yüklenemedi</p>
            <p className="text-red-700 mt-0.5">{hata}</p>
          </div>
        </div>
      )}

      {/* ── 5 ADET KPI KARTLARI ── */}
      {ozet && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 print:grid-cols-5">
          {/* 1. Rekabetçilik Skoru */}
          <div className="col-span-2 md:col-span-1 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-4 shadow-sm border border-neutral-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1">
                <span>Rekabetçilik Skoru</span>
                <LuShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  %{ozet.rekabetcilikSkoru}
                </span>
                <span className="text-xs text-emerald-400 font-semibold">
                  {ozet.rekabetcilikSkoru >= 75 ? 'Güçlü' : 'Geliştirilmeli'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2">
              Piyasaya denk veya ucuz olan ürünlerin genel oranı
            </p>
          </div>

          {/* 2. Piyasadan Ucuz / Avantajlı */}
          <button
            type="button"
            onClick={() => setDurumFiltresi(durumFiltresi === 'AVANTAJLI' ? 'TUMU' : 'AVANTAJLI')}
            className={`text-left rounded-2xl p-4 border transition-all ${
              durumFiltresi === 'AVANTAJLI'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400'
                : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-emerald-700 mb-1">
              <span>Piyasadan Ucuz</span>
              <LuArrowDownRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{ozet.avantajliUrun}</span>
              <span className="text-xs text-gray-500">
                (%{Math.round((ozet.avantajliUrun / (ozet.fiyatliUrun || 1)) * 100)})
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Yüksek satış potansiyeli</p>
          </button>

          {/* 3. Piyasa ile Dengeli */}
          <button
            type="button"
            onClick={() => setDurumFiltresi(durumFiltresi === 'REKABETCI' ? 'TUMU' : 'REKABETCI')}
            className={`text-left rounded-2xl p-4 border transition-all ${
              durumFiltresi === 'REKABETCI'
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400'
                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-blue-700 mb-1">
              <span>Piyasaya Denk</span>
              <LuEqual className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{ozet.dengeliUrun}</span>
              <span className="text-xs text-gray-500">
                (%{Math.round((ozet.dengeliUrun / (ozet.fiyatliUrun || 1)) * 100)})
              </span>
            </div>
            <p className="text-[11px] text-blue-700 font-medium mt-1">Dengeli piyasa standardı</p>
          </button>

          {/* 4. Piyasadan Pahalı */}
          <button
            type="button"
            onClick={() => setDurumFiltresi(durumFiltresi === 'PAHALI' ? 'TUMU' : 'PAHALI')}
            className={`text-left rounded-2xl p-4 border transition-all ${
              durumFiltresi === 'PAHALI'
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400'
                : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-rose-700 mb-1">
              <span>Piyasadan Pahalı</span>
              <LuArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{ozet.pahaliUrun}</span>
              <span className="text-xs text-gray-500">
                (%{Math.round((ozet.pahaliUrun / (ozet.fiyatliUrun || 1)) * 100)})
              </span>
            </div>
            <p className="text-[11px] text-rose-700 font-medium mt-1">Satış kaybı riski (İncele)</p>
          </button>

          {/* 5. Fiyatsız / 0 TL */}
          <button
            type="button"
            onClick={() => setDurumFiltresi(durumFiltresi === 'FIYATSIZ' ? 'TUMU' : 'FIYATSIZ')}
            className={`text-left rounded-2xl p-4 border transition-all ${
              durumFiltresi === 'FIYATSIZ'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400'
                : 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-amber-700 mb-1">
              <span>Fiyatsız (0 TL)</span>
              <LuTriangleAlert className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{ozet.fiyatsizUrun}</span>
              <span className="text-xs text-gray-500">adet</span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-1">Satışa kapalı ürünler</p>
          </button>
        </div>
      )}

      {/* ── GÜNLÜK STRATEJİK YÖNETİM TAVSİYESİ BANDI ── */}
      {ozet && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200/80 p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-amber-500 text-white rounded-xl shadow-sm shrink-0">
              <LuSparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-amber-950">Günün Fiyatlandırma Aksiyon Özeti</h2>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                Ortalama katalog kâr marjınız <strong>%{ozet.ortalamaKarMarji}</strong> seviyesinde. 
                Piyasadan daha pahalı olan <strong>{ozet.pahaliUrun}</strong> üründe yapılacak ortalama %5–10’luk fiyat düzeltmesi Google Alışveriş tıklama oranınızı yükseltecektir.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRaporModalAcik(true)}
            className="shrink-0 self-start md:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-800 hover:bg-amber-900 text-white shadow-sm transition-colors"
          >
            <LuFileText className="w-4 h-4" />
            Detaylı Rapor Metni
          </button>
        </div>
      )}

      {/* ── SÜZGEÇLER & ARAMA ÇUBUĞU ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm print:hidden">
        {/* Arama Input */}
        <div className="relative flex-1">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Ürün adı, marka veya slug ile ara..."
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6000]/20 focus:border-[#FF6000]"
          />
        </div>

        {/* Kategori Filtresi */}
        <div className="flex items-center gap-2">
          <select
            value={seciliKategori}
            onChange={(e) => setSeciliKategori(e.target.value)}
            className="px-3 py-2 text-xs md:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6000] bg-white text-gray-700"
          >
            <option value="TUMU">Tüm Kategoriler ({rapor?.fiyatRekabeti.length ?? 0})</option>
            {kategoriler.map((kat) => (
              <option key={kat} value={kat}>
                {kat}
              </option>
            ))}
          </select>
        </div>

        {/* Durum Filtre Butonları */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {(
            [
              { id: 'TUMU', label: 'Tümü' },
              { id: 'AVANTAJLI', label: '🟢 Ucuz' },
              { id: 'REKABETCI', label: '🔵 Denk' },
              { id: 'PAHALI', label: '🔴 Pahalı' },
              { id: 'FIYATSIZ', label: '⚪ 0 TL' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDurumFiltresi(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                durumFiltresi === tab.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ÜRÜN KARŞILAŞTIRMA VE ANALİZ TABLOSU ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-xs md:text-sm font-bold text-gray-900">
              Ürün Fiyat Karşılaştırma Listesi
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              ({filtrelenmisUrunler.length} ürün listeleniyor)
            </span>
          </div>
          {durumFiltresi !== 'TUMU' && (
            <button
              type="button"
              onClick={() => setDurumFiltresi('TUMU')}
              className="text-xs text-[#FF6000] hover:underline font-semibold"
            >
              Filtreyi Temizle
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-[11px] font-semibold">
                <th className="px-4 py-3">Ürün & Kategori</th>
                <th className="px-3 py-3 text-right">Bizim Satış</th>
                <th className="px-3 py-3 text-right">Alış / Maliyet</th>
                <th className="px-3 py-3 text-center">Kâr Marjı</th>
                <th className="px-3 py-3 text-right">Piyasa Benchmark</th>
                <th className="px-3 py-3 text-center">Fiyat Farkı</th>
                <th className="px-3 py-3 text-center">Durum</th>
                <th className="px-4 py-3">Öneri & Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {yukleniyor ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <LuRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FF6000]" />
                    Piyasa fiyat modelleri ve kıyaslama raporu hesaplanıyor...
                  </td>
                </tr>
              ) : filtrelenmisUrunler.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Seçilen kriterlere uygun ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                filtrelenmisUrunler.map((u) => {
                  const farkPozitif = u.farkYuzdesi > 0;

                  return (
                    <tr
                      key={u.urunId}
                      className="hover:bg-orange-50/30 transition-colors group"
                    >
                      {/* Ürün & Kategori */}
                      <td className="px-4 py-3 max-w-[280px]">
                        <div className="flex items-center gap-2.5">
                          {u.gorsel ? (
                            <img
                              src={u.gorsel}
                              alt=""
                              className="w-9 h-9 object-cover rounded-lg border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                              <LuTag className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate" title={u.baslik}>
                              {u.baslik}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {u.kategori} · {u.marka}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Bizim Satış Fiyatı */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {u.magazaFiyati > 0 ? (
                          <span className="font-bold text-gray-900 text-sm">
                            {u.magazaFiyati.toLocaleString('tr-TR')} ₺
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">
                            0 TL (Eksik)
                          </span>
                        )}
                      </td>

                      {/* Alış Maliyeti */}
                      <td className="px-3 py-3 text-right whitespace-nowrap text-gray-500">
                        {u.alisMaliyeti > 0 ? (
                          <span>{u.alisMaliyeti.toLocaleString('tr-TR')} ₺</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Kâr Marjı */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {u.karMarji !== null ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              u.karMarji >= 40
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.karMarji >= 20
                                  ? 'bg-blue-100 text-blue-800'
                                  : u.karMarji > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            %{u.karMarji}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Piyasa Benchmark Fiyatı */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                          {u.piyasaKiyaslamaFiyati.toLocaleString('tr-TR')} ₺
                        </span>
                      </td>

                      {/* Fiyat Farkı */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {u.rekabetDurumu === 'FIYATSIZ' ? (
                          <span className="text-gray-400 text-[11px]">—</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-0.5 font-bold text-[11px] px-2 py-0.5 rounded-full ${
                              u.farkYuzdesi < -3
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.farkYuzdesi > 5
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {farkPozitif ? '+' : ''}%{u.farkYuzdesi}
                          </span>
                        )}
                      </td>

                      {/* Durum Rozeti */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {u.rekabetDurumu === 'AVANTAJLI' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Avantajlı (Ucuz)
                          </span>
                        )}
                        {u.rekabetDurumu === 'REKABETCI' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Piyasaya Denk
                          </span>
                        )}
                        {u.rekabetDurumu === 'PAHALI' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Piyasadan Pahalı
                          </span>
                        )}
                        {u.rekabetDurumu === 'FIYATSIZ' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Fiyat Belirlenmedi
                          </span>
                        )}
                      </td>

                      {/* Öneri & Aksiyon */}
                      <td className="px-4 py-3 text-gray-600 text-[11px] leading-relaxed max-w-[320px]">
                        {u.oneri}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── GÜNLÜK RAPOR ÖNİZLEME MODALI ── */}
      {raporModalAcik && ozet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-gray-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <LuFileText className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900 text-base">Günlük Fiyat & Rekabet Raporu</h3>
              </div>
              <button
                type="button"
                onClick={() => setRaporModalAcik(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              Aşağıdaki metni panoya kopyalayıp yönetim kuruluna, e-posta veya WhatsApp gruplarına günlük analiz olarak iletebilirsiniz:
            </p>

            <pre className="flex-1 bg-neutral-900 text-neutral-100 font-mono text-xs p-4 rounded-xl overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
              {ozet.gunlukOzetMetni}
            </pre>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRaporModalAcik(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={gunlukRaporuKopyala}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#FF6000] hover:bg-[#e05500] text-white shadow-sm transition-colors"
              >
                {kopyalandi ? <LuCheck className="w-4 h-4" /> : <LuCopy className="w-4 h-4" />}
                {kopyalandi ? 'Kopyalandı!' : 'Metni Kopyala'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
