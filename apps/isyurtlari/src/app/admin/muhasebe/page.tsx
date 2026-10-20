'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LuTrendingUp, LuTrendingDown, LuDollarSign, LuPackage,
  LuShoppingBag, LuFileText, LuTriangleAlert, LuPieChart, LuPlus,
} from 'react-icons/lu';

export default function MuhasebeDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const yukle = () => {
    setLoading(true);
    fetch(`/api/admin/muhasebe/ozet?days=${days}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    yukle();
  }, [days]);

  const paraFormat = (val: number | undefined) =>
    (val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

  return (
    <div className="space-y-6">
      {/* Başlık ve Filtre */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ön Muhasebe & Kârlılık</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gelir tablosu (P&L), satılan malın maliyeti (SMM), KDV dengesi ve kâr marjları.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white border border-gray-200 text-sm rounded-xl px-3 py-2 text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CC4E00]"
          >
            <option value={7}>Son 7 Gün</option>
            <option value={30}>Son 30 Gün (Bu Ay)</option>
            <option value={90}>Son 90 Gün (Bu Çeyrek)</option>
            <option value={365}>Son 1 Yıl</option>
          </select>
          <Link
            href="/admin/muhasebe/giderler"
            className="flex items-center gap-2 bg-[#CC4E00] hover:bg-[#b04300] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            <LuPlus size={16} /> Gider Ekle
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
          Finansal veriler hesaplanıyor...
        </div>
      ) : !data || data.error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
          Finansal özet yüklenemedi.
        </div>
      ) : (
        <>
          {/* Kritik Stok Uyarısı Banner */}
          {data.criticalStockCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <LuAlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {data.criticalStockCount} Ürünün Stoğu Kritik Eşiğin Altında!
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Bu ürünlerin stoğu belirlenen minimum eşiğe (veya 5 adede) indi ya da tükendi.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/muhasebe/stok-girisi"
                className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
              >
                Stokları İncele / Mal Girişi Yap &rarr;
              </Link>
            </div>
          )}

          {/* Ana Finansal Kartlar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Toplam Satış Hasılatı */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Net Hasılat (KDV Hariç)</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <LuDollarSign size={18} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{paraFormat(data.metrics.netRevenue)}</div>
              <div className="text-xs text-gray-500 mt-1">
                KDV Dahil Ciro: <strong>{paraFormat(data.metrics.totalRevenue)}</strong>
              </div>
            </div>

            {/* Satılan Malın Maliyeti (SMM) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Mal Maliyeti (SMM)</span>
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <LuPackage size={18} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{paraFormat(data.metrics.cogs)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Satılan {data.orderCount} siparişin toplam girdi maliyeti
              </div>
            </div>

            {/* Brüt Satış Kârı */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Brüt Satış Kârı</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <LuTrendingUp size={18} />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600">{paraFormat(data.metrics.grossProfit)}</div>
              <div className="text-xs text-emerald-700 font-medium mt-1">
                Brüt Kâr Marjı: %{data.metrics.grossProfitMargin}
              </div>
            </div>

            {/* Net Faaliyet Kârı */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Net Faaliyet Kârı</span>
                <div className={`w-8 h-8 rounded-lg ${data.metrics.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} flex items-center justify-center`}>
                  {data.metrics.netProfit >= 0 ? <LuTrendingUp size={18} /> : <LuTrendingDown size={18} />}
                </div>
              </div>
              <div className={`text-2xl font-bold ${data.metrics.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {paraFormat(data.metrics.netProfit)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Tüm operasyonel giderler düşüldükten sonra
              </div>
            </div>
          </div>

          {/* İki Kolonlu Detay: Gelir Tablosu P&L & KDV Dengesi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gelir Tablosu Özeti */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <LuFileText className="text-[#CC4E00]" /> Gelir Tablosu Özeti (P&L)
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-600">(+) Brüt Satış Hasılatı (KDV Dahil)</span>
                  <span className="font-semibold text-gray-900">{paraFormat(data.metrics.totalRevenue)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-600">(-) Hesaplanan KDV</span>
                  <span className="text-gray-500">-{paraFormat(data.metrics.vatSummary.collectedVat)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 bg-gray-50/50 px-2 rounded-lg font-medium">
                  <span className="text-gray-900 font-semibold">(=) Net Satış Hasılatı (Matrah)</span>
                  <span className="font-bold text-gray-900">{paraFormat(data.metrics.netRevenue)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-600">(-) Satılan Malın Maliyeti (SMM)</span>
                  <span className="text-red-500">-{paraFormat(data.metrics.cogs)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 bg-emerald-50/50 px-2 rounded-lg">
                  <span className="text-emerald-900 font-bold">(=) Brüt Kâr</span>
                  <span className="font-bold text-emerald-700">{paraFormat(data.metrics.grossProfit)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-600">(-) Faaliyet Giderleri (KDV Hariç)</span>
                  <span className="text-red-500">
                    -{paraFormat(data.metrics.totalExpenses - data.metrics.vatSummary.deductibleVat)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-gray-900 text-white px-3 rounded-xl mt-2">
                  <span className="font-bold">(=) DÖNEM NET FAALİYET KÂRI</span>
                  <span className="font-extrabold text-lg text-emerald-400">{paraFormat(data.metrics.netProfit)}</span>
                </div>
              </div>
            </div>

            {/* KDV Dengesi ve Gider Dağılımı */}
            <div className="space-y-6">
              {/* KDV Dengesi Kartı */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <LuPieChart className="text-blue-600" /> KDV Dengesi Tahmini
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Satışlardan müşteriden tahsil edilen KDV ile gider ve alış faturalarında ödenen KDV'nin dönemsel karşılaştırması.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100">
                    <p className="text-[11px] font-semibold text-blue-700 uppercase">Hesaplanan KDV</p>
                    <p className="text-base font-bold text-blue-900 mt-1">
                      {paraFormat(data.metrics.vatSummary.collectedVat)}
                    </p>
                  </div>
                  <div className="bg-purple-50/60 rounded-xl p-3 border border-purple-100">
                    <p className="text-[11px] font-semibold text-purple-700 uppercase">İndirilecek KDV</p>
                    <p className="text-base font-bold text-purple-900 mt-1">
                      {paraFormat(data.metrics.vatSummary.deductibleVat)}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 border ${data.metrics.vatSummary.estimatedPayableVat >= 0 ? 'bg-amber-50/60 border-amber-200 text-amber-900' : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'}`}>
                    <p className="text-[11px] font-semibold uppercase">
                      {data.metrics.vatSummary.estimatedPayableVat >= 0 ? 'Ödenecek KDV' : 'Sonraki Aya Devreden'}
                    </p>
                    <p className="text-base font-bold mt-1">
                      {paraFormat(Math.abs(data.metrics.vatSummary.estimatedPayableVat))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Gider Kalemleri Dağılımı */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900">Gider Dağılımı (KDV Dahil)</h3>
                  <Link href="/admin/muhasebe/giderler" className="text-xs font-semibold text-[#CC4E00] hover:underline">
                    Gider Detayları &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-500 block">🚚 Kargo & Paketleme</span>
                    <span className="font-bold text-gray-900 text-base">{paraFormat(data.expensesByCategory.shipping)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-500 block">📢 Reklam & Pazarlama</span>
                    <span className="font-bold text-gray-900 text-base">{paraFormat(data.expensesByCategory.marketing)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-500 block">💳 Sanal POS / Komisyon</span>
                    <span className="font-bold text-gray-900 text-base">{paraFormat(data.expensesByCategory.commission)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-500 block">🏢 Genel İşletme & Diğer</span>
                    <span className="font-bold text-gray-900 text-base">{paraFormat(data.expensesByCategory.operational)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
