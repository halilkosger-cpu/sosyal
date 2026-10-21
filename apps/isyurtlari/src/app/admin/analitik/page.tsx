'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LuUsers, LuEye, LuClock, LuPercent, LuTrendingUp,
  LuSearch, LuGlobe, LuSmartphone, LuMonitor, LuTablet,
  LuRefreshCw, LuCalendar, LuShieldCheck, LuSparkles,
  LuBot, LuShoppingBag, LuDollarSign, LuArrowUpRight,
  LuChevronRight, LuCompass, LuActivity,
} from 'react-icons/lu';

type Period = 'bugun' | 'dun' | '7gun' | '30gun' | 'tum-zamanlar';
type ActiveTab = 'genel' | 'arama' | 'sehirler' | 'demografi' | 'cihazlar' | 'sayfalar' | 'canli' | 'botlar';

export default function AdminAnalitikPage() {
  const [period, setPeriod] = useState<Period>('bugun');
  const [activeTab, setActiveTab] = useState<ActiveTab>('genel');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const veriYukle = async (p = period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analitik?period=${p}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Sunucu hatası (${res.status})`);
      }
      const d = await res.json();
      setData(d);
      setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
    } catch (err: any) {
      console.error('Analitik yükleme hatası:', err);
      setError(err?.message || 'Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    veriYukle(period);
    // 30 saniyede bir otomatik canli veri tazeleme
    const timer = setInterval(() => {
      veriYukle(period);
    }, 30000);
    return () => clearInterval(timer);
  }, [period]);

  const sureFormatla = (saniye: number) => {
    if (!saniye || saniye < 1) return '< 1 sn';
    if (saniye < 60) return `${saniye} sn`;
    const dk = Math.floor(saniye / 60);
    const sn = saniye % 60;
    return `${dk} dk ${sn > 0 ? `${sn} sn` : ''}`;
  };

  const paraFormat = (val: number | undefined) =>
    (val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

  const ozet = data?.ozet || {};
  const demografi = data?.demografi || {};

  return (
    <div className="space-y-6">
      {/* Hata Bildirimi */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="font-extrabold text-red-600">⚠️ Bağlantı Uyarısı:</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => veriYukle()}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Yeniden Dene
          </button>
        </div>
      )}

      {/* ─── 1. ÜST BAŞLIK, ZAMAN FİLTRESİ & CANLI YENİLEME ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-[#0F2040] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider">
              ENTERPRISE INTELLIGENCE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Canlı Akış Aktif
            </span>
            {ozet?.toplamVeritabaniKaydi !== undefined && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                📊 {ozet.toplamVeritabaniKaydi} Kayıtlı Ziyaret
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2 flex items-center gap-2">
            <LuActivity className="text-[#CC4E00]" /> Ziyaretçi & Trafik Analitiği
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Arama motorları, canlı IP'ler, şehir/bölge dağılımları ve müşteri demografik istatistikleri.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Zaman Periyodu Seçici */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'bugun', label: 'Bugün' },
              { id: 'dun', label: 'Dün' },
              { id: '7gun', label: 'Son 7 Gün' },
              { id: '30gun', label: 'Son 30 Gün' },
              { id: 'tum-zamanlar', label: 'Tüm Zamanlar' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as Period)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === p.id
                    ? 'bg-[#0F2040] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Canlı Yenile Butonu */}
          <button
            onClick={() => veriYukle()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            title="Verileri Canlı Yenile"
          >
            <LuRefreshCw size={13} className={loading ? 'animate-spin text-orange-500' : ''} />
            <span>Yenile</span>
            {lastUpdated && <span className="text-[10px] text-gray-400 font-normal">({lastUpdated})</span>}
          </button>
        </div>
      </div>

      {/* ─── 2. ANA KPI KARTLARI ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Tekil Ziyaretçi */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tekil Ziyaretçi</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <LuUsers size={16} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-gray-900">
            {ozet?.tekilZiyaretci ?? 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Farklı insan ziyaretçi sayısı</p>
        </div>

        {/* Sayfa Görüntüleme */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-violet-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sayfa Görüntüleme</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <LuEye size={16} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-gray-900">
            {ozet?.toplamSayfa ?? 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Ort. {ozet?.sayfaBasiOturum ?? 1} sayfa / oturum
          </p>
        </div>

        {/* Ortalama Süre */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ortalama Süre</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <LuClock size={16} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-gray-900">
            {sureFormatla(ozet?.ortalamaSure)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Sayfa başına geçirilen zaman</p>
        </div>

        {/* Dönüşüm Oranı */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dönüşüm Oranı</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LuPercent size={16} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-emerald-600">
            %{ozet?.donusumOrani ?? 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{ozet?.siparisSayisi ?? 0} adet sipariş oluştu</p>
        </div>

        {/* Toplam Satış Cirosu */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bu Dönem Hasılat</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#CC4E00] flex items-center justify-center">
              <LuDollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-gray-900">
            {paraFormat(ozet?.toplamCiro)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Ort. Sepet: {paraFormat(demografi?.ortalamaSepet)}
          </p>
        </div>
      </div>

      {/* ─── 3. SEKME GEZİNTİSİ ─── */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
        {[
          { id: 'genel', label: '📊 Genel Bakış & Trend', icon: LuTrendingUp },
          { id: 'arama', label: '🔍 Arama Motorları & Kaynaklar', icon: LuSearch },
          { id: 'sehirler', label: '📍 Şehir & Konum Dağılımı', icon: LuGlobe },
          { id: 'demografi', label: '👥 Demografi & Müşteri Analizi', icon: LuUsers },
          { id: 'sayfalar', label: '📄 Popüler Sayfalar & Ürünler', icon: LuCompass },
          { id: 'cihazlar', label: '📱 Cihaz & Tarayıcı', icon: LuSmartphone },
          { id: 'canli', label: `⚡ Canlı Akış (${data?.canliAkis?.length || 0})`, icon: LuActivity },
          { id: 'botlar', label: '🤖 Bot & Crawler Taramaları', icon: LuBot },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as ActiveTab)}
            className={`px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${
              activeTab === t.id
                ? 'border-[#CC4E00] text-[#CC4E00] bg-orange-50/50 font-bold'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ─── 4. SEKME İÇERİKLERİ ─── */}

      {/* SEKME 1: GENEL BAKIŞ & SAATLİK/GÜNLÜK AKIŞ */}
      {activeTab === 'genel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon: Zaman Serisi Çubuk Grafiği */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {period === 'bugun' || period === 'dun' ? 'Saatlik Ziyaret Dağılımı (00:00 - 23:00)' : 'Günlük Ziyaret Trendi'}
                </h2>
                <p className="text-xs text-gray-400">Tekil ziyaretçi ve sayfa gösterim akışı</p>
              </div>
              <span className="text-xs font-bold text-[#0F2040] bg-blue-50 px-2.5 py-1 rounded-lg">
                Toplam {ozet?.tekilZiyaretci ?? 0} Tekil
              </span>
            </div>

            {data?.zamanSerisi && data.zamanSerisi.length > 0 ? (
              <div className="space-y-3 pt-2">
                <div className="h-56 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-1 border-b border-gray-100">
                  {data.zamanSerisi.map((z: any, idx: number) => {
                    const maxVal = Math.max(...data.zamanSerisi.map((item: any) => item.sayfa), 1);
                    const yukseklik = Math.max(Math.round((z.sayfa / maxVal) * 100), z.sayfa > 0 ? 12 : 2);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-12 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                          <div className="bg-gray-900 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                            <strong>{z.etiket}</strong>: {z.tekil} Tekil · {z.sayfa} Sayfa
                          </div>
                          <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.5" />
                        </div>

                        {/* Çubuk */}
                        <div
                          style={{ height: `${yukseklik}%` }}
                          className={`w-full rounded-t transition-all ${
                            z.tekil > 0 ? 'bg-[#0F2040] group-hover:bg-[#CC4E00]' : 'bg-gray-100'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X Ekseni Etiketleri */}
                <div className="flex justify-between text-[10px] text-gray-400 px-1 font-mono">
                  <span>{data.zamanSerisi[0]?.etiket}</span>
                  <span>{data.zamanSerisi[Math.floor(data.zamanSerisi.length / 2)]?.etiket}</span>
                  <span>{data.zamanSerisi[data.zamanSerisi.length - 1]?.etiket}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400 text-xs">Bu periyotta henüz ziyaret verisi bulunmuyor.</div>
            )}
          </div>

          {/* Sağ Kolon: Arama Motorları & Trafik Kaynakları Özeti */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-900">Trafik Kanalları</h2>
              <Link href="#" onClick={(e) => { e.preventDefault(); setActiveTab('arama'); }} className="text-xs font-bold text-[#CC4E00] hover:underline">
                Detaylar &rarr;
              </Link>
            </div>

            <div className="space-y-3.5">
              {data?.kaynaklar && data.kaynaklar.length > 0 ? (
                data.kaynaklar.slice(0, 6).map((k: any) => (
                  <div key={k.kaynak} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-800 flex items-center gap-1.5">
                        {k.kaynak === 'google' ? '🔍 Google Arama' :
                         k.kaynak === 'bing' ? '🔎 Bing Arama' :
                         k.kaynak === 'yandex' ? '🔴 Yandex Arama' :
                         k.kaynak === 'instagram' ? '📸 Instagram' :
                         k.kaynak === 'direct' ? '🔗 Doğrudan Giriş' : k.ad}
                      </span>
                      <span className="text-gray-900 font-bold font-mono">
                        {k.tekil} kişi <span className="text-gray-400 font-normal">({k.yuzde}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${k.yuzde}%` }}
                        className={`h-full rounded-full ${
                          k.kaynak === 'google' ? 'bg-blue-600' :
                          k.kaynak === 'bing' ? 'bg-teal-600' :
                          k.kaynak === 'yandex' ? 'bg-red-600' :
                          k.kaynak === 'instagram' ? 'bg-pink-600' :
                          'bg-[#0F2040]'
                        }`}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 text-xs">Henüz veri yok</div>
              )}
            </div>

            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-blue-900 text-xs leading-relaxed mt-4">
              <p className="font-bold flex items-center gap-1">
                <LuShieldCheck size={14} className="text-blue-700" /> %100 Bağımsız & Dahili Analitik
              </p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Veriler doğrudan kendi sunucunuzda toplanır; üçüncü parti reklam firmaları veya izleyicilerle paylaşılmaz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SEKME 2: ARAMA MOTORLARI & KAYNAKLAR */}
      {activeTab === 'arama' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold text-gray-900">Arama Motoru & Referans Dağılımı</h2>
            <p className="text-xs text-gray-500">
              Sitenize gelen ziyaretçilerin Google, Bing, Yandex, sosyal medya veya doğrudan giriş oranları.
            </p>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 uppercase text-[11px]">
                  <th className="py-3 px-4">Trafik Kaynağı</th>
                  <th className="py-3 px-4 text-center">Tekil Ziyaretçi</th>
                  <th className="py-3 px-4 text-center">Toplam Sayfa Gösterimi</th>
                  <th className="py-3 px-4 text-center">Trafik Payı</th>
                  <th className="py-3 px-4">Oran Çubuğu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.kaynaklar?.map((k: any) => (
                  <tr key={k.kaynak} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0F2040]" />
                      {k.ad}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-800">
                      {k.tekil}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-gray-600">
                      {k.sayfa}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-extrabold text-[#CC4E00]">
                      %{k.yuzde}
                    </td>
                    <td className="py-3.5 px-4 w-44">
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div style={{ width: `${k.yuzde}%` }} className="bg-[#CC4E00] h-full rounded-full" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEKME 3: ŞEHİR & KONUM DAĞILIMI */}
      {activeTab === 'sehirler' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold text-gray-900">Coğrafi Konum & Şehir Dağılımı</h2>
            <p className="text-xs text-gray-500">
              IP adresi ve ağ yönlendirmesi üzerinden tespit edilen Türkiye illeri ve ziyaretçi sayıları.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.sehirler && data.sehirler.length > 0 ? (
              data.sehirler.map((s: any, idx: number) => {
                const yuzde = ozet?.tekilZiyaretci > 0 ? Math.round((s.tekil / ozet.tekilZiyaretci) * 100) : 0;
                return (
                  <div key={s.sehir} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-orange-200 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{s.sehir}</span>
                      </div>
                      <span className="text-xs font-bold text-[#CC4E00] font-mono">
                        {s.tekil} Ziyaretçi
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div style={{ width: `${Math.max(yuzde, 5)}%` }} className="bg-[#0F2040] h-full rounded-full" />
                    </div>

                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>{s.sayfa} Sayfa Gösterimi</span>
                      <span>%{yuzde} Pay</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-400 text-xs">Henüz konum verisi oluşmadı.</div>
            )}
          </div>
        </div>
      )}

      {/* SEKME 4: DEMOGRAFİ & MÜŞTERİ ANALİZİ (ÖZEL TALEP) */}
      {activeTab === 'demografi' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#0F2040] to-[#1c386e] text-white p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LuUsers className="text-orange-400" /> Müşteri Demografi & Satın Alma Davranışları
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-2xl">
              İnternet protokolleri gereği tarayıcılar anonim ziyaretçilerin yaş/cinsiyet bilgisini aktarmaz;
              ancak <strong>sitenizden sipariş veren gerçek müşterilerin</strong> isim ve lokasyon verileri üzerinden
              yapılan akıllı demografik analiz aşağıda sunulmuştur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cinsiyet Dağılım Kartı */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-base border-b pb-2">Tahmini Cinsiyet Dağılımı</h3>
              <p className="text-xs text-gray-500">Müşteri isim analitiği kütüphanesi ile hesaplanmıştır.</p>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-pink-700">👩 Kadın Alıcılar</span>
                    <span className="font-mono text-gray-900">%{demografi.kadinYuzde}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div style={{ width: `${demografi.kadinYuzde}%` }} className="bg-pink-500 h-full rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-700">👨 Erkek Alıcılar</span>
                    <span className="font-mono text-gray-900">%{demografi.erkekYuzde}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div style={{ width: `${demografi.erkekYuzde}%` }} className="bg-blue-600 h-full rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-600">🏢 Kurumsal / Belirsiz</span>
                    <span className="font-mono text-gray-900">%{demografi.kurumsalYuzde}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div style={{ width: `${demografi.kurumsalYuzde}%` }} className="bg-gray-400 h-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Satın Alma Metrikleri */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-base border-b pb-2">Sepet & Sipariş Gücü</h3>
              <p className="text-xs text-gray-500">Dönüşüm ve harcama dinamikleri</p>

              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-100">
                  <span className="text-xs font-bold text-[#CC4E00]">Ortalama Sepet Tutarı (AOV)</span>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {paraFormat(demografi.ortalamaSepet)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-800">Toplam Sipariş Veren Müşteri</span>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {demografi.toplamSiparisVeren ?? 0} Kişi
                  </p>
                </div>
              </div>
            </div>

            {/* Demografi İpuçları */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-base border-b pb-2">Pazarlama & Kitle Önerisi</h3>
              <ul className="text-xs text-gray-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Doğal Gıda Ürünleri:</strong> Zeytinyağı, peynir ve reçel kategorisinde aile alışverişi ve kadın kitle baskındır.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Hediyelik & Ahşap:</strong> Bakır, deri ve oltu taşı tesbih ürünlerinde erkek alıcı oranı %60'ın üzerindedir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><strong>Mobil Alışveriş:</strong> Ziyaretçilerin ezici çoğunluğu cep telefonundan sipariş oluşturmaktadır.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SEKME 5: POPÜLER SAYFALAR & ÜRÜNLER */}
      {activeTab === 'sayfalar' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold text-gray-900">En Çok Ziyaret Edilen Sayfalar ve Ürünler</h2>
            <p className="text-xs text-gray-500">Müşterilerin en çok ilgi gösterdiği ve zaman geçirdiği sayfalar.</p>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 uppercase text-[11px]">
                  <th className="py-3 px-4">Sayfa / Ürün Yolu</th>
                  <th className="py-3 px-4 text-center">Görüntüleme</th>
                  <th className="py-3 px-4 text-center">Tekil Ziyaretçi</th>
                  <th className="py-3 px-4 text-center">Ort. Süre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.sayfalar?.map((s: any) => (
                  <tr key={s.sayfa} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <a href={s.sayfa} target="_blank" rel="noopener noreferrer" className="hover:text-[#CC4E00] flex items-center gap-1.5">
                        <span className="font-mono text-blue-700">{s.sayfa}</span>
                        {s.baslik && <span className="text-gray-400 font-normal">({s.baslik})</span>}
                        <LuArrowUpRight size={12} className="text-gray-400" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-900">
                      {s.goruntuleme}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-gray-700">
                      {s.tekil}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-amber-900 font-semibold">
                      {sureFormatla(s.ortalamaSure)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEKME 6: CİHAZ & TARAYICI */}
      {activeTab === 'cihazlar' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cihaz Türü */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base border-b pb-2">Cihaz Dağılımı</h3>
            <div className="space-y-3 pt-2">
              {data?.cihazlar?.map((c: any) => (
                <div key={c.cihaz} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-gray-800">
                      {c.cihaz === 'MOBIL' ? <LuSmartphone size={14} className="text-orange-500" /> :
                       c.cihaz === 'TABLET' ? <LuTablet size={14} className="text-blue-500" /> :
                       <LuMonitor size={14} className="text-gray-700" />}
                      {c.cihaz === 'MOBIL' ? 'Mobil Telefon' : c.cihaz === 'TABLET' ? 'Tablet' : 'Masaüstü Bilgisayar'}
                    </span>
                    <span className="font-mono font-bold">{c.tekil} Kişi</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${ozet?.tekilZiyaretci > 0 ? (c.tekil / ozet.tekilZiyaretci) * 100 : 0}%` }}
                      className="bg-[#0F2040] h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* İşletim Sistemi */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base border-b pb-2">İşletim Sistemleri</h3>
            <div className="space-y-3 pt-2">
              {data?.isletimSistemleri?.map((os: any) => (
                <div key={os.os} className="flex justify-between text-xs border-b border-gray-50 pb-2">
                  <span className="font-medium text-gray-700">{os.os}</span>
                  <span className="font-mono font-bold text-gray-900">{os.tekil} Ziyaretçi</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tarayıcılar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base border-b pb-2">Kullanılan Tarayıcılar</h3>
            <div className="space-y-3 pt-2">
              {data?.tarayicilar?.map((t: any) => (
                <div key={t.tarayici} className="flex justify-between text-xs border-b border-gray-50 pb-2">
                  <span className="font-medium text-gray-700">{t.tarayici}</span>
                  <span className="font-mono font-bold text-gray-900">{t.tekil} Ziyaretçi</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEKME 7: CANLI ZİYARETÇİ AKIŞI (REALTIME STREAM) */}
      {activeTab === 'canli' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Gerçek Zamanlı Canlı Ziyaretçi Akışı (Son 30 Olay)
              </h2>
              <p className="text-xs text-gray-500">Sitenize bağlanan gerçek ziyaretçilerin anlık kayıtları.</p>
            </div>
            <button
              onClick={() => veriYukle()}
              className="text-xs font-bold text-[#CC4E00] hover:underline flex items-center gap-1"
            >
              <LuRefreshCw size={12} /> Şimdi Yenile
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 uppercase text-[11px]">
                  <th className="py-3 px-3">Zaman</th>
                  <th className="py-3 px-3">IP Adresi</th>
                  <th className="py-3 px-3">Şehir / Ülke</th>
                  <th className="py-3 px-3">Cihaz & Tarayıcı</th>
                  <th className="py-3 px-3">Kaynak</th>
                  <th className="py-3 px-3">Gezilen Sayfa</th>
                  <th className="py-3 px-3 text-center">Süre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.canliAkis && data.canliAkis.length > 0 ? (
                  data.canliAkis.map((a: any) => (
                    <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-gray-500 whitespace-nowrap">
                        {new Date(a.olusturulma).toLocaleTimeString('tr-TR')}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-700 font-semibold whitespace-nowrap">
                        {a.ip || 'Bilinmiyor'}
                      </td>
                      <td className="py-3 px-3 text-gray-900 font-medium whitespace-nowrap">
                        {a.sehir || 'Türkiye'} <span className="text-gray-400 text-[10px]">({a.ulke})</span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                        {a.cihaz === 'MOBIL' ? '📱' : '💻'} {a.tarayici || 'Tarayıcı'} / {a.isletimSistemi}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          a.kaynak === 'google' ? 'bg-blue-100 text-blue-800' :
                          a.kaynak === 'bing' ? 'bg-teal-100 text-teal-800' :
                          a.kaynak === 'instagram' ? 'bg-pink-100 text-pink-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {a.kaynak}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-semibold max-w-xs truncate">
                        {a.sayfa}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-gray-600 whitespace-nowrap">
                        {sureFormatla(a.sureSaniye)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 text-xs">
                      Henüz canlı akış kaydı yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEKME 8: BOT VE CRAWLER TARAMALARI */}
      {activeTab === 'botlar' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold text-gray-900">Arama Motoru Bot & Örümcek Taramaları</h2>
            <p className="text-xs text-gray-500">
              Googlebot, Bingbot, YandexBot gibi arama motorlarının sayfalarınızı tarama sıklığı.
              Bu botlar normal insan ziyaretçi sayılarınıza dahil edilmez; ayrı tutulur.
            </p>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 uppercase text-[11px]">
                  <th className="py-3 px-4">Bot / Örümcek Adı</th>
                  <th className="py-3 px-4 text-center">Tarama Sayısı</th>
                  <th className="py-3 px-4 text-center">Son Tarama Zamanı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.botTaramalari && data.botTaramalari.length > 0 ? (
                  data.botTaramalari.map((b: any) => (
                    <tr key={b.bot} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                        <LuBot className="text-blue-600" size={16} />
                        {b.bot}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-800">
                        {b.taramaSayisi} Sayfa Taraması
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-gray-500">
                        {new Date(b.sonTarama).toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-400 text-xs">
                      Bu periyotta bot taraması tespit edilmedi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
