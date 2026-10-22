'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LuShoppingCart,
  LuClock,
  LuCheck,
  LuMail,
  LuSearch,
  LuRefreshCw,
  LuTrendingUp,
  LuTriangleAlert,
  LuDollarSign,
  LuSend,
  LuMessageCircle,
  LuPackage,
  LuSparkles,
  LuCalendar,
} from 'react-icons/lu';

interface SepetKalemi {
  id: string;
  name: string;
  fiyat: number;
  adet: number;
  toplam: number;
  imageUrl?: string | null;
  slug: string;
  stok: number;
}

interface SepetVerisi {
  id: string;
  customerId: string | null;
  musteri: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    izinli: boolean;
    emailVerified: boolean;
  } | null;
  kalemler: SepetKalemi[];
  toplamTutar: number;
  kalemSayisi: number;
  durum: 'DONUSTU' | 'HATIRLATILDI' | 'TERK_EDILDI' | 'AKTIF';
  gecenSureDk: number;
  updatedAt: string;
  createdAt: string;
  hatirlatmaGonderildiAt?: string | null;
  sonrakiSiparis?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    createdAt: string;
  } | null;
}

interface OzetVerisi {
  toplamIncelenen: number;
  toplamTerk: number;
  potansiyelCiro: number;
  hatirlatilanAdet: number;
  kurtarilanAdet: number;
  kurtarilanCiro: number;
  donusumOrani: number;
}

type DurumFiltresi = 'TUMU' | 'TERK_EDILDI' | 'HATIRLATILDI' | 'DONUSTU' | 'AKTIF';

export default function AdminTerkEdilmisSepetlerPage() {
  const [sepetler, setSepetler] = useState<SepetVerisi[]>([]);
  const [ozet, setOzet] = useState<OzetVerisi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<DurumFiltresi>('TUMU');
  const [arama, setArama] = useState('');
  const [islemdekiId, setIslemdekiId] = useState<string | null>(null);
  const [bildirim, setBildirim] = useState<{ tur: 'basari' | 'hata'; mesaj: string } | null>(null);
  const [topluCalisiyor, setTopluCalisiyor] = useState(false);

  const veriYukle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/terk-edilmis-sepetler');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Sunucu hatası (${res.status})`);
      }
      const data = await res.json();
      setSepetler(data.sepetler || []);
      setOzet(data.ozet || null);
    } catch (err: any) {
      console.error('Terk edilmiş sepetler yükleme hatası:', err);
      setError(err?.message || 'Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    veriYukle();
  }, []);

  const tekilHatirlat = async (cartId: string, musteriAdi: string) => {
    if (!confirm(`${musteriAdi} isimli müşteriye sepet hatırlatma e-postası gönderilsin mi?`)) {
      return;
    }

    setIslemdekiId(cartId);
    setBildirim(null);
    try {
      const res = await fetch('/api/admin/terk-edilmis-sepetler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tekil_hatirlat', cartId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hatırlatma gönderilemedi');

      setBildirim({ tur: 'basari', mesaj: data.message || 'Hatırlatma e-postası başarıyla iletildi.' });
      veriYukle();
    } catch (err: any) {
      setBildirim({ tur: 'hata', mesaj: err?.message || 'E-posta gönderilirken hata oluştu.' });
    } finally {
      setIslemdekiId(null);
      setTimeout(() => setBildirim(null), 5000);
    }
  };

  const topluHatirlatCalistir = async () => {
    if (!confirm('Tüm uygun terk edilmiş sepetlere otomatik hatırlatma motoru çalıştırılsın mı?')) {
      return;
    }

    setTopluCalisiyor(true);
    setBildirim(null);
    try {
      const res = await fetch('/api/admin/terk-edilmis-sepetler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toplu_calistir' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız');

      const sonuc = data.sonuc;
      setBildirim({
        tur: 'basari',
        mesaj: `Toplu görev tamamlandı: ${sonuc?.gonderilen ?? 0} e-posta gönderildi, ${sonuc?.incelenen ?? 0} sepet incelendi.`,
      });
      veriYukle();
    } catch (err: any) {
      setBildirim({ tur: 'hata', mesaj: err?.message || 'Toplu görev çalıştırılamadı.' });
    } finally {
      setTopluCalisiyor(false);
      setTimeout(() => setBildirim(null), 6000);
    }
  };

  const filtrelenmisSepetler = useMemo(() => {
    return sepetler.filter((s) => {
      // Durum Filtresi
      if (filtre !== 'TUMU' && s.durum !== filtre) return false;

      // Arama Filtresi
      if (!arama) return true;
      const q = arama.toLowerCase();
      const ad = s.musteri?.name?.toLowerCase() || '';
      const email = s.musteri?.email?.toLowerCase() || '';
      const tel = s.musteri?.phone?.toLowerCase() || '';
      const urunler = s.kalemler.map((k) => k.name.toLowerCase()).join(' ');

      return ad.includes(q) || email.includes(q) || tel.includes(q) || urunler.includes(q);
    });
  }, [sepetler, filtre, arama]);

  const sureGoster = (dakika: number) => {
    if (dakika < 1) return 'Az önce';
    if (dakika < 60) return `${dakika} dk önce`;
    const saat = Math.floor(dakika / 60);
    if (saat < 24) return `${saat} saat önce`;
    const gun = Math.floor(saat / 24);
    return `${gun} gün önce`;
  };

  const formatFiyat = (tutar: number) => {
    return tutar.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₺';
  };

  return (
    <div className="space-y-6">
      {/* 1. ÜST BAŞLIK & BUTONLAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-orange-50 text-[#CC4E00] flex items-center justify-center font-bold">
              <LuShoppingCart size={22} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Terk Edilmiş Sepetler
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Sepetine ürün ekleyip ödemeyi tamamlamayan müşterileri takip edin ve satışa dönüştürün.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={veriYukle}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <LuRefreshCw className={loading ? 'animate-spin' : ''} size={15} />
            Yenile
          </button>

          <button
            onClick={topluHatirlatCalistir}
            disabled={topluCalisiyor || loading}
            className="px-4 py-2.5 rounded-xl bg-[#0F2040] hover:bg-[#1a3466] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <LuSparkles className={topluCalisiyor ? 'animate-spin' : ''} size={15} />
            {topluCalisiyor ? 'Çalışıyor...' : 'Otomatik Hatırlatıcıyı Çalıştır'}
          </button>
        </div>
      </div>

      {/* BİLDİRİM BANNER */}
      {bildirim && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
            bildirim.tur === 'basari'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{bildirim.tur === 'basari' ? '✓' : '⚠️'}</span>
            <span>{bildirim.mesaj}</span>
          </div>
          <button onClick={() => setBildirim(null)} className="text-xs underline">
            Kapat
          </button>
        </div>
      )}

      {/* HATA BANNER */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <LuTriangleAlert className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. DÖRT BÜYÜK İSTATİSTİK KARTI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kart 1: Terk Edilmiş Sepet */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Terk Edilen Sepet</span>
            <span className="w-8 h-8 rounded-xl bg-orange-50 text-[#CC4E00] flex items-center justify-center">
              <LuShoppingCart size={16} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            {ozet?.toplamTerk ?? 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Ödemesi henüz tamamlanmamış</p>
        </div>

        {/* Kart 2: Kurtarılabilir Ciro */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kurtarılabilir Ciro</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <LuDollarSign size={16} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#CC4E00] mt-2">
            {formatFiyat(ozet?.potansiyelCiro ?? 0)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Sepetlerde bekleyen potansiyel gelir</p>
        </div>

        {/* Kart 3: Hatırlatma Gönderilen */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hatırlatılan Sepet</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <LuMail size={16} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            {ozet?.hatirlatilanAdet ?? 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">E-posta ile ulaşılan müşteriler</p>
        </div>

        {/* Kart 4: Kurtarılan Ciro & Dönüşüm */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kurtarılan Sipariş</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LuTrendingUp size={16} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {formatFiyat(ozet?.kurtarilanCiro ?? 0)}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            {ozet?.kurtarilanAdet ?? 0} sipariş (%{ozet?.donusumOrani ?? 0} dönüşüm)
          </p>
        </div>
      </div>

      {/* 3. FİLTRELER VE ARAMA BARI */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Durum Sekmeleri */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'TUMU', label: 'Tümü' },
              { id: 'TERK_EDILDI', label: 'Bekleyenler' },
              { id: 'HATIRLATILDI', label: 'Hatırlatılanlar' },
              { id: 'DONUSTU', label: 'Siparişe Dönüşenler' },
              { id: 'AKTIF', label: 'Aktif Alışveriş' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltre(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filtre === tab.id
                  ? 'bg-[#CC4E00] text-white shadow-md'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Arama Kutusu */}
        <div className="relative w-full sm:w-72">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Müşteri, e-posta veya ürün ara..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#CC4E00]"
          />
        </div>
      </div>

      {/* 4. SEPET LİSTESİ */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            <LuRefreshCw className="animate-spin inline-block mr-2" />
            Terk edilmiş sepet verileri taranıyor...
          </div>
        ) : filtrelenmisSepetler.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <LuShoppingCart size={36} className="mx-auto text-gray-300" />
            <p className="font-bold text-gray-600 text-sm">Hiç sepet kaydı bulunamadı.</p>
            <p className="text-xs text-gray-400">
              {arama ? 'Arama kriterinize uygun sonuç bulunamadı.' : 'Henüz bu filtreye uygun bir terk edilmiş sepet yok.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtrelenmisSepetler.map((sepet) => {
              const musteri = sepet.musteri;
              const telefonNo = musteri?.phone?.replace(/\D/g, '') || '';
              const whatsappLink = telefonNo
                ? `https://wa.me/90${telefonNo.startsWith('0') ? telefonNo.substring(1) : telefonNo}?text=${encodeURIComponent(
                    `Merhaba Sayın ${musteri?.name || ''}, isyurtlari.com.tr sepetinizdeki ürünler için size yardımcı olmamızı ister misiniz?`
                  )}`
                : null;

              return (
                <div key={sepet.id} className="p-5 hover:bg-gray-50/60 transition-colors space-y-4">
                  {/* Satır Üst Başlığı: Müşteri, Durum ve Aksiyonlar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Müşteri Bilgisi */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0F2040] flex items-center justify-center font-extrabold flex-shrink-0 text-sm">
                        {musteri?.name ? musteri.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm">
                            {musteri?.name || 'Kayıtsız / Misafir Sepeti'}
                          </h3>
                          {/* Durum Rozeti */}
                          {sepet.durum === 'DONUSTU' && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <LuCheck size={11} /> Siparişe Dönüştü (#{sepet.sonrakiSiparis?.orderNumber})
                            </span>
                          )}
                          {sepet.durum === 'HATIRLATILDI' && (
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <LuMail size={11} /> Hatırlatma Gönderildi
                            </span>
                          )}
                          {sepet.durum === 'TERK_EDILDI' && (
                            <span className="bg-orange-50 text-[#CC4E00] border border-orange-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <LuClock size={11} /> Terk Edildi (Bekliyor)
                            </span>
                          )}
                          {sepet.durum === 'AKTIF' && (
                            <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <LuSparkles size={11} /> Aktif Alışveriş
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                          {musteri?.email && (
                            <span className="flex items-center gap-1">
                              <LuMail size={12} className="text-gray-400" /> {musteri.email}
                            </span>
                          )}
                          {musteri?.phone && (
                            <span className="flex items-center gap-1">
                              📞 {musteri.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-gray-400">
                            <LuCalendar size={12} /> {sureGoster(sepet.gecenSureDk)}
                          </span>

                          {/* İzin Rozeti */}
                          {musteri && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                musteri.izinli
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {musteri.izinli ? '✓ İleti İzni Var' : 'İleti İzni Yok'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fiyat ve Aksiyon Butonları */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[11px] text-gray-400 block">Sepet Tutarı</span>
                        <span className="text-lg font-black text-[#CC4E00]">
                          {formatFiyat(sepet.toplamTutar)}
                        </span>
                      </div>

                      {/* Aksiyon: E-posta Gönder */}
                      {sepet.durum !== 'DONUSTU' && musteri?.email && (
                        <button
                          onClick={() => tekilHatirlat(sepet.id, musteri.name)}
                          disabled={islemdekiId === sepet.id}
                          className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#CC4E00] border border-orange-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                          title="Müşteriye sepet hatırlatma e-postası gönder"
                        >
                          <LuSend size={13} className={islemdekiId === sepet.id ? 'animate-spin' : ''} />
                          {sepet.durum === 'HATIRLATILDI' ? 'Yeniden Hatırlat' : 'Hatırlat'}
                        </button>
                      )}

                      {/* Aksiyon: WhatsApp Mesajı */}
                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                          title="WhatsApp üzerinden sepetteki ürünler için iletişime geç"
                        >
                          <LuMessageCircle size={14} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Sepetteki Ürünler Grid / Şerit */}
                  <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100/80">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Sepetteki Ürünler ({sepet.kalemSayisi} Adet)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {sepet.kalemler.map((kalem) => (
                        <div
                          key={kalem.id}
                          className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-gray-100 text-xs shadow-2xs"
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {kalem.imageUrl ? (
                              <Image src={kalem.imageUrl} alt={kalem.name} fill sizes="40px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <LuPackage size={16} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/urun/${kalem.slug}`}
                              target="_blank"
                              className="font-bold text-gray-900 truncate block hover:text-[#CC4E00] transition-colors"
                              title={kalem.name}
                            >
                              {kalem.name}
                            </Link>
                            <p className="text-gray-500 text-[11px] mt-0.5">
                              {kalem.adet} adet × {formatFiyat(kalem.fiyat)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
