'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LuTrendingUp, LuTrendingDown, LuDollarSign, LuPackage,
  LuShoppingBag, LuFileText, LuTriangleAlert, LuPercent, LuPlus,
  LuReceipt, LuPackagePlus, LuDownload, LuHistory, LuTrash2, LuCheck,
  LuUsers, LuCreditCard, LuBuilding2, LuArrowRight, LuEye,
} from 'react-icons/lu';

type Tab = 'ozet' | 'cariler' | 'faturalar' | 'banka' | 'giderler' | 'stok-girisi' | 'kritik-stok';

const KATEGORI_ETIKETLERI: Record<string, string> = {
  SHIPPING: '🚚 Kargo ve Paketleme',
  MARKETING: '📢 Reklam & Pazarlama',
  COMMISSION: '💳 POS & Komisyon',
  OPERATIONAL: '🏢 Genel İşletme & Ofis',
};

export default function LogoGo3MuhasebeMerkezi() {
  const [activeTab, setActiveTab] = useState<Tab>('ozet');
  const [days, setDays] = useState(30);

  // 1. Özet State
  const [ozetData, setOzetData] = useState<any>(null);
  const [ozetLoading, setOzetLoading] = useState(true);

  // 2. Cariler State
  const [cariler, setCariler] = useState<any[]>([]);
  const [cariLoading, setCariLoading] = useState(false);
  const [cariTurFiltre, setCariTurFiltre] = useState('');
  const [seciliCariEkstre, setSeciliCariEkstre] = useState<any>(null);
  const [ekstreModal, setEkstreModal] = useState(false);

  // Yeni Cari Formu
  const [yeniCariModal, setYeniCariModal] = useState(false);
  const [cariForm, setCariForm] = useState({
    unvan: '',
    tur: 'ALICI',
    vergiTcNo: '',
    vergiDairesi: '',
    eposta: '',
    telefon: '',
    adres: '',
    sehir: '',
  });

  // 3. Faturalar State
  const [faturalar, setFaturalar] = useState<any[]>([]);
  const [faturaLoading, setFaturaLoading] = useState(false);

  // 4. Banka & Kasa State
  const [bankaHesaplari, setBankaHesaplari] = useState<any[]>([]);
  const [bankaLoading, setBankaLoading] = useState(false);
  const [yeniHesapModal, setYeniHesapModal] = useState(false);
  const [hesapForm, setHesapForm] = useState({ hesapAdi: '', bankaAdi: '', iban: '' });

  // 5. Giderler State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expLoading, setExpLoading] = useState(false);
  const [seciliGiderKat, setSeciliGiderKat] = useState('');
  const [giderForm, setGiderForm] = useState({
    title: '', category: 'SHIPPING', amount: '', vatRate: '20',
    invoiceNo: '', supplier: '', notes: '', date: new Date().toISOString().split('T')[0],
  });

  // 6. Stok & WAV State
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [stokLoading, setStokLoading] = useState(false);
  const [stokMesaj, setStokMesaj] = useState<{ tur: 'basari' | 'hata'; text: string } | null>(null);
  const [stokForm, setStokForm] = useState({
    productId: '', quantity: '', unitCost: '', invoiceNo: '', supplier: '', notes: '',
  });

  // 7. Kritik Stok
  const [criticalList, setCriticalList] = useState<any[]>([]);
  const [critLoading, setCritLoading] = useState(false);

  // ─── VERİ YÜKLEYİCİLER ───────────────────────────────────────
  const ozetYukle = () => {
    setOzetLoading(true);
    fetch(`/api/admin/muhasebe/ozet?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setOzetData(d); setOzetLoading(false); })
      .catch(() => setOzetLoading(false));
  };

  const carileriYukle = () => {
    setCariLoading(true);
    const url = cariTurFiltre ? `/api/admin/muhasebe/cariler?tur=${cariTurFiltre}` : '/api/admin/muhasebe/cariler';
    fetch(url).then((r) => r.json()).then((d) => { setCariler(Array.isArray(d) ? d : []); setCariLoading(false); });
  };

  const faturalariYukle = () => {
    setFaturaLoading(true);
    fetch('/api/admin/muhasebe/faturalar').then((r) => r.json()).then((d) => { setFaturalar(Array.isArray(d) ? d : []); setFaturaLoading(false); });
  };

  const bankaYukle = () => {
    setBankaLoading(true);
    fetch('/api/admin/muhasebe/banka').then((r) => r.json()).then((d) => { setBankaHesaplari(Array.isArray(d) ? d : []); setBankaLoading(false); });
  };

  const giderleriYukle = () => {
    setExpLoading(true);
    const url = seciliGiderKat ? `/api/admin/muhasebe/giderler?category=${seciliGiderKat}` : '/api/admin/muhasebe/giderler';
    fetch(url).then((r) => r.json()).then((d) => { setExpenses(Array.isArray(d) ? d : []); setExpLoading(false); });
  };

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

  const kritikYukle = () => {
    setCritLoading(true);
    fetch('/api/admin/muhasebe/kritik-stok').then((r) => r.json()).then((d) => { setCriticalList(Array.isArray(d.products) ? d.products : []); setCritLoading(false); });
  };

  useEffect(() => { ozetYukle(); }, [days]);

  useEffect(() => {
    if (activeTab === 'cariler') carileriYukle();
    if (activeTab === 'faturalar') faturalariYukle();
    if (activeTab === 'banka') bankaYukle();
    if (activeTab === 'giderler') giderleriYukle();
    if (activeTab === 'stok-girisi') stokYukle();
    if (activeTab === 'kritik-stok') kritikYukle();
  }, [activeTab, cariTurFiltre, seciliGiderKat]);

  // Ekstre Aç
  const ekstreAc = (cariId: string) => {
    fetch(`/api/admin/muhasebe/cariler/ekstre?cariId=${cariId}`)
      .then((r) => r.json())
      .then((d) => {
        setSeciliCariEkstre(d);
        setEkstreModal(true);
      });
  };

  // Yeni Cari Kaydet
  const handleCariSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/muhasebe/cariler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cariForm),
    });
    if (res.ok) {
      setYeniCariModal(false);
      setCariForm({ unvan: '', tur: 'ALICI', vergiTcNo: '', vergiDairesi: '', eposta: '', telefon: '', adres: '', sehir: '' });
      carileriYukle();
    }
  };

  // Yeni Banka Hesabı Kaydet
  const handleHesapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/muhasebe/banka', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ islem: 'YENI_HESAP', ...hesapForm }),
    });
    if (res.ok) {
      setYeniHesapModal(false);
      setHesapForm({ hesapAdi: '', bankaAdi: '', iban: '' });
      bankaYukle();
    }
  };

  const paraFormat = (val: number | undefined) =>
    (val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

  return (
    <div className="space-y-6">
      {/* ─── 1. ÜST PANEL & MALİ MÜŞAVİR BUTONLARI ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#0F2040] text-white text-[11px] font-extrabold px-2 py-0.5 rounded">LOGO GO3</span>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ön Muhasebe & ERP Merkezi</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Cari kartlar (120/320), resmi faturalar, banka tahsilatları, WAV maliyet ve gelir tablosu.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white border border-gray-200 text-xs sm:text-sm rounded-xl px-3 py-2 text-gray-700 font-medium shadow-sm focus:outline-none"
          >
            <option value={7}>Son 7 Gün</option>
            <option value={30}>Son 30 Gün (Bu Ay)</option>
            <option value={90}>Son 90 Gün (Bu Çeyrek)</option>
            <option value={365}>Son 1 Yıl</option>
          </select>

          <div className="relative group">
            <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-colors">
              <LuDownload size={16} /> Excel / CSV Aktar
            </button>
            <div className="hidden group-hover:block absolute right-0 mt-1 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 text-xs">
              <a href={`/api/admin/muhasebe/export?tur=satislar&days=${days}`} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium">
                📊 Satış & KDV Raporu (.csv)
              </a>
              <a href={`/api/admin/muhasebe/export?tur=giderler&days=${days}`} className="block px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium border-t border-gray-50">
                🧾 Gider Faturaları Raporu (.csv)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. LOGO GO3 SEKME MENÜSÜ ─── */}
      <div className="border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-sm flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ozet')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'ozet' ? 'bg-[#0F2040] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LuTrendingUp size={16} /> P&L & Kârlılık
        </button>

        <button
          onClick={() => setActiveTab('cariler')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'cariler' ? 'bg-[#0F2040] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LuUsers size={16} /> Cari Hesaplar (120/320)
        </button>

        <button
          onClick={() => setActiveTab('faturalar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'faturalar' ? 'bg-[#0F2040] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LuFileText size={16} /> Fatura & İrsaliye
        </button>

        <button
          onClick={() => setActiveTab('banka')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'banka' ? 'bg-[#0F2040] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LuBuilding2 size={16} /> Banka & Kasa
        </button>

        <button
          onClick={() => setActiveTab('giderler')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'giderler' ? 'bg-[#0F2040] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LuReceipt size={16} /> İşletme Giderleri
        </button>

        <button
          onClick={() => setActiveTab('stok-girisi')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'stok-girisi' ? 'bg-[#0F2040] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LuPackagePlus size={16} /> Mal Kabul & WAV
        </button>

        <button
          onClick={() => setActiveTab('kritik-stok')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'kritik-stok' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          <LuTriangleAlert size={16} />
          Kritik Stok
          {ozetData?.criticalStockCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
              {ozetData.criticalStockCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── 3. SEKME İÇERİKLERİ ─── */}

      {/* TAB 1: P&L GELİR TABLOSU */}
      {activeTab === 'ozet' && (
        <div className="space-y-6">
          {ozetLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">Hesaplanıyor...</div>
          ) : !ozetData || ozetData.error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">Finansal özet yüklenemedi.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Net Hasılat (600)</span>
                  <div className="text-2xl font-bold text-gray-900">{paraFormat(ozetData.metrics.netRevenue)}</div>
                  <div className="text-xs text-gray-500 mt-1">KDV Dahil: {paraFormat(ozetData.metrics.totalRevenue)}</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Mal Maliyeti (621 SMM)</span>
                  <div className="text-2xl font-bold text-gray-900">{paraFormat(ozetData.metrics.cogs)}</div>
                  <div className="text-xs text-gray-500 mt-1">{ozetData.orderCount} siparişin toplam girdi maliyeti</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Brüt Satış Kârı</span>
                  <div className="text-2xl font-bold text-emerald-600">{paraFormat(ozetData.metrics.grossProfit)}</div>
                  <div className="text-xs text-emerald-700 font-medium mt-1">Brüt Kâr Marjı: %{ozetData.metrics.grossProfitMargin}</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Dönem Net Kârı</span>
                  <div className={`text-2xl font-bold ${ozetData.metrics.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {paraFormat(ozetData.metrics.netProfit)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Faaliyet giderleri düşüldükten sonra</div>
                </div>
              </div>

              {/* P&L & KDV Dengesi */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <LuFileText className="text-[#CC4E00]" /> Tekdüzen Gelir Tablosu Özeti (P&L)
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">A. BRÜT SATIŞLAR (KDV Dahil)</span>
                      <span className="font-semibold text-gray-900">{paraFormat(ozetData.metrics.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">(-) 391 Hesaplanan KDV</span>
                      <span className="text-gray-500">-{paraFormat(ozetData.metrics.vatSummary.collectedVat)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 bg-gray-50/50 px-2 rounded-lg font-medium">
                      <span className="text-gray-900 font-semibold">(=) 600 NET SATIŞ HASILATI</span>
                      <span className="font-bold text-gray-900">{paraFormat(ozetData.metrics.netRevenue)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">(-) 621 Satılan Ticari Mallar Maliyeti</span>
                      <span className="text-red-500">-{paraFormat(ozetData.metrics.cogs)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 bg-emerald-50/50 px-2 rounded-lg">
                      <span className="text-emerald-900 font-bold">(=) BRÜT SATIŞ KÂRI</span>
                      <span className="font-bold text-emerald-700">{paraFormat(ozetData.metrics.grossProfit)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">(-) 770 Genel Yönetim & Faaliyet Giderleri</span>
                      <span className="text-red-500">
                        -{paraFormat(ozetData.metrics.totalExpenses - ozetData.metrics.vatSummary.deductibleVat)}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 bg-gray-900 text-white px-3 rounded-xl mt-2">
                      <span className="font-bold">(=) FAALİYET KÂRI (DÖNEM KÂRI)</span>
                      <span className="font-extrabold text-lg text-emerald-400">{paraFormat(ozetData.metrics.netProfit)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <LuPercent className="text-blue-600" /> KDV Beyannamesi Dengesi (Tahmini)
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100">
                        <p className="text-[11px] font-semibold text-blue-700 uppercase">391 Hesaplanan</p>
                        <p className="text-base font-bold text-blue-900 mt-1">{paraFormat(ozetData.metrics.vatSummary.collectedVat)}</p>
                      </div>
                      <div className="bg-purple-50/60 rounded-xl p-3 border border-purple-100">
                        <p className="text-[11px] font-semibold text-purple-700 uppercase">191 İndirilecek</p>
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

      {/* TAB 2: CARİ HESAPLAR (120/320) */}
      {activeTab === 'cariler' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Cari Hesap Kartları</h2>
              <p className="text-xs text-gray-500 mt-0.5">120 Alıcılar (Müşteriler) ve 320 Satıcılar (İşyurtları Tedarikçileri) bakiye ve ekstreleri.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={cariTurFiltre}
                onChange={(e) => setCariTurFiltre(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700"
              >
                <option value="">Tüm Cariler</option>
                <option value="ALICI">120 Alıcılar (Müşteriler)</option>
                <option value="SATICI">320 Satıcılar (Tedarikçiler)</option>
              </select>
              <button
                onClick={() => setYeniCariModal(true)}
                className="flex items-center gap-1.5 bg-[#CC4E00] hover:bg-[#b04300] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                <LuPlus size={16} /> Yeni Cari Kart Aç
              </button>
            </div>
          </div>

          {cariLoading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Cariler yükleniyor...</div>
          ) : cariler.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl">Henüz kayıtlı cari kart bulunmuyor.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Cari Kodu</th>
                    <th className="py-3 px-3">Unvan / Müşteri</th>
                    <th className="py-3 px-3">Tür / Muh. Kodu</th>
                    <th className="py-3 px-3">İletişim</th>
                    <th className="py-3 px-3 text-right">Güncel Bakiye</th>
                    <th className="py-3 px-3 text-center">Ekstre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cariler.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs font-bold text-blue-900">{c.kod}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900">
                        {c.unvan}
                        {c.vergiTcNo && <span className="block text-[11px] text-gray-400">TC/VKN: {c.vergiTcNo}</span>}
                      </td>
                      <td className="py-3 px-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.tur === 'ALICI' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {c.tur === 'ALICI' ? '120 Alıcı' : '320 Satıcı'}
                        </span>
                        <span className="block text-[11px] text-gray-400 mt-0.5">{c.muhasebeKodu}</span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-500">
                        {c.eposta || c.telefon || '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={c.bakiye > 0 ? 'text-emerald-600' : c.bakiye < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {paraFormat(c.bakiye)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => ekstreAc(c.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                          title="Cari Hesap Ekstresi"
                        >
                          <LuEye size={18} />
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

      {/* TAB 3: FATURALAR */}
      {activeTab === 'faturalar' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Satış ve Satınalma Faturaları</h2>
              <p className="text-xs text-gray-500 mt-0.5">Siparişlerden otomatik kesilen ve mal alımlarına ait resmi fatura kayıtları.</p>
            </div>
          </div>

          {faturaLoading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Faturalar yükleniyor...</div>
          ) : faturalar.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl">Henüz kayıtlı fatura bulunmuyor.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Fatura No</th>
                    <th className="py-3 px-3">Tarih</th>
                    <th className="py-3 px-3">Cari Unvan</th>
                    <th className="py-3 px-3">Tür</th>
                    <th className="py-3 px-3 text-right">KDV Matrahı</th>
                    <th className="py-3 px-3 text-right">KDV Tutarı</th>
                    <th className="py-3 px-3 text-right">Genel Toplam (₺)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {faturalar.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs font-bold text-[#BA4700]">{f.faturaNo}</td>
                      <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">{new Date(f.tarih).toLocaleDateString('tr-TR')}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900">{f.cari?.unvan}</td>
                      <td className="py-3 px-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.tur === 'SATIS' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          {f.tur === 'SATIS' ? 'Satış' : 'Satınalma'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-xs font-medium text-gray-600">{paraFormat(f.matrah)}</td>
                      <td className="py-3 px-3 text-right text-xs font-medium text-purple-600">{paraFormat(f.kdvTutari)}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">{paraFormat(f.genelToplam)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BANKA & KASA */}
      {activeTab === 'banka' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Banka Hesapları & Kasa Yönetimi</h2>
              <p className="text-xs text-gray-500 mt-0.5">Müşteri Havale/EFT tahsilatları, Sanal POS ve banka hesap bakiyeleri.</p>
            </div>
            <button
              onClick={() => setYeniHesapModal(true)}
              className="flex items-center gap-1.5 bg-[#CC4E00] hover:bg-[#b04300] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <LuPlus size={16} /> Yeni Banka Hesabı Ekle
            </button>
          </div>

          {/* Hesap Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {bankaHesaplari.map((h) => (
              <div key={h.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-900">{h.bankaAdi}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">Aktif</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{h.hesapAdi}</h3>
                <p className="text-[11px] font-mono text-gray-400 mt-1 truncate">{h.iban || 'IBAN Belirtilmemiş'}</p>
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Mevcut Bakiye</span>
                  <span className="text-lg font-bold text-gray-900">{paraFormat(h.bakiye)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GİDERLER */}
      {activeTab === 'giderler' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LuReceipt className="text-[#CC4E00]" /> Yeni Gider Fişi / Faturası
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setExpLoading(true);
              await fetch('/api/admin/muhasebe/giderler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(giderForm),
              });
              giderleriYukle();
              ozetYukle();
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Açıklama *</label>
                <input
                  type="text" required value={giderForm.title}
                  onChange={(e) => setGiderForm({ ...giderForm, title: e.target.value })}
                  placeholder="Örn: Ekim Ayı Yurtiçi Kargo Faturası"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori *</label>
                  <select
                    value={giderForm.category}
                    onChange={(e) => setGiderForm({ ...giderForm, category: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="SHIPPING">🚚 Kargo</option>
                    <option value="MARKETING">📢 Reklam</option>
                    <option value="COMMISSION">💳 Komisyon</option>
                    <option value="OPERATIONAL">🏢 Genel İşletme</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">KDV Oranı (%) *</label>
                  <select
                    value={giderForm.vatRate}
                    onChange={(e) => setGiderForm({ ...giderForm, vatRate: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="20">%20</option>
                    <option value="10">%10</option>
                    <option value="1">%1</option>
                    <option value="0">%0</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tutar (KDV Dahil ₺) *</label>
                  <input
                    type="number" step="0.01" required value={giderForm.amount}
                    onChange={(e) => setGiderForm({ ...giderForm, amount: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Belge Tarihi *</label>
                  <input
                    type="date" required value={giderForm.date}
                    onChange={(e) => setGiderForm({ ...giderForm, date: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#CC4E00] hover:bg-[#b04300] text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                Gideri Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">Kayıtlı Giderler</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Açıklama</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Toplam (₺)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2.5 px-3 text-xs text-gray-500">{new Date(e.date).toLocaleDateString('tr-TR')}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{e.title}</td>
                      <td className="py-2.5 px-3 text-xs">{KATEGORI_ETIKETLERI[e.category] || e.category}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{paraFormat(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MAL KABUL & STOK GİRİŞİ */}
      {activeTab === 'stok-girisi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-fit">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LuPackagePlus className="text-[#CC4E00]" /> Mal Kabulü (WAV Maliyet)
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setStokLoading(true);
              const res = await fetch('/api/admin/muhasebe/stok-hareketleri', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stokForm),
              });
              const json = await res.json();
              if (res.ok) {
                setStokMesaj({ tur: 'basari', text: `Yeni Ortalama Maliyet: ${json.product?.purchasePrice} ₺` });
                stokYukle();
                ozetYukle();
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ürün Seçin *</label>
                <select
                  required value={stokForm.productId}
                  onChange={(e) => setStokForm({ ...stokForm, productId: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
                >
                  <option value="">— Ürün Seçin —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Stok: {p.quantity})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gelen Adet *</label>
                  <input
                    type="number" min="1" required value={stokForm.quantity}
                    onChange={(e) => setStokForm({ ...stokForm, quantity: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Birim Alış (₺) *</label>
                  <input
                    type="number" step="0.01" min="0" required value={stokForm.unitCost}
                    onChange={(e) => setStokForm({ ...stokForm, unitCost: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#CC4E00] hover:bg-[#b04300] text-white font-semibold py-2.5 rounded-xl text-sm">
                Stok Kabulünü Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">Son Mal Kabul Hareketleri</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Ürün</th>
                    <th className="py-2.5 px-3 text-right">Adet</th>
                    <th className="py-2.5 px-3 text-right">Giriş Maliyeti</th>
                    <th className="py-2.5 px-3 text-right">Toplam (₺)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2.5 px-3 text-xs text-gray-500">{new Date(m.createdAt).toLocaleDateString('tr-TR')}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{m.product?.name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">+{m.quantity}</td>
                      <td className="py-2.5 px-3 text-right">{paraFormat(m.unitCost)}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{paraFormat(m.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: KRİTİK STOK */}
      {activeTab === 'kritik-stok' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Kritik Stok Seviyesindeki Ürünler</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                  <th className="py-2.5 px-3">Ürün</th>
                  <th className="py-2.5 px-3 text-center">Kalan Stok</th>
                  <th className="py-2.5 px-3 text-center">Kritik Eşik</th>
                  <th className="py-2.5 px-3 text-right">Alış Fiyatı</th>
                  <th className="py-2.5 px-3 text-right">Satış Fiyatı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {criticalList.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{p.name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-red-600">{p.quantity} adet</td>
                    <td className="py-2.5 px-3 text-center text-xs text-gray-500">{p.minStockLevel ?? 5} adet</td>
                    <td className="py-2.5 px-3 text-right">{paraFormat(p.purchasePrice)}</td>
                    <td className="py-2.5 px-3 text-right font-bold">{paraFormat(p.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: CARİ EKSTRE ─── */}
      {ekstreModal && seciliCariEkstre && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{seciliCariEkstre.cari.unvan}</h3>
                <p className="text-xs text-gray-500">Cari Kodu: {seciliCariEkstre.cari.kod} • Muhasebe Kodu: {seciliCariEkstre.cari.muhasebeKodu}</p>
              </div>
              <button onClick={() => setEkstreModal(false)} className="text-gray-400 hover:text-gray-700 font-bold text-lg">&times;</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-500 uppercase">
                    <th className="py-2 px-2">Tarih</th>
                    <th className="py-2 px-2">İşlem Türü</th>
                    <th className="py-2 px-2">Açıklama / Belge</th>
                    <th className="py-2 px-2 text-right">Borç</th>
                    <th className="py-2 px-2 text-right">Alacak</th>
                    <th className="py-2 px-2 text-right">Bakiye</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {seciliCariEkstre.hareketler.map((h: any) => (
                    <tr key={h.id}>
                      <td className="py-2 px-2">{new Date(h.tarih).toLocaleDateString('tr-TR')}</td>
                      <td className="py-2 px-2 font-semibold">{h.islemTuru}</td>
                      <td className="py-2 px-2 text-gray-600">{h.aciklama}</td>
                      <td className="py-2 px-2 text-right text-red-600 font-medium">{h.borc > 0 ? paraFormat(h.borc) : '—'}</td>
                      <td className="py-2 px-2 text-right text-emerald-600 font-medium">{h.alacak > 0 ? paraFormat(h.alacak) : '—'}</td>
                      <td className="py-2 px-2 text-right font-bold">{paraFormat(h.bakiye)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500">Kümülatif Cari Bakiye:</span>
              <span className="text-base font-extrabold text-[#CC4E00]">{paraFormat(seciliCariEkstre.cari.bakiye)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: YENİ CARİ KART ─── */}
      {yeniCariModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-900 text-base">Yeni Cari Kart Aç (120/320)</h3>
              <button onClick={() => setYeniCariModal(false)} className="text-gray-400 hover:text-gray-700 text-lg">&times;</button>
            </div>
            <form onSubmit={handleCariSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Cari Türü *</label>
                <select
                  value={cariForm.tur} onChange={(e) => setCariForm({ ...cariForm, tur: e.target.value })}
                  className="w-full border rounded-xl p-2 bg-white"
                >
                  <option value="ALICI">120 Alıcılar (Müşteri)</option>
                  <option value="SATICI">320 Satıcılar (Tedarikçi İşyurdu)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Unvan / Ad Soyad *</label>
                <input
                  type="text" required value={cariForm.unvan} onChange={(e) => setCariForm({ ...cariForm, unvan: e.target.value })}
                  className="w-full border rounded-xl p-2" placeholder="Örn: Ahmet Yılmaz veya Isparta İşyurdu Müd."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">TC / Vergi No</label>
                  <input
                    type="text" value={cariForm.vergiTcNo} onChange={(e) => setCariForm({ ...cariForm, vergiTcNo: e.target.value })}
                    className="w-full border rounded-xl p-2" placeholder="11 haneli TC veya 10 haneli VKN"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Vergi Dairesi</label>
                  <input
                    type="text" value={cariForm.vergiDairesi} onChange={(e) => setCariForm({ ...cariForm, vergiDairesi: e.target.value })}
                    className="w-full border rounded-xl p-2" placeholder="Örn: Kadıköy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">E-posta</label>
                  <input
                    type="email" value={cariForm.eposta} onChange={(e) => setCariForm({ ...cariForm, eposta: e.target.value })}
                    className="w-full border rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Telefon</label>
                  <input
                    type="text" value={cariForm.telefon} onChange={(e) => setCariForm({ ...cariForm, telefon: e.target.value })}
                    className="w-full border rounded-xl p-2"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#CC4E00] text-white font-bold py-2.5 rounded-xl mt-2">
                Cari Kartı Oluştur
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: YENİ BANKA HESABI ─── */}
      {yeniHesapModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-900 text-base">Yeni Banka / POS Hesabı</h3>
              <button onClick={() => setYeniHesapModal(false)} className="text-gray-400 hover:text-gray-700 text-lg">&times;</button>
            </div>
            <form onSubmit={handleHesapSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Hesap Adı *</label>
                <input
                  type="text" required value={hesapForm.hesapAdi} onChange={(e) => setHesapForm({ ...hesapForm, hesapAdi: e.target.value })}
                  placeholder="Örn: Ziraat Bankası Ticari TL veya İyzico Havuz" className="w-full border rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Banka / Kurum Adı *</label>
                <input
                  type="text" required value={hesapForm.bankaAdi} onChange={(e) => setHesapForm({ ...hesapForm, bankaAdi: e.target.value })}
                  placeholder="Ziraat Bankası, Vakıfbank, İyzico..." className="w-full border rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">IBAN No</label>
                <input
                  type="text" value={hesapForm.iban} onChange={(e) => setHesapForm({ ...hesapForm, iban: e.target.value })}
                  placeholder="TR..." className="w-full border rounded-xl p-2 font-mono"
                />
              </div>
              <button type="submit" className="w-full bg-[#CC4E00] text-white font-bold py-2.5 rounded-xl mt-2">
                Hesabı Kaydet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
