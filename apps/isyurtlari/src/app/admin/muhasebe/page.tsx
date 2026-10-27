'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import {
  LuTrendingUp, LuFileText, LuTriangleAlert, LuPercent, LuPlus,
  LuReceipt, LuPackagePlus, LuDownload, LuTrash2, LuCheck,
  LuUsers, LuBuilding2, LuEye, LuSend,
  LuPencil, LuPrinter, LuSearch,
  LuBoxes,
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
  const [days, setDays] = useState(0);

  // 1. Özet State
  const [ozetData, setOzetData] = useState<any>(null);
  const [ozetLoading, setOzetLoading] = useState(true);

  // 2. Cariler State
  const [cariler, setCariler] = useState<any[]>([]);
  const [cariLoading, setCariLoading] = useState(false);
  const [cariTurFiltre, setCariTurFiltre] = useState('');
  const [seciliCariEkstre, setSeciliCariEkstre] = useState<any>(null);
  const [ekstreModal, setEkstreModal] = useState(false);

  // Cari Düzenle / İncele State
  const [seciliCariDuzenle, setSeciliCariDuzenle] = useState<any>(null);
  const [cariDuzenleModal, setCariDuzenleModal] = useState(false);
  const [cariGuncelleLoading, setCariGuncelleLoading] = useState(false);
  const [cariDuzenleForm, setCariDuzenleForm] = useState({
    unvan: '',
    tur: 'ALICI',
    vergiTcNo: '',
    vergiDairesi: '',
    eposta: '',
    telefon: '',
    adres: '',
    sehir: '',
    muhasebeKodu: '',
  });

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
  const [gonderiliyorId, setGonderiliyorId] = useState<string | null>(null);
  const [yeniFaturaModal, setYeniFaturaModal] = useState(false);
  const [faturaSyncing, setFaturaSyncing] = useState(false);

  // Fatura Önizle / Düzenle State
  const [seciliFaturaOnizle, setSeciliFaturaOnizle] = useState<any>(null);
  const [faturaOnizleModal, setFaturaOnizleModal] = useState(false);
  const [faturaGuncelleLoading, setFaturaGuncelleLoading] = useState(false);
  const [faturaDuzenleForm, setFaturaDuzenleForm] = useState({
    faturaNo: '',
    aciklama: '',
    durum: 'ONAYLANDI',
  });

  const [faturaForm, setFaturaForm] = useState({
    tur: 'SATIS',
    cariId: '',
    faturaNo: '',
    aciklama: '',
    satirlar: [
      { productId: '', aciklama: '', miktar: 1, birimFiyat: '', kdvOrani: 20 },
    ],
  });

  // 4. Banka & Kasa State
  const [bankaHesaplari, setBankaHesaplari] = useState<any[]>([]);
  const [, setBankaLoading] = useState(false);
  const [yeniHesapModal, setYeniHesapModal] = useState(false);
  const [hesapForm, setHesapForm] = useState({ hesapAdi: '', bankaAdi: '', iban: '' });

  // 5. Giderler State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [, setExpLoading] = useState(false);
  const [seciliGiderKat] = useState('');
  const [giderForm, setGiderForm] = useState({
    title: '', category: 'SHIPPING', amount: '', vatRate: '20',
    invoiceNo: '', supplier: '', notes: '', date: new Date().toISOString().split('T')[0],
  });

  // 6. Stok & WAV State
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [, setStokLoading] = useState(false);
  const [, setStokMesaj] = useState<{ tur: 'basari' | 'hata'; text: string } | null>(null);
  const [stokForm, setStokForm] = useState({
    productId: '', quantity: '', unitCost: '', invoiceNo: '', supplier: '', notes: '',
  });

  // 7. Kritik Stok & Envanter State
  const [criticalList, setCriticalList] = useState<any[]>([]);
  const [critLoading, setCritLoading] = useState(false);
  const [critFilter, setCritFilter] = useState<'critical' | 'outOfStock' | 'all'>('critical');
  const [critSearch, setCritSearch] = useState('');
  const [critStats, setCritStats] = useState({ totalCount: 0, criticalCount: 0, outOfStockCount: 0 });
  const [stokDuzenleModal, setStokDuzenleModal] = useState(false);
  const [seciliUrunStok, setSeciliUrunStok] = useState<any>(null);
  const [stokDuzenleForm, setStokDuzenleForm] = useState({
    quantity: '',
    minStockLevel: '',
    purchasePrice: '',
  });
  const [stokGuncelleLoading, setStokGuncelleLoading] = useState(false);

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

  const gibeGonder = async (id: string) => {
    if (!confirm('Bu fatura Logo İşNet üzerinden GİB e-Arşiv sistemine resmi olarak iletilecektir. Onaylıyor musunuz?')) return;
    setGonderiliyorId(id);
    try {
      const res = await fetch(`/api/admin/muhasebe/faturalar/${id}/gib-gonder`, { method: 'POST' });
      const d = await res.json();
      if (res.ok) {
        alert(`✅ Fatura GİB sistemine başarıyla iletildi!\n\nGİB Fatura No: ${d.gibFaturaNo}\nETTN: ${d.ettn}`);
        faturalariYukle();
      } else {
        alert(`⚠️ Hata: ${d.error}`);
      }
    } catch {
      alert('⚠️ Bağlantı hatası, fatura iletilemedi.');
    } finally {
      setGonderiliyorId(null);
    }
  };

  const siparisleriFaturalandir = async () => {
    if (!confirm('Geçmişte faturası henüz kesilmemiş siparişler taranacak ve otomatik satış faturaları oluşturulacaktır. Onaylıyor musunuz?')) return;
    setFaturaSyncing(true);
    try {
      const res = await fetch('/api/admin/muhasebe/faturalar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncOrders: true }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message || 'Siparişler başarıyla eşitlendi!'}`);
        faturalariYukle();
        carileriYukle();
        ozetYukle();
      } else {
        alert(`⚠️ Hata: ${data.error || 'İşlem başarısız'}`);
      }
    } catch {
      alert('⚠️ Bağlantı hatası oluştu.');
    } finally {
      setFaturaSyncing(false);
    }
  };

  const handleFaturaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faturaForm.cariId) {
      alert('Lütfen faturanın bağlanacağı cari kartı seçin.');
      return;
    }
    const gecerliSatirlar = faturaForm.satirlar.filter(
      (s) => s.aciklama.trim() && Number(s.birimFiyat) > 0
    );
    if (gecerliSatirlar.length === 0) {
      alert('Lütfen en az bir geçerli fatura kalemi (açıklama ve birim fiyat) girin.');
      return;
    }

    try {
      const payload = {
        tur: faturaForm.tur,
        cariId: faturaForm.cariId,
        faturaNo: faturaForm.faturaNo.trim() || undefined,
        aciklama: faturaForm.aciklama.trim() || (faturaForm.tur === 'SATIS' ? 'Satış Faturası' : 'Alış Faturası'),
        satirlar: gecerliSatirlar.map((s) => ({
          productId: s.productId || null,
          aciklama: s.aciklama.trim(),
          miktar: Number(s.miktar) || 1,
          birimFiyat: Number(s.birimFiyat),
          kdvOrani: Number(s.kdvOrani) || 20,
        })),
      };

      const res = await fetch('/api/admin/muhasebe/faturalar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (res.ok) {
        alert(`✅ Fatura (${d.faturaNo}) başarıyla kaydedildi!`);
        setYeniFaturaModal(false);
        setFaturaForm({
          tur: 'SATIS',
          cariId: '',
          faturaNo: '',
          aciklama: '',
          satirlar: [{ productId: '', aciklama: '', miktar: 1, birimFiyat: '', kdvOrani: 20 }],
        });
        faturalariYukle();
        carileriYukle();
        ozetYukle();
      } else {
        alert(`⚠️ Hata: ${d.error}`);
      }
    } catch {
      alert('⚠️ Fatura kaydedilirken bir hata oluştu.');
    }
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
    const params = new URLSearchParams();
    params.set('filter', critFilter);
    if (critSearch.trim()) params.set('q', critSearch.trim());

    fetch(`/api/admin/muhasebe/kritik-stok?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setCriticalList(Array.isArray(d.products) ? d.products : []);
        setCritStats({
          totalCount: d.totalCount || 0,
          criticalCount: d.criticalCount || 0,
          outOfStockCount: d.outOfStockCount || 0,
        });
        setCritLoading(false);
      })
      .catch(() => setCritLoading(false));
  };

  const stokDuzenleAc = (urun: any) => {
    setSeciliUrunStok(urun);
    setStokDuzenleForm({
      quantity: String(urun.quantity ?? 0),
      minStockLevel: String(urun.minStockLevel ?? 5),
      purchasePrice: String(urun.purchasePrice ?? 0),
    });
    setStokDuzenleModal(true);
  };

  const handleStokDuzenleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seciliUrunStok) return;
    setStokGuncelleLoading(true);
    try {
      const res = await fetch('/api/admin/muhasebe/kritik-stok', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: seciliUrunStok.id,
          quantity: stokDuzenleForm.quantity,
          minStockLevel: stokDuzenleForm.minStockLevel,
          purchasePrice: stokDuzenleForm.purchasePrice,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        alert('✅ Ürün stok ve kritik eşik bilgileri güncellendi!');
        setStokDuzenleModal(false);
        kritikYukle();
        ozetYukle();
      } else {
        alert(`⚠️ Hata: ${d.error}`);
      }
    } catch {
      alert('⚠️ Stok güncellenirken hata oluştu');
    } finally {
      setStokGuncelleLoading(false);
    }
  };

  const hizliStokEkle = async (urun: any, miktar: number) => {
    const yeniStok = (urun.quantity || 0) + miktar;
    try {
      const res = await fetch('/api/admin/muhasebe/kritik-stok', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: urun.id,
          quantity: yeniStok,
        }),
      });
      if (res.ok) {
        alert(`✅ ${urun.name} stoğu +${miktar} artırıldı (Yeni Stok: ${yeniStok})`);
        kritikYukle();
        ozetYukle();
      }
    } catch {
      alert('⚠️ Stok güncellenemedi');
    }
  };

  useEffect(() => { ozetYukle(); }, [days]);

  useEffect(() => {
    if (activeTab === 'cariler') carileriYukle();
    if (activeTab === 'faturalar') faturalariYukle();
    if (activeTab === 'banka') bankaYukle();
    if (activeTab === 'giderler') giderleriYukle();
    if (activeTab === 'stok-girisi') stokYukle();
    if (activeTab === 'kritik-stok') kritikYukle();
  }, [activeTab, cariTurFiltre, seciliGiderKat, critFilter]);

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

  // Cari Düzenle / İncele Aç
  const cariDuzenleAc = async (cariId: string) => {
    try {
      const res = await fetch(`/api/admin/muhasebe/cariler/${cariId}`);
      const data = await res.json();
      if (res.ok) {
        setSeciliCariDuzenle(data);
        setCariDuzenleForm({
          unvan: data.unvan || '',
          tur: data.tur || 'ALICI',
          vergiTcNo: data.vergiTcNo || '',
          vergiDairesi: data.vergiDairesi || '',
          eposta: data.eposta || '',
          telefon: data.telefon || '',
          adres: data.adres || '',
          sehir: data.sehir || '',
          muhasebeKodu: data.muhasebeKodu || '',
        });
        setCariDuzenleModal(true);
      } else {
        alert(data.error || 'Cari kart detayları alınamadı');
      }
    } catch {
      alert('Cari kart yüklenirken bağlantı hatası oluştu');
    }
  };

  // Cari Bilgilerini Güncelle
  const handleCariGuncelle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seciliCariDuzenle) return;
    setCariGuncelleLoading(true);
    try {
      const res = await fetch(`/api/admin/muhasebe/cariler/${seciliCariDuzenle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cariDuzenleForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Cari kart bilgileri başarıyla güncellendi!');
        setCariDuzenleModal(false);
        carileriYukle();
        if (activeTab === 'faturalar') faturalariYukle();
      } else {
        alert(`⚠️ Hata: ${data.error || 'Güncelleme başarısız'}`);
      }
    } catch {
      alert('⚠️ Cari kart güncellenirken hata oluştu.');
    } finally {
      setCariGuncelleLoading(false);
    }
  };

  // Cari Kartı Sil
  const handleCariSil = async (cariId: string) => {
    if (!confirm('Bu cari kartı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/muhasebe/cariler/${cariId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Cari kart silindi.');
        setCariDuzenleModal(false);
        carileriYukle();
      } else {
        alert(`⚠️ Hata: ${data.error}`);
      }
    } catch {
      alert('⚠️ Cari kart silinirken hata oluştu.');
    }
  };

  // Fatura Önizle / Detay Aç
  const faturaOnizleAc = async (faturaId: string) => {
    try {
      const res = await fetch(`/api/admin/muhasebe/faturalar/${faturaId}`);
      const data = await res.json();
      if (res.ok) {
        setSeciliFaturaOnizle(data);
        setFaturaDuzenleForm({
          faturaNo: data.faturaNo || '',
          aciklama: data.aciklama || '',
          durum: data.durum || 'ONAYLANDI',
        });
        setFaturaOnizleModal(true);
      } else {
        alert(data.error || 'Fatura detayları alınamadı');
      }
    } catch {
      alert('Fatura bilgileri yüklenirken hata oluştu');
    }
  };

  // Fatura Bilgilerini Güncelle
  const handleFaturaGuncelle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seciliFaturaOnizle) return;
    setFaturaGuncelleLoading(true);
    try {
      const res = await fetch(`/api/admin/muhasebe/faturalar/${seciliFaturaOnizle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faturaDuzenleForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Fatura bilgileri başarıyla güncellendi!');
        setSeciliFaturaOnizle(data);
        faturalariYukle();
      } else {
        alert(`⚠️ Hata: ${data.error || 'Güncelleme başarısız'}`);
      }
    } catch {
      alert('⚠️ Fatura güncellenirken hata oluştu.');
    } finally {
      setFaturaGuncelleLoading(false);
    }
  };

  // Faturayı Sil (Taslak ise)
  const handleFaturaSil = async (faturaId: string) => {
    if (!confirm('Bu faturayı silmek istediğinize emin misiniz? Cari hesaptaki borç/alacak kaydı da geri alınacaktır.')) return;
    try {
      const res = await fetch(`/api/admin/muhasebe/faturalar/${faturaId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Fatura silindi ve cari bakiye düzeltildi.');
        setFaturaOnizleModal(false);
        faturalariYukle();
        carileriYukle();
        ozetYukle();
      } else {
        alert(`⚠️ Hata: ${data.error}`);
      }
    } catch {
      alert('⚠️ Fatura silinirken hata oluştu.');
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
          onClick={() => {
            setCritFilter('critical');
            setActiveTab('kritik-stok');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'kritik-stok' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          <LuTriangleAlert size={16} />
          Kritik Stok
          {ozetData?.criticalStockCount > 0 ? (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 animate-pulse">
              {ozetData.criticalStockCount}
            </span>
          ) : (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
              0
            </span>
          )}
        </button>
      </div>

      {/* ─── 3. SEKME İÇERİKLERİ ─── */}

      {/* TAB 1: P&L GELİR TABLOSU & KÂRLILIK */}
      {activeTab === 'ozet' && (
        <div className="space-y-6">
          {/* Dönem Filtresi & Başlık */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                📊 Finansal Tablolar, P&L & Kârlılık Analizi
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Sipariş gelirleri, satılan mal maliyetleri (621 SMM), faaliyet giderleri ve net kâr hesaplamaları.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setDays(0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  days === 0 ? 'bg-[#0F2040] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tüm Zamanlar
              </button>
              <button
                onClick={() => setDays(365)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  days === 365 ? 'bg-[#0F2040] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bu Yıl (2026)
              </button>
              <button
                onClick={() => setDays(90)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  days === 90 ? 'bg-[#0F2040] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Son 90 Gün
              </button>
              <button
                onClick={() => setDays(30)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  days === 30 ? 'bg-[#0F2040] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Son 30 Gün
              </button>
            </div>
          </div>

          {ozetLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">Finansal veriler hesaplanıyor...</div>
          ) : !ozetData || ozetData.error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">Finansal özet yüklenemedi.</div>
          ) : (
            <>
              {/* 4 Özet Kart */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Net Hasılat (600)</span>
                  <div className="text-2xl font-bold text-gray-900">{paraFormat(ozetData.metrics.netRevenue)}</div>
                  <div className="text-xs text-gray-500 mt-1">KDV Dahil Ciro: {paraFormat(ozetData.metrics.totalRevenue)}</div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Mal Maliyeti (621 SMM)</span>
                  <div className="text-2xl font-bold text-gray-900">{paraFormat(ozetData.metrics.cogs)}</div>
                  <div className="text-xs text-gray-500 mt-1">{ozetData.orderCount} sipariş + {ozetData.manualInvoiceCount || 0} fatura maliyeti</div>
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

              {/* ÜRÜN BAZLI KÂRLILIK ANALİZİ (TOP KÂRLI ÜRÜNLER) */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <LuTrendingUp className="text-emerald-600" /> Ürün Bazlı Kârlılık Analizi (Top Kârlı Ürünler)
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Satışı yapılan ürünlerin toplam cirosu, girdi maliyeti, sağladığı brüt kâr ve net kâr marjı dökümü.
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
                    Kârlılık Sıralı ({ozetData.productProfitability?.length || 0} Ürün)
                  </span>
                </div>

                {ozetData.productProfitability && ozetData.productProfitability.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase text-[11px]">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Ürün Adı</th>
                          <th className="py-2.5 px-3 text-center">Satılan Adet</th>
                          <th className="py-2.5 px-3 text-right">Toplam Hasılat</th>
                          <th className="py-2.5 px-3 text-right">Girdi Maliyeti (SMM)</th>
                          <th className="py-2.5 px-3 text-right">Brüt Kâr</th>
                          <th className="py-2.5 px-3 text-center">Kâr Marjı (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ozetData.productProfitability.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-2.5 px-3 text-gray-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-gray-900">{p.name}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-gray-800">{p.quantitySold} Adet</td>
                            <td className="py-2.5 px-3 text-right font-medium text-gray-900">{paraFormat(p.totalRevenue)}</td>
                            <td className="py-2.5 px-3 text-right font-medium text-red-600">-{paraFormat(p.totalCost)}</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600">{paraFormat(p.grossProfit)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                %{p.margin}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs bg-gray-50 rounded-xl space-y-2">
                    <p>Seçilen dönemde henüz satılan ürün veya sipariş kaydı bulunmuyor.</p>
                    <button
                      onClick={() => setDays(0)}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      Dönemi "Tüm Zamanlar" Olarak Değiştir
                    </button>
                  </div>
                )}
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
                onClick={async () => {
                  if (!confirm('5 büyük Cezaevi İşyurdu Müdürlüğü (320 Tedarikçi) ve başlangıç ürün maliyetleri otomatik tanımlanacaktır. Onaylıyor musunuz?')) return;
                  setCariLoading(true);
                  const res = await fetch('/api/admin/muhasebe/seed-suppliers', { method: 'POST' });
                  const data = await res.json();
                  if (res.ok) {
                    alert(`✅ ${data.message}\nGüncellenen Ürün Sayısı: ${data.guncellenenUrunSayisi}`);
                    carileriYukle();
                  } else {
                    alert(`⚠️ ${data.error}`);
                  }
                  setCariLoading(false);
                }}
                className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                title="Niğde, Foça, Edirne, Bozkurt ve Menemen Cezaevi İşyurtlarını 320 cari olarak kaydeder"
              >
                🏛️ Cezaevi Tedarikçilerini Tanımla
              </button>
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
                    <th className="py-3 px-3 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cariler.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => cariDuzenleAc(c.id)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                      title="Detayları incelemek ve tüzel kişilik bilgilerini düzenlemek için tıklayın"
                    >
                      <td className="py-3 px-3 font-mono text-xs font-bold text-blue-900">{c.kod}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span>{c.unvan}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded transition-opacity">
                            ✏️ Düzenle
                          </span>
                        </div>
                        {c.vergiTcNo && <span className="block text-[11px] text-gray-400 font-normal">TC/VKN: {c.vergiTcNo}</span>}
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
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => cariDuzenleAc(c.id)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg text-amber-800 transition-colors flex items-center gap-1 text-xs font-semibold px-2.5 border border-amber-200"
                            title="Tüzel Kişilik / Cari Bilgilerini İncele ve Düzenle"
                          >
                            <LuPencil size={13} /> Düzenle
                          </button>
                          <button
                            onClick={() => ekstreAc(c.id)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-800 transition-colors flex items-center gap-1 text-xs font-semibold px-2.5 border border-blue-200"
                            title="Cari Hesap Ekstresi (Borç/Alacak Dökümü)"
                          >
                            <LuEye size={14} /> Ekstre
                          </button>
                        </div>
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Satış ve Satınalma Faturaları</h2>
              <p className="text-xs text-gray-500 mt-0.5">Siparişlerden otomatik kesilen ve mal alımlarına ait resmi fatura kayıtları.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={siparisleriFaturalandir}
                disabled={faturaSyncing}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors border border-gray-200"
                title="Sitedeki geçmiş siparişleri tarayarak faturası henüz kesilmemiş olanları otomatik muhasebeleştirir"
              >
                <LuReceipt size={14} />
                {faturaSyncing ? 'Eşitleniyor...' : '🔄 Sipariş Faturalarını Eşitle'}
              </button>
              <button
                onClick={() => {
                  carileriYukle();
                  stokYukle();
                  setYeniFaturaModal(true);
                }}
                className="flex items-center gap-1.5 bg-[#CC4E00] hover:bg-[#b04300] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
              >
                <LuPlus size={16} /> Yeni Fatura Kes / Girişi Yap
              </button>
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
                    <th className="py-3 px-3 text-center">e-Arşiv (GİB)</th>
                    <th className="py-3 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {faturalar.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => faturaOnizleAc(f.id)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                      title="Faturayı önizlemek ve detaylarını incelemek için tıklayın"
                    >
                      <td className="py-3 px-3 font-mono text-xs font-bold text-[#BA4700]">
                        <span className="group-hover:underline flex items-center gap-1">
                          {f.faturaNo}
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded">
                            👁️ Önizle
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">{new Date(f.tarih).toLocaleDateString('tr-TR')}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cariDuzenleAc(f.cariId);
                          }}
                          className="hover:text-blue-700 hover:underline text-left inline-flex items-center gap-1"
                          title="Tüzel Kişilik / Cari Kartını Düzenle"
                        >
                          {f.cari?.unvan}
                          <LuPencil size={11} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                        </button>
                      </td>
                      <td className="py-3 px-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.tur === 'SATIS' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          {f.tur === 'SATIS' ? 'Satış' : 'Satınalma'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-xs font-medium text-gray-600">{paraFormat(f.matrah)}</td>
                      <td className="py-3 px-3 text-right text-xs font-medium text-purple-600">{paraFormat(f.kdvTutari)}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">{paraFormat(f.genelToplam)}</td>
                      <td className="py-3 px-3 text-center text-xs">
                        {f.gibFaturaNo ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <LuCheck size={11} /> {f.gibFaturaNo}
                            </span>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[120px] mx-auto" title={f.ettn}>
                              {f.ettn}
                            </p>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            Taslak
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => faturaOnizleAc(f.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-blue-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors border border-gray-200"
                            title="Fatura Detaylarını ve Kalemlerini Önizle / Düzenle"
                          >
                            <LuEye size={13} /> Önizle
                          </button>
                          {f.gibFaturaNo ? (
                            <a
                              href={`/api/admin/muhasebe/faturalar/${f.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors border border-blue-200"
                              title="Resmi e-Arşiv Faturasını Görüntüle ve Yazdır"
                            >
                              <LuPrinter size={13} /> Resmi Gör
                            </a>
                          ) : (
                            <button
                              onClick={() => gibeGonder(f.id)}
                              disabled={gonderiliyorId === f.id}
                              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                              title="Logo İşNet üzerinden GİB e-Arşiv faturası olarak ilet"
                            >
                              <LuSend size={12} />
                              {gonderiliyorId === f.id ? 'İletiliyor…' : "GİB'e Gönder"}
                            </button>
                          )}
                        </div>
                      </td>
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

      {/* TAB 7: KRİTİK STOK & ENVANTER KONTROL */}
      {activeTab === 'kritik-stok' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          {/* Üst Bar: Başlık, Filtreler & Arama */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <LuTriangleAlert className="text-amber-600" /> Kritik Stok & Envanter Kontrolü
                </h2>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  Canlı Takip
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Kritik eşiğin altına düşen ürünleri tespit edin, stok seviyelerini ve uyarı limitlerini doğrudan güncelleyin.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtre Tabları */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setCritFilter('critical')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    critFilter === 'critical'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LuTriangleAlert size={13} />
                  Kritik Stok
                  {(critStats?.criticalCount ?? 0) > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
                      {critStats.criticalCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setCritFilter('outOfStock')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    critFilter === 'outOfStock'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tükenenler ({critStats?.outOfStockCount ?? 0})
                </button>
                <button
                  onClick={() => setCritFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    critFilter === 'all'
                      ? 'bg-[#0F2040] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LuBoxes size={13} />
                  Tüm Envanter ({critStats?.totalCount ?? 0})
                </button>
              </div>

              {/* Arama Input */}
              <div className="relative">
                <LuSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ürün adı ara..."
                  value={critSearch}
                  onChange={(e) => setCritSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && kritikYukle()}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl w-44 focus:w-56 transition-all focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={() => setActiveTab('stok-girisi')}
                className="flex items-center gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl transition-colors shadow-sm"
              >
                <LuPlus size={14} /> Mal Kabul Yap
              </button>
            </div>
          </div>

          {/* İstatistik Çubuğu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-xl border ${
              critStats.criticalCount > 0 ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-gray-50 border-gray-100 text-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">⚠️ Kritik Eşik Altındaki Ürünler</span>
                <span className="text-lg font-extrabold">{critStats.criticalCount}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Stok adedi belirlenen kritik eşiğin altında kalanlar</p>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              critStats.outOfStockCount > 0 ? 'bg-red-50/80 border-red-200 text-red-900' : 'bg-gray-50 border-gray-100 text-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">🔴 Tamamen Tükenen Ürünler</span>
                <span className="text-lg font-extrabold">{critStats.outOfStockCount}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Stok miktarı sıfır (0) olan ürünler</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-blue-50/60 border-blue-100 text-blue-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">📦 Toplam Takip Edilen Ürün</span>
                <span className="text-lg font-extrabold">{critStats.totalCount}</span>
              </div>
              <p className="text-[11px] text-blue-600 mt-1">Katalogda aktif bulunan ürün çeşidi</p>
            </div>
          </div>

          {/* Tablo veya Durum Kartı */}
          {critLoading ? (
            <div className="text-center py-12 text-gray-400 text-xs">Stok verileri yükleniyor...</div>
          ) : criticalList.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              {critFilter === 'critical' ? (
                <>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Tüm Ürünlerin Stok Seviyesi Güvenli Bölgede!</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Şu anda kritik stok eşiğinin (varsayılan: 5 adet) altında hiçbir ürün bulunmuyor. Depo stoklarınız yeterli seviyede.
                  </p>
                  <button
                    onClick={() => setCritFilter('all')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2040] hover:bg-[#1a3360] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                  >
                    <LuBoxes size={14} /> Tüm Ürünlerin Stok ve Eşik Ayarlarını Görüntüle
                  </button>
                </>
              ) : critFilter === 'outOfStock' ? (
                <>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Tükenen Ürün Bulunmuyor</h3>
                  <p className="text-xs text-gray-500">Katalogdaki tüm ürünlerin stoğu mevcuttur.</p>
                </>
              ) : (
                <p className="text-gray-500 text-xs">Aradığınız kriterlere uygun ürün bulunamadı.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 uppercase text-[11px]">
                    <th className="py-3 px-3">Ürün Adı</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-center">Kalan Stok</th>
                    <th className="py-3 px-3 text-center">Kritik Alarm Eşiği</th>
                    <th className="py-3 px-3 text-right">Birim Alış (SMM)</th>
                    <th className="py-3 px-3 text-right">Satış Fiyatı</th>
                    <th className="py-3 px-3 text-center">Durum</th>
                    <th className="py-3 px-3 text-center">Hızlı İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {criticalList.map((p) => {
                    const isOutOfStock = (p.quantity ?? 0) <= 0;
                    const isCritical = (p.quantity ?? 0) <= (p.minStockLevel ?? 5);

                    return (
                      <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-3 font-semibold text-gray-900">
                          {p.name}
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {p.category?.name || 'Genel'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block font-extrabold px-2.5 py-1 rounded-lg text-xs ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-800'
                              : isCritical
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {p.quantity} Adet
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium text-gray-600">
                          {p.minStockLevel ?? 5} Adet
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-gray-600">
                          {paraFormat(p.purchasePrice || (p.price || 0) * 0.55)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                          {paraFormat(p.price || 0)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                              Tükendi
                            </span>
                          ) : isCritical ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Kritik Seviye
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Yeterli
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => hizliStokEkle(p, 10)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-colors"
                              title="+10 Adet Hızlı Stok Ekle"
                            >
                              +10 Ekle
                            </button>
                            <button
                              onClick={() => stokDuzenleAc(p)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Stok Miktarı ve Kritik Eşiği Düzenle"
                            >
                              <LuPencil size={11} /> Düzenle
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
                  placeholder="Örn: Halkbank Ticari TL veya İyzico Havuz" className="w-full border rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Banka / Kurum Adı *</label>
                <input
                  type="text" required value={hesapForm.bankaAdi} onChange={(e) => setHesapForm({ ...hesapForm, bankaAdi: e.target.value })}
                  placeholder="Halkbank, Vakıfbank, İyzico..." className="w-full border rounded-xl p-2"
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

      {/* ─── MODAL: YENİ FATURA DÜZENLE (MANUEL GİRİŞ) ─── */}
      {yeniFaturaModal && (() => {
        const toplamGenel = faturaForm.satirlar.reduce(
          (acc, s) => acc + (Number(s.miktar) || 0) * (Number(s.birimFiyat) || 0),
          0
        );
        const toplamMatrah = faturaForm.satirlar.reduce((acc, s) => {
          const lineTotal = (Number(s.miktar) || 0) * (Number(s.birimFiyat) || 0);
          const vatRate = Number(s.kdvOrani) || 20;
          return acc + lineTotal / (1 + vatRate / 100);
        }, 0);
        const toplamKdv = Math.max(0, toplamGenel - toplamMatrah);

        const uygunCariler = cariler.filter((c) =>
          faturaForm.tur === 'SATIS' ? c.tur === 'ALICI' : c.tur === 'SATICI'
        );
        const listelenecekCariler = uygunCariler.length > 0 ? uygunCariler : cariler;

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {faturaForm.tur === 'SATIS' ? '🧾 Manuel Satış Faturası Kes' : '📦 Manuel Satınalma / Alış Faturası Girişi'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Resmi e-Arşiv / muhasebe standartlarında doğrudan cari hesaba ve stoklara işlenen fatura düzenleyin.
                  </p>
                </div>
                <button
                  onClick={() => setYeniFaturaModal(false)}
                  className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleFaturaSubmit} className="space-y-4 text-xs">
                {/* Fatura Türü & Cari Kart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Fatura Türü *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFaturaForm({ ...faturaForm, tur: 'SATIS', cariId: '' })}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                          faturaForm.tur === 'SATIS'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        600 Satış Faturası
                      </button>
                      <button
                        type="button"
                        onClick={() => setFaturaForm({ ...faturaForm, tur: 'SATINALMA', cariId: '' })}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                          faturaForm.tur === 'SATINALMA'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        153 Mal Alış Faturası
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      {faturaForm.tur === 'SATIS' ? 'Müşteri / Cari Kart (120 Alıcılar) *' : 'Tedarikçi / İşyurdu (320 Satıcılar) *'}
                    </label>
                    <select
                      required
                      value={faturaForm.cariId}
                      onChange={(e) => setFaturaForm({ ...faturaForm, cariId: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2 bg-white font-medium"
                    >
                      <option value="">Cari Kart Seçiniz...</option>
                      {listelenecekCariler.map((c) => (
                        <option key={c.id} value={c.id}>
                          [{c.kod}] {c.unvan} {c.bakiye !== 0 ? `(Bakiye: ₺${c.bakiye.toFixed(2)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fatura No & Açıklama */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Fatura No (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={faturaForm.faturaNo}
                      onChange={(e) => setFaturaForm({ ...faturaForm, faturaNo: e.target.value })}
                      placeholder={faturaForm.tur === 'SATIS' ? 'Örn: FTR-2026-00001 (Boşsa otomatik üretilir)' : 'Örn: ALIS-2026-00001 veya İrsaliye No'}
                      className="w-full border border-gray-300 rounded-xl p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Açıklama / Not</label>
                    <input
                      type="text"
                      value={faturaForm.aciklama}
                      onChange={(e) => setFaturaForm({ ...faturaForm, aciklama: e.target.value })}
                      placeholder="Örn: Kurumsal Toptan Satış veya Isparta İşyurdu Sabun Alımı"
                      className="w-full border border-gray-300 rounded-xl p-2"
                    />
                  </div>
                </div>

                {/* Fatura Kalemleri (Satırlar) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-gray-800 uppercase tracking-wide text-[11px]">
                      Fatura Kalemleri ({faturaForm.satirlar.length} Kalem)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFaturaForm({
                          ...faturaForm,
                          satirlar: [
                            ...faturaForm.satirlar,
                            { productId: '', aciklama: '', miktar: 1, birimFiyat: '', kdvOrani: 20 },
                          ],
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <LuPlus size={13} /> Kalem Ekle
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {faturaForm.satirlar.map((satir, idx) => {
                      const lineTotal = (Number(satir.miktar) || 0) * (Number(satir.birimFiyat) || 0);
                      return (
                        <div
                          key={idx}
                          className="p-2.5 bg-gray-50/80 border border-gray-200 rounded-xl grid grid-cols-12 gap-2 items-center"
                        >
                          <div className="col-span-12 md:col-span-5">
                            <input
                              type="text"
                              required
                              placeholder="Ürün / Hizmet Açıklaması *"
                              value={satir.aciklama}
                              onChange={(e) => {
                                const newSatirlar = [...faturaForm.satirlar];
                                newSatirlar[idx].aciklama = e.target.value;
                                setFaturaForm({ ...faturaForm, satirlar: newSatirlar });
                              }}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-xs bg-white font-medium"
                            />
                            {products.length > 0 && (
                              <select
                                onChange={(e) => {
                                  const p = products.find((prod) => prod.id === e.target.value);
                                  if (p) {
                                    const newSatirlar = [...faturaForm.satirlar];
                                    newSatirlar[idx].productId = p.id;
                                    newSatirlar[idx].aciklama = p.name;
                                    newSatirlar[idx].birimFiyat = String(
                                      faturaForm.tur === 'SATINALMA' && p.purchasePrice > 0
                                        ? p.purchasePrice
                                        : p.price
                                    );
                                    newSatirlar[idx].kdvOrani = p.vatRate ?? 20;
                                    setFaturaForm({ ...faturaForm, satirlar: newSatirlar });
                                  }
                                }}
                                className="w-full border border-gray-200 rounded-md p-1 mt-1 text-[10px] text-gray-500 bg-white"
                                defaultValue=""
                              >
                                <option value="" disabled>Katalogdan Ürün Seç (Otomatik Doldur)...</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (Satış: ₺{p.price} · Alış: ₺{p.purchasePrice || 0})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div className="col-span-4 md:col-span-2">
                            <label className="block text-[10px] text-gray-400 mb-0.5">Adet</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={satir.miktar}
                              onChange={(e) => {
                                const newSatirlar = [...faturaForm.satirlar];
                                newSatirlar[idx].miktar = parseInt(e.target.value, 10) || 1;
                                setFaturaForm({ ...faturaForm, satirlar: newSatirlar });
                              }}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-xs bg-white text-center font-bold"
                            />
                          </div>

                          <div className="col-span-4 md:col-span-2">
                            <label className="block text-[10px] text-gray-400 mb-0.5">Birim Fiyat (₺)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              placeholder="0.00"
                              value={satir.birimFiyat}
                              onChange={(e) => {
                                const newSatirlar = [...faturaForm.satirlar];
                                newSatirlar[idx].birimFiyat = e.target.value;
                                setFaturaForm({ ...faturaForm, satirlar: newSatirlar });
                              }}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-xs bg-white text-right font-bold"
                            />
                          </div>

                          <div className="col-span-3 md:col-span-2">
                            <label className="block text-[10px] text-gray-400 mb-0.5">KDV %</label>
                            <select
                              value={satir.kdvOrani}
                              onChange={(e) => {
                                const newSatirlar = [...faturaForm.satirlar];
                                newSatirlar[idx].kdvOrani = parseInt(e.target.value, 10);
                                setFaturaForm({ ...faturaForm, satirlar: newSatirlar });
                              }}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-xs bg-white text-center font-semibold"
                            >
                              <option value="20">%20</option>
                              <option value="10">%10</option>
                              <option value="1">%1</option>
                              <option value="0">%0</option>
                            </select>
                          </div>

                          <div className="col-span-1 flex items-center justify-center pt-3">
                            <button
                              type="button"
                              disabled={faturaForm.satirlar.length === 1}
                              onClick={() => {
                                const newSatirlar = faturaForm.satirlar.filter((_, i) => i !== idx);
                                setFaturaForm({ ...faturaForm, satirlar: newSatirlar });
                              }}
                              className="text-gray-400 hover:text-red-500 disabled:opacity-30 p-1"
                              title="Satırı Sil"
                            >
                              <LuTrash2 size={16} />
                            </button>
                          </div>

                          <div className="col-span-12 text-right text-[11px] text-gray-500 font-mono pr-2">
                            Satır Toplamı (KDV Dahil): <strong className="text-gray-900">₺{lineTotal.toFixed(2)}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fatura Toplam Özeti */}
                <div className="bg-gray-900 text-white p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="text-gray-400 text-xs block">KDV Hariç Matrah</span>
                    <span className="font-mono font-bold text-sm">₺{toplamMatrah.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs block">Hesaplanan KDV</span>
                    <span className="font-mono font-bold text-sm text-purple-300">₺{toplamKdv.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 text-xs font-bold block uppercase tracking-wider">Fatura Genel Toplamı</span>
                    <span className="font-mono font-extrabold text-lg text-emerald-400">₺{toplamGenel.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setYeniFaturaModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#CC4E00] hover:bg-[#b04300] text-white font-bold rounded-xl shadow-md transition-colors"
                  >
                    Faturayı Oluştur ve Muhasebeye Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ─── MODAL: CARİ / TÜZEL KİŞİLİK İNCELE & DÜZENLE ─── */}
      {cariDuzenleModal && seciliCariDuzenle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 my-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {seciliCariDuzenle.tur === 'SATICI' ? '🏛️ Tedarikçi / İşyurdu Kartı' : '👤 Müşteri Cari Kartı'}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    seciliCariDuzenle.tur === 'ALICI' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {seciliCariDuzenle.tur === 'ALICI' ? '120 Alıcı' : '320 Satıcı'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  Cari Kodu: <strong className="text-blue-900">{seciliCariDuzenle.kod}</strong> · Muhasebe Planı: {seciliCariDuzenle.muhasebeKodu || '—'}
                </p>
              </div>
              <button
                onClick={() => setCariDuzenleModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none p-1"
              >
                &times;
              </button>
            </div>

            {/* Bakiye & İstatistik Kartı */}
            <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div>
                <span className="text-[11px] text-gray-500 block">Güncel Hesap Bakiyesi</span>
                <span className={`text-base font-extrabold font-mono ${
                  seciliCariDuzenle.bakiye > 0 ? 'text-emerald-600' : seciliCariDuzenle.bakiye < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {paraFormat(seciliCariDuzenle.bakiye)}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {seciliCariDuzenle.bakiye > 0 ? '(Alacaklıyız)' : seciliCariDuzenle.bakiye < 0 ? '(Borçluyuz)' : '(Bakiye Sıfır)'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Kayıtlı Fatura Sayısı</span>
                <span className="text-base font-bold text-gray-900">{seciliCariDuzenle._count?.faturalar ?? seciliCariDuzenle.faturalar?.length ?? 0} Adet</span>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">Hesap Hareketleri</span>
                <span className="text-base font-bold text-gray-900">{seciliCariDuzenle._count?.hareketler ?? seciliCariDuzenle.hareketler?.length ?? 0} Kayıt</span>
              </div>
            </div>

            {/* Düzenleme Formu */}
            <form onSubmit={handleCariGuncelle} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Cari Unvan / Şirket veya Kişi Adı *
                </label>
                <input
                  type="text"
                  required
                  value={cariDuzenleForm.unvan}
                  onChange={(e) => setCariDuzenleForm({ ...cariDuzenleForm, unvan: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold text-gray-900 focus:ring-2 focus:ring-[#BA4700]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Cari Türü</label>
                  <select
                    value={cariDuzenleForm.tur}
                    onChange={(e) => setCariDuzenleForm({ ...cariDuzenleForm, tur: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 bg-white font-medium"
                  >
                    <option value="ALICI">120 Alıcılar (Müşteri)</option>
                    <option value="SATICI">320 Satıcılar (Tedarikçi / Cezaevi İşyurdu)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tekdüzen Muhasebe Kodu</label>
                  <input
                    type="text"
                    value={cariDuzenleForm.muhasebeKodu}
                    onChange={(e) => setCariDuzenleForm({ ...cariDuzenleForm, muhasebeKodu: e.target.value })}
                    placeholder="Örn: 120.01.001 veya 320.01.005"
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Vergi No / T.C. Kimlik No</label>
                  <input
                    type="text"
                    value={cariDuzenleForm.vergiTcNo}
                    onChange={(e) => setCariDuzenleForm({ ...cariDuzenleForm, vergiTcNo: e.target.value })}
                    placeholder="10 veya 11 Haneli VKN/TCKN"
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Vergi Dairesi</label>
                  <input
                    type="text"
                    value={cariDuzenleForm.vergiDairesi}
                    onChange={(e) => setCariDuzenleForm({ ...cariDuzenleForm, vergiDairesi: e.target.value })}
                    placeholder="Örn: Ulus Vergi Dairesi"
                    className="w-full border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">E-Posta Adresi</label>
                  <input
                    type="email"
                    value={cariDuzenleForm.eposta}
                    onChange={(e) => setCariDuzenleForm({ ...cariDuzenleForm, eposta: e.target.value })}
                    placeholder="ornek@alanadi.com"
                    className="w-full border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Telefon Numarası</label>
                  <input
                    type="text"
                    value={cariDuzenleForm.telefon}
                    onChange={(e) => setCariDuzenleForm({ ...cariDuzenleForm, telefon: e.target.value })}
                    placeholder="05xx xxx xx xx"
                    className="w-full border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-semibold text-gray-700 mb-1">Şehir / İl</label>
                  <input
                    type="text"
                    value={cariDuzenleForm.sehir}
                    onChange={(e) => setCariDuzenleForm({ ...cariDuzenleForm, sehir: e.target.value })}
                    placeholder="Ankara, İstanbul..."
                    className="w-full border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">Açık Adres</label>
                  <textarea
                    rows={2}
                    value={cariDuzenleForm.adres}
                    onChange={(e) => setCariDuzenleForm({ ...cariDuzenleForm, adres: e.target.value })}
                    placeholder="Mahalle, Cadde, No, İlçe..."
                    className="w-full border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              {/* Modal Butonları */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCariDuzenleModal(false);
                      ekstreAc(seciliCariDuzenle.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl font-semibold transition-colors"
                  >
                    <LuEye size={14} /> Hesap Ekstresi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCariSil(seciliCariDuzenle.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors"
                    title="Cariyi Sil (Hareket kaydı yoksa)"
                  >
                    <LuTrash2 size={14} /> Sil
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCariDuzenleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={cariGuncelleLoading}
                    className="px-5 py-2.5 bg-[#CC4E00] hover:bg-[#b04300] text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    {cariGuncelleLoading ? 'Kaydediliyor…' : '💾 Değişiklikleri Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: FATURA ÖNİZLEME & DÜZENLEME ─── */}
      {faturaOnizleModal && seciliFaturaOnizle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 my-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {seciliFaturaOnizle.tur === 'SATIS' ? '🧾 Satış Faturası Önizleme' : '📦 Alış Faturası Önizleme'}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    seciliFaturaOnizle.tur === 'SATIS' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {seciliFaturaOnizle.tur === 'SATIS' ? '600 Satış' : '153 Satınalma'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    seciliFaturaOnizle.durum === 'ONAYLANDI' ? 'bg-green-100 text-green-800' :
                    seciliFaturaOnizle.durum === 'IPTAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {seciliFaturaOnizle.durum}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  Fatura No: <strong className="text-[#BA4700]">{seciliFaturaOnizle.faturaNo}</strong> · Tarih: {new Date(seciliFaturaOnizle.tarih).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <button
                onClick={() => setFaturaOnizleModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none p-1"
              >
                &times;
              </button>
            </div>

            {/* GİB e-Arşiv Durumu Kutusu */}
            <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
              seciliFaturaOnizle.gibFaturaNo
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                    seciliFaturaOnizle.gibFaturaNo ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {seciliFaturaOnizle.gibFaturaNo ? 'GİB e-ARŞİV ONAYLI' : 'TASLAK / İLETİLMEDİ'}
                  </span>
                  {seciliFaturaOnizle.gibFaturaNo && (
                    <span className="font-mono font-bold text-sm text-emerald-800">
                      {seciliFaturaOnizle.gibFaturaNo}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 text-gray-600">
                  {seciliFaturaOnizle.gibFaturaNo ? (
                    <>
                      <strong>ETTN:</strong> <span className="font-mono">{seciliFaturaOnizle.ettn}</span>
                    </>
                  ) : (
                    'Bu fatura henüz Gelir İdaresi Başkanlığı / Logo İşNet sistemine resmi olarak iletilmedi.'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {seciliFaturaOnizle.gibFaturaNo ? (
                  <a
                    href={`/api/admin/muhasebe/faturalar/${seciliFaturaOnizle.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    <LuPrinter size={14} /> Resmi e-Arşiv / PDF Aç
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      gibeGonder(seciliFaturaOnizle.id);
                      setFaturaOnizleModal(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    <LuSend size={14} /> Logo İşNet ile GİB'e Gönder
                  </button>
                )}
              </div>
            </div>

            {/* Cari & Müşteri Bilgileri Kutusu */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-700 uppercase tracking-wide text-[11px]">
                  Cari Hesap (Alıcı / Satıcı)
                </span>
                {seciliFaturaOnizle.cari && (
                  <button
                    type="button"
                    onClick={() => {
                      setFaturaOnizleModal(false);
                      cariDuzenleAc(seciliFaturaOnizle.cari.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-blue-700 font-bold hover:underline"
                  >
                    <LuPencil size={12} /> Bu Müşteri/Tedarikçi Kartını Düzenle
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-800">
                <div>
                  <p className="text-sm font-bold text-gray-900">{seciliFaturaOnizle.cari?.unvan}</p>
                  <p className="text-gray-500 mt-0.5">
                    <strong>VKN/TCKN:</strong> {seciliFaturaOnizle.cari?.vergiTcNo || 'Belirtilmedi'}
                    {seciliFaturaOnizle.cari?.vergiDairesi && ` · ${seciliFaturaOnizle.cari.vergiDairesi}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">
                    <strong>İletişim:</strong> {seciliFaturaOnizle.cari?.telefon || '—'} · {seciliFaturaOnizle.cari?.eposta || '—'}
                  </p>
                  <p className="text-gray-600 mt-0.5">
                    <strong>Adres:</strong> {seciliFaturaOnizle.cari?.adres || '—'} {seciliFaturaOnizle.cari?.sehir ? `/${seciliFaturaOnizle.cari.sehir}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Fatura Kalemleri Tablosu */}
            <div>
              <h4 className="font-bold text-gray-800 uppercase tracking-wide text-[11px] mb-2">
                Fatura Kalemleri ({seciliFaturaOnizle.satirlar?.length || 0} Kalem)
              </h4>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100/80 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Mal / Hizmet Açıklaması</th>
                      <th className="py-2.5 px-3 text-center">Miktar</th>
                      <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                      <th className="py-2.5 px-3 text-center">KDV %</th>
                      <th className="py-2.5 px-3 text-right">KDV Tutarı</th>
                      <th className="py-2.5 px-3 text-right">Satır Toplamı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {seciliFaturaOnizle.satirlar?.map((satir: any, idx: number) => (
                      <tr key={satir.id || idx} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-gray-900">{satir.aciklama}</td>
                        <td className="py-2 px-3 text-center font-bold">{satir.miktar}</td>
                        <td className="py-2 px-3 text-right font-mono">₺{Number(satir.birimFiyat).toFixed(2)}</td>
                        <td className="py-2 px-3 text-center">%{satir.kdvOrani}</td>
                        <td className="py-2 px-3 text-right font-mono text-purple-700">₺{Number(satir.kdvTutari).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">₺{Number(satir.satirToplam).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tutar Özeti */}
            <div className="bg-gray-900 text-white p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-gray-400 text-xs block">KDV Hariç Matrah</span>
                <span className="font-mono font-bold text-sm">₺{seciliFaturaOnizle.matrah?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Toplam KDV</span>
                <span className="font-mono font-bold text-sm text-purple-300">₺{seciliFaturaOnizle.kdvTutari?.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-amber-400 text-xs font-bold block uppercase tracking-wider">Genel Toplam</span>
                <span className="font-mono font-extrabold text-xl text-emerald-400">₺{seciliFaturaOnizle.genelToplam?.toFixed(2)}</span>
              </div>
            </div>

            {/* Düzenleme Formu (Açıklama, Fatura No, Durum) */}
            <form onSubmit={handleFaturaGuncelle} className="space-y-3 text-xs pt-2 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fatura Numarası</label>
                  <input
                    type="text"
                    disabled={seciliFaturaOnizle.gibFaturaNo}
                    value={faturaDuzenleForm.faturaNo}
                    onChange={(e) => setFaturaDuzenleForm({ ...faturaDuzenleForm, faturaNo: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 font-mono disabled:bg-gray-100"
                  />
                  {seciliFaturaOnizle.gibFaturaNo && (
                    <span className="text-[10px] text-gray-400">GİB onaylı faturanın numarası değiştirilemez.</span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fatura Durumu</label>
                  <select
                    value={faturaDuzenleForm.durum}
                    onChange={(e) => setFaturaDuzenleForm({ ...faturaDuzenleForm, durum: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 bg-white"
                  >
                    <option value="ONAYLANDI">ONAYLANDI</option>
                    <option value="TASLAK">TASLAK</option>
                    <option value="IPTAL">İPTAL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Açıklama / Not</label>
                  <input
                    type="text"
                    value={faturaDuzenleForm.aciklama}
                    onChange={(e) => setFaturaDuzenleForm({ ...faturaDuzenleForm, aciklama: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2"
                  />
                </div>
              </div>

              {/* Alt Aksiyon Butonları */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/admin/muhasebe/faturalar/${seciliFaturaOnizle.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl font-semibold transition-colors"
                  >
                    <LuPrinter size={14} /> Resmi e-Arşiv Görünümü
                  </a>
                  {!seciliFaturaOnizle.gibFaturaNo && (
                    <button
                      type="button"
                      onClick={() => handleFaturaSil(seciliFaturaOnizle.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors"
                      title="Taslak Faturayı Sil (Cari kaydı geri alınır)"
                    >
                      <LuTrash2 size={14} /> Faturayı Sil
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFaturaOnizleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold"
                  >
                    Kapat
                  </button>
                  <button
                    type="submit"
                    disabled={faturaGuncelleLoading}
                    className="px-5 py-2.5 bg-[#CC4E00] hover:bg-[#b04300] text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    {faturaGuncelleLoading ? 'Kaydediliyor…' : '💾 Bilgileri Güncelle'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: HIZLI STOK & KRİTİK EŞİK DÜZENLE ─── */}
      {stokDuzenleModal && seciliUrunStok && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Stok & Kritik Eşik Düzenle</h3>
                <p className="text-xs text-gray-500 mt-0.5">{seciliUrunStok.name}</p>
              </div>
              <button
                onClick={() => setStokDuzenleModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleStokDuzenleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Mevcut Stok Adedi *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={stokDuzenleForm.quantity}
                    onChange={(e) => setStokDuzenleForm({ ...stokDuzenleForm, quantity: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-bold text-base text-gray-900"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setStokDuzenleForm({ ...stokDuzenleForm, quantity: String((parseInt(stokDuzenleForm.quantity, 10) || 0) + 10) })}
                      className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg whitespace-nowrap"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => setStokDuzenleForm({ ...stokDuzenleForm, quantity: String((parseInt(stokDuzenleForm.quantity, 10) || 0) + 50) })}
                      className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg whitespace-nowrap"
                    >
                      +50
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Kritik Stok Uyarı Eşiği (Adet) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stokDuzenleForm.minStockLevel}
                  onChange={(e) => setStokDuzenleForm({ ...stokDuzenleForm, minStockLevel: e.target.value })}
                  placeholder="Varsayılan: 5"
                  className="w-full border border-gray-300 rounded-xl p-2.5 font-bold text-amber-900"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Stok bu sayının altına düştüğünde sistem otomatik olarak "Kritik Stok" uyarısı verir.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Birim Alış / Maliyet Fiyatı (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={stokDuzenleForm.purchasePrice}
                  onChange={(e) => setStokDuzenleForm({ ...stokDuzenleForm, purchasePrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setStokDuzenleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={stokGuncelleLoading}
                  className="px-5 py-2.5 bg-[#CC4E00] hover:bg-[#b04300] text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {stokGuncelleLoading ? 'Kaydediliyor…' : '💾 Bilgileri Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
