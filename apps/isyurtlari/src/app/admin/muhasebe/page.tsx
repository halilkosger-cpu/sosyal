'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LuTrendingUp, LuTrendingDown, LuDollarSign, LuPackage,
  LuShoppingBag, LuFileText, LuTriangleAlert, LuPercent, LuPlus,
  LuReceipt, LuPackagePlus, LuDownload, LuHistory, LuTrash2, LuCheck,
} from 'react-icons/lu';

type Tab = 'ozet' | 'giderler' | 'stok-girisi' | 'kritik-stok';

const KATEGORI_ETIKETLERI: Record<string, string> = {
  SHIPPING: '🚚 Kargo ve Paketleme',
  MARKETING: '📢 Reklam & Pazarlama',
  COMMISSION: '💳 POS & Komisyon',
  OPERATIONAL: '🏢 Genel İşletme & Ofis',
};

export default function MuhasebeMerkeziPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ozet');
  const [days, setDays] = useState(30);

  // Özet State
  const [ozetData, setOzetData] = useState<any>(null);
  const [ozetLoading, setOzetLoading] = useState(true);

  // Giderler State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expLoading, setExpLoading] = useState(false);
  const [seciliKategori, setSeciliKategori] = useState('');
  const [giderSubmitting, setGiderSubmitting] = useState(false);
  const [giderForm, setGiderForm] = useState({
    title: '',
    category: 'SHIPPING',
    amount: '',
    vatRate: '20',
    invoiceNo: '',
    supplier: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Stok Girişi State
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [stokLoading, setStokLoading] = useState(false);
  const [stokSubmitting, setStokSubmitting] = useState(false);
  const [stokMesaj, setStokMesaj] = useState<{ tur: 'basari' | 'hata'; text: string } | null>(null);
  const [stokForm, setStokForm] = useState({
    productId: '',
    quantity: '',
    unitCost: '',
    invoiceNo: '',
    supplier: '',
    notes: '',
  });

  // Kritik Stok State
  const [criticalList, setCriticalList] = useState<any[]>([]);
  const [critLoading, setCritLoading] = useState(false);

  // 1. Özet Yükle
  const ozetYukle = () => {
    setOzetLoading(true);
    fetch(`/api/admin/muhasebe/ozet?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setOzetData(d);
        setOzetLoading(false);
      })
      .catch(() => setOzetLoading(false));
  };

  // 2. Giderleri Yükle
  const giderleriYukle = () => {
    setExpLoading(true);
    const url = seciliKategori
      ? `/api/admin/muhasebe/giderler?category=${seciliKategori}`
      : '/api/admin/muhasebe/giderler';
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setExpenses(Array.isArray(d) ? d : []);
        setExpLoading(false);
      })
      .catch(() => setExpLoading(false));
  };

  // 3. Stok ve Hareketleri Yükle
  const stokYukle = async () => {
    setStokLoading(true);
    try {
      const [resP, resM] = await Promise.all([
        fetch('/api/admin/products').then((r) => r.json()),
        fetch('/api/admin/muhasebe/stok-hareketleri').then((r) => r.json()),
      ]);
      setProducts(Array.isArray(resP) ? resP : []);
      setMovements(Array.isArray(resM) ? resM : []);
    } finally {
      setStokLoading(false);
    }
  };

  // 4. Kritik Stok Yükle
  const kritikYukle = () => {
    setCritLoading(true);
    fetch('/api/admin/muhasebe/kritik-stok')
      .then((r) => r.json())
      .then((d) => {
        setCriticalList(Array.isArray(d.products) ? d.products : []);
        setCritLoading(false);
      })
      .catch(() => setCritLoading(false));
  };

  useEffect(() => {
    ozetYukle();
  }, [days]);

  useEffect(() => {
    if (activeTab === 'giderler') giderleriYukle();
    if (activeTab === 'stok-girisi') stokYukle();
    if (activeTab === 'kritik-stok') kritikYukle();
  }, [activeTab, seciliKategori]);

  // Gider Kaydet
  const handleGiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giderForm.title || !giderForm.amount) return;

    setGiderSubmitting(true);
    try {
      const res = await fetch('/api/admin/muhasebe/giderler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(giderForm),
      });

      if (res.ok) {
        setGiderForm({
          title: '',
          category: 'SHIPPING',
          amount: '',
          vatRate: '20',
          invoiceNo: '',
          supplier: '',
          notes: '',
          date: new Date().toISOString().split('T')[0],
        });
        giderleriYukle();
        ozetYukle();
      }
    } finally {
      setGiderSubmitting(false);
    }
  };

  // Gider Sil
  const handleGiderSil = async (id: string) => {
    if (!confirm('Bu gider kaydını silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/muhasebe/giderler?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      ozetYukle();
    }
  };

  // Stok Girişi Kaydet
  const handleStokSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stokForm.productId || !stokForm.quantity || !stokForm.unitCost) return;

    setStokSubmitting(true);
    setStokMesaj(null);
    try {
      const res = await fetch('/api/admin/muhasebe/stok-hareketleri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stokForm),
      });
      const json = await res.json();
      if (res.ok) {
        setStokMesaj({
          tur: 'basari',
          text: `Stok eklendi! Yeni Ağırlıklı Ortalama Maliyet: ${json.product?.purchasePrice} ₺`,
        });
        setStokForm({
          productId: '',
          quantity: '',
          unitCost: '',
          invoiceNo: '',
          supplier: '',
          notes: '',
        });
        stokYukle();
        ozetYukle();
      } else {
        setStokMesaj({ tur: 'hata', text: json.error || 'İşlem başarısız' });
      }
    } finally {
      setStokSubmitting(false);
    }
  };

  const paraFormat = (val: number | undefined) =>
    (val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

  const seciliUrun = products.find((p) => p.id === stokForm.productId);

  return (
    <div className="space-y-6">
      {/* ─── 1. ÜST BAŞLIK VE HIZLI AKSİYONLAR ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Finans & Ön Muhasebe Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gelir tablosu, operasyonel giderler, mal kabul (WAV maliyet) ve mali müşavir raporları.
          </p>
        </div>

        {/* Aksiyon Butonları & Dönem Seçici */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white border border-gray-200 text-xs sm:text-sm rounded-xl px-3 py-2 text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CC4E00]"
          >
            <option value={7}>Son 7 Gün</option>
            <option value={30}>Son 30 Gün (Bu Ay)</option>
            <option value={90}>Son 90 Gün (Bu Çeyrek)</option>
            <option value={365}>Son 1 Yıl</option>
          </select>

          {/* Excel / CSV İndir Butonu */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-colors">
              <LuDownload size={16} /> Muhasebe Excel İndir
            </button>
            <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 text-xs">
              <a
                href={`/api/admin/muhasebe/export?tur=satislar&days=${days}`}
                className="block px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium"
              >
                📊 Satış & KDV Raporu (.csv)
              </a>
              <a
                href={`/api/admin/muhasebe/export?tur=giderler&days=${days}`}
                className="block px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium border-t border-gray-50"
              >
                🧾 Gider Faturaları Raporu (.csv)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. ÜST TAB SEKMELERİ ─── */}
      <div className="border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-sm flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ozet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'ozet'
              ? 'bg-[#0F2040] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LuTrendingUp size={16} /> Gelir Tablosu & Kârlılık (P&L)
        </button>

        <button
          onClick={() => setActiveTab('giderler')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'giderler'
              ? 'bg-[#0F2040] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LuReceipt size={16} /> İşletme Giderleri
        </button>

        <button
          onClick={() => setActiveTab('stok-girisi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'stok-girisi'
              ? 'bg-[#0F2040] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LuPackagePlus size={16} /> Mal Kabul & Stok Girişi (WAV)
        </button>

        <button
          onClick={() => setActiveTab('kritik-stok')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'kritik-stok'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          <LuTriangleAlert size={16} />
          Kritik Stok Uyarısı
          {ozetData?.criticalStockCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
              {ozetData.criticalStockCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── 3. SEKME İÇERİKLERİ ─── */}

      {/* TAB 1: ÖZET & P&L */}
      {activeTab === 'ozet' && (
        <div className="space-y-6">
          {ozetLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
              Finansal veriler hesaplanıyor...
            </div>
          ) : !ozetData || ozetData.error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">Finansal özet yüklenemedi.</div>
          ) : (
            <>
              {/* Ana Finansal Kartlar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Net Hasılat (KDV Hariç)</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <LuDollarSign size={18} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{paraFormat(ozetData.metrics.netRevenue)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    KDV Dahil Ciro: <strong>{paraFormat(ozetData.metrics.totalRevenue)}</strong>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Mal Maliyeti (SMM)</span>
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                      <LuPackage size={18} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{paraFormat(ozetData.metrics.cogs)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Satılan {ozetData.orderCount} siparişin toplam girdi maliyeti
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Brüt Satış Kârı</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <LuTrendingUp size={18} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{paraFormat(ozetData.metrics.grossProfit)}</div>
                  <div className="text-xs text-emerald-700 font-medium mt-1">
                    Brüt Kâr Marjı: %{ozetData.metrics.grossProfitMargin}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Net Faaliyet Kârı</span>
                    <div className={`w-8 h-8 rounded-lg ${ozetData.metrics.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} flex items-center justify-center`}>
                      {ozetData.metrics.netProfit >= 0 ? <LuTrendingUp size={18} /> : <LuTrendingDown size={18} />}
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${ozetData.metrics.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {paraFormat(ozetData.metrics.netProfit)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Tüm operasyonel giderler düşüldükten sonra</div>
                </div>
              </div>

              {/* P&L Dökümü & KDV Dengesi */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <LuFileText className="text-[#CC4E00]" /> Gelir Tablosu Özeti (P&L)
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">(+) Brüt Satış Hasılatı (KDV Dahil)</span>
                      <span className="font-semibold text-gray-900">{paraFormat(ozetData.metrics.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">(-) Hesaplanan KDV</span>
                      <span className="text-gray-500">-{paraFormat(ozetData.metrics.vatSummary.collectedVat)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 bg-gray-50/50 px-2 rounded-lg font-medium">
                      <span className="text-gray-900 font-semibold">(=) Net Satış Hasılatı (Matrah)</span>
                      <span className="font-bold text-gray-900">{paraFormat(ozetData.metrics.netRevenue)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">(-) Satılan Malın Maliyeti (SMM)</span>
                      <span className="text-red-500">-{paraFormat(ozetData.metrics.cogs)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 bg-emerald-50/50 px-2 rounded-lg">
                      <span className="text-emerald-900 font-bold">(=) Brüt Kâr</span>
                      <span className="font-bold text-emerald-700">{paraFormat(ozetData.metrics.grossProfit)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">(-) Faaliyet Giderleri (KDV Hariç)</span>
                      <span className="text-red-500">
                        -{paraFormat(ozetData.metrics.totalExpenses - ozetData.metrics.vatSummary.deductibleVat)}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 bg-gray-900 text-white px-3 rounded-xl mt-2">
                      <span className="font-bold">(=) DÖNEM NET FAALİYET KÂRI</span>
                      <span className="font-extrabold text-lg text-emerald-400">{paraFormat(ozetData.metrics.netProfit)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* KDV Dengesi */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <LuPercent className="text-blue-600" /> KDV Dengesi Tahmini
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100">
                        <p className="text-[11px] font-semibold text-blue-700 uppercase">Hesaplanan KDV</p>
                        <p className="text-base font-bold text-blue-900 mt-1">{paraFormat(ozetData.metrics.vatSummary.collectedVat)}</p>
                      </div>
                      <div className="bg-purple-50/60 rounded-xl p-3 border border-purple-100">
                        <p className="text-[11px] font-semibold text-purple-700 uppercase">İndirilecek KDV</p>
                        <p className="text-base font-bold text-purple-900 mt-1">{paraFormat(ozetData.metrics.vatSummary.deductibleVat)}</p>
                      </div>
                      <div className={`rounded-xl p-3 border ${ozetData.metrics.vatSummary.estimatedPayableVat >= 0 ? 'bg-amber-50/60 border-amber-200 text-amber-900' : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'}`}>
                        <p className="text-[11px] font-semibold uppercase">
                          {ozetData.metrics.vatSummary.estimatedPayableVat >= 0 ? 'Ödenecek KDV' : 'Devreden KDV'}
                        </p>
                        <p className="text-base font-bold mt-1">{paraFormat(Math.abs(ozetData.metrics.vatSummary.estimatedPayableVat))}</p>
                      </div>
                    </div>
                  </div>

                  {/* Gider Dağılımı */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Gider Dağılımı (KDV Dahil)</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-xs text-gray-500 block">🚚 Kargo & Paketleme</span>
                        <span className="font-bold text-gray-900 text-base">{paraFormat(ozetData.expensesByCategory.shipping)}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-xs text-gray-500 block">📢 Reklam & Pazarlama</span>
                        <span className="font-bold text-gray-900 text-base">{paraFormat(ozetData.expensesByCategory.marketing)}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-xs text-gray-500 block">💳 Sanal POS / Komisyon</span>
                        <span className="font-bold text-gray-900 text-base">{paraFormat(ozetData.expensesByCategory.commission)}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-xs text-gray-500 block">🏢 Genel İşletme & Diğer</span>
                        <span className="font-bold text-gray-900 text-base">{paraFormat(ozetData.expensesByCategory.operational)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: GİDERLER */}
      {activeTab === 'giderler' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LuReceipt className="text-[#CC4E00]" /> Yeni Gider Fişi / Faturası
            </h2>
            <form onSubmit={handleGiderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Açıklama / Harcama Adı *</label>
                <input
                  type="text"
                  required
                  value={giderForm.title}
                  onChange={(e) => setGiderForm({ ...giderForm, title: e.target.value })}
                  placeholder="Örn: Ekim Ayı Yurtiçi Kargo Faturası"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gider Kategorisi *</label>
                  <select
                    value={giderForm.category}
                    onChange={(e) => setGiderForm({ ...giderForm, category: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                  >
                    <option value="SHIPPING">🚚 Kargo & Paketleme</option>
                    <option value="MARKETING">📢 Reklam & Pazarlama</option>
                    <option value="COMMISSION">💳 POS & Komisyon</option>
                    <option value="OPERATIONAL">🏢 Genel İşletme & Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">KDV Oranı (%) *</label>
                  <select
                    value={giderForm.vatRate}
                    onChange={(e) => setGiderForm({ ...giderForm, vatRate: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                  >
                    <option value="20">%20 (Standart)</option>
                    <option value="10">%10 (Özel)</option>
                    <option value="1">%1 (Gıda/Tarımsal)</option>
                    <option value="0">%0 (KDV'siz / Muaf)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tutar (KDV Dahil ₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={giderForm.amount}
                    onChange={(e) => setGiderForm({ ...giderForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Belge Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={giderForm.date}
                    onChange={(e) => setGiderForm({ ...giderForm, date: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fatura / Fiş No</label>
                  <input
                    type="text"
                    value={giderForm.invoiceNo}
                    onChange={(e) => setGiderForm({ ...giderForm, invoiceNo: e.target.value })}
                    placeholder="GIB2026000001"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tedarikçi / Kurum</label>
                  <input
                    type="text"
                    value={giderForm.supplier}
                    onChange={(e) => setGiderForm({ ...giderForm, supplier: e.target.value })}
                    placeholder="Örn: Yurtiçi Kargo"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notlar</label>
                <textarea
                  rows={2}
                  value={giderForm.notes}
                  onChange={(e) => setGiderForm({ ...giderForm, notes: e.target.value })}
                  placeholder="Detaylar..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={giderSubmitting}
                className="w-full bg-[#CC4E00] hover:bg-[#b04300] text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
              >
                <LuPlus size={18} /> {giderSubmitting ? 'Kaydediliyor...' : 'Gideri Kaydet'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-gray-900">Kayıtlı Giderler</h2>
              <select
                value={seciliKategori}
                onChange={(e) => setSeciliKategori(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none"
              >
                <option value="">Tüm Kategoriler</option>
                <option value="SHIPPING">🚚 Kargo</option>
                <option value="MARKETING">📢 Reklam</option>
                <option value="COMMISSION">💳 Komisyon</option>
                <option value="OPERATIONAL">🏢 Genel İşletme</option>
              </select>
            </div>

            {expLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Giderler yükleniyor...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl">Kayıtlı gider bulunmuyor.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-3">Tarih</th>
                      <th className="py-3 px-3">Açıklama</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3 text-right">KDV</th>
                      <th className="py-3 px-3 text-right">Toplam (₺)</th>
                      <th className="py-3 px-3 text-center">Sil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(exp.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-gray-900 leading-tight">{exp.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {exp.supplier || '—'} {exp.invoiceNo ? `• ${exp.invoiceNo}` : ''}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-xs whitespace-nowrap">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium text-[11px]">
                            {KATEGORI_ETIKETLERI[exp.category] || exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-purple-600 font-medium">
                          %{exp.vatRate ?? 20}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">{paraFormat(exp.amount)}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleGiderSil(exp.id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                          >
                            <LuTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MAL KABUL & STOK GİRİŞİ */}
      {activeTab === 'stok-girisi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LuPackagePlus className="text-[#CC4E00]" /> Yeni Mal / Stok Kabulü
            </h2>

            {stokMesaj && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-4 ${
                  stokMesaj.tur === 'basari' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {stokMesaj.tur === 'basari' ? <LuCheck size={16} /> : <LuTriangleAlert size={16} />}
                <span>{stokMesaj.text}</span>
              </div>
            )}

            <form onSubmit={handleStokSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ürün Seçin *</label>
                <select
                  required
                  value={stokForm.productId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const prod = products.find((p) => p.id === pid);
                    setStokForm({
                      ...stokForm,
                      productId: pid,
                      unitCost: prod?.purchasePrice ? String(prod.purchasePrice) : '',
                    });
                  }}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                >
                  <option value="">— Ürün Seçin —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Mevcut Stok: {p.quantity})
                    </option>
                  ))}
                </select>
              </div>

              {seciliUrun && (
                <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1 text-gray-600 border border-gray-100">
                  <p>Mevcut Stok: <strong>{seciliUrun.quantity} adet</strong></p>
                  <p>Mevcut Alış Maliyeti: <strong>{paraFormat(seciliUrun.purchasePrice)}</strong></p>
                  <p>Satış Fiyatı: <strong>{paraFormat(seciliUrun.price)}</strong></p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gelen Adet *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stokForm.quantity}
                    onChange={(e) => setStokForm({ ...stokForm, quantity: e.target.value })}
                    placeholder="Örn: 20"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Birim Alış (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={stokForm.unitCost}
                    onChange={(e) => setStokForm({ ...stokForm, unitCost: e.target.value })}
                    placeholder="0.00"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">İrsaliye / Fatura No</label>
                  <input
                    type="text"
                    value={stokForm.invoiceNo}
                    onChange={(e) => setStokForm({ ...stokForm, invoiceNo: e.target.value })}
                    placeholder="IRS-2026-01"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tedarikçi / İşyurdu</label>
                  <input
                    type="text"
                    value={stokForm.supplier}
                    onChange={(e) => setStokForm({ ...stokForm, supplier: e.target.value })}
                    placeholder="Örn: Isparta İşyurdu"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notlar</label>
                <textarea
                  rows={2}
                  value={stokForm.notes}
                  onChange={(e) => setStokForm({ ...stokForm, notes: e.target.value })}
                  placeholder="Parti detayları..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#CC4E00] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={stokSubmitting}
                className="w-full bg-[#CC4E00] hover:bg-[#b04300] text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
              >
                <LuPackagePlus size={18} /> {stokSubmitting ? 'Hesaplanıyor...' : 'Stok Kabulünü Kaydet'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LuHistory className="text-gray-400" /> Son Stok Kabul Hareketleri
            </h2>
            {stokLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Hareketler yükleniyor...</div>
            ) : movements.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl">Stok kabul hareketi kaydedilmemiş.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-3">Tarih</th>
                      <th className="py-3 px-3">Ürün</th>
                      <th className="py-3 px-3 text-right">Adet</th>
                      <th className="py-3 px-3 text-right">Giriş Maliyeti</th>
                      <th className="py-3 px-3 text-right">Toplam (₺)</th>
                      <th className="py-3 px-3">Belge / Tedarikçi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {movements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(mov.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-900">{mov.product?.name || 'Ürün'}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">+{mov.quantity}</td>
                        <td className="py-3 px-3 text-right text-gray-700">{paraFormat(mov.unitCost)}</td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">{paraFormat(mov.totalCost)}</td>
                        <td className="py-3 px-3 text-xs text-gray-500">
                          {mov.supplier || '—'} {mov.invoiceNo ? `• ${mov.invoiceNo}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: KRİTİK STOK LİSTESİ */}
      {activeTab === 'kritik-stok' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Kritik Stok Seviyesindeki Ürünler</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Mevcut stoğu belirlenen kritik eşiğe eşit veya altına inmiş tüm ürünler.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('stok-girisi')}
              className="flex items-center gap-1.5 bg-[#CC4E00] hover:bg-[#b04300] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <LuPlus size={16} /> Mal Kabul / Stok Girişi Yap
            </button>
          </div>

          {critLoading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Ürünler inceleniyor...</div>
          ) : criticalList.length === 0 ? (
            <div className="text-center py-12 text-emerald-700 text-sm bg-emerald-50 rounded-xl border border-emerald-100">
              🎉 Harika! Şu anda kritik seviyede veya tükenmiş ürün bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Ürün Adı</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-center">Kalan Stok</th>
                    <th className="py-3 px-3 text-center">Kritik Eşik</th>
                    <th className="py-3 px-3 text-right">Alış Fiyatı</th>
                    <th className="py-3 px-3 text-right">Satış Fiyatı</th>
                    <th className="py-3 px-3 text-center">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {criticalList.map((p) => (
                    <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-900">{p.name}</td>
                      <td className="py-3 px-3 text-xs text-gray-500">{p.category?.name || '—'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${p.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                          {p.quantity} adet
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-gray-500 font-medium">
                        {p.minStockLevel ?? 5} adet
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-gray-600 font-medium">
                        {paraFormat(p.purchasePrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">
                        {paraFormat(p.price)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setStokForm({
                              productId: p.id,
                              quantity: '10',
                              unitCost: p.purchasePrice ? String(p.purchasePrice) : '',
                              invoiceNo: '',
                              supplier: '',
                              notes: '',
                            });
                            setActiveTab('stok-girisi');
                          }}
                          className="text-xs bg-gray-100 hover:bg-[#CC4E00] hover:text-white px-2.5 py-1 rounded-lg font-semibold text-gray-700 transition-colors"
                        >
                          Hemen Stok Gir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
