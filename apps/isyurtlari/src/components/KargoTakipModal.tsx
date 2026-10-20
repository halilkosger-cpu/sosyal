'use client';

import { useState } from 'react';
import { LuPackage, LuX, LuSearch, LuCopy, LuCheck, LuExternalLink, LuTruck, LuClock } from 'react-icons/lu';
import { KARGO_FIRMALARI } from '@/lib/kargo';

interface SiparisSonuc {
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  kargoFirmasi?: string | null;
  kargoTakipNo?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      slug: string;
      imageUrl?: string | null;
    };
  }[];
}

const DURUM_BILGISI: Record<string, { baslik: string; renk: string; aciklama: string }> = {
  PENDING: {
    baslik: 'Ön Talep / Onay Bekliyor',
    renk: 'bg-amber-50 text-amber-800 border-amber-200',
    aciklama: 'Siparişiniz sistemimize ulaştı, banka / stok teyidi bekleniyor.',
  },
  CONFIRMED: {
    baslik: 'Hazırlanıyor',
    renk: 'bg-blue-50 text-blue-800 border-blue-200',
    aciklama: 'Siparişiniz atölye ve mağazadan temin edilerek paketleme aşamasına alındı.',
  },
  SHIPPED: {
    baslik: 'Kargoya Verildi',
    renk: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    aciklama: 'Paketiniz kargo şubesine teslim edildi ve yola çıktı.',
  },
  DELIVERED: {
    baslik: 'Teslim Edildi',
    renk: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    aciklama: 'Kargonuz alıcı adresine başarıyla teslim edildi.',
  },
  CANCELLED: {
    baslik: 'İptal Edildi',
    renk: 'bg-red-50 text-red-800 border-red-200',
    aciklama: 'Bu sipariş iptal edilmiştir.',
  },
};

export default function KargoTakipModal() {
  const [acik, setAcik] = useState(false);
  const [siparisNo, setSiparisNo] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState('');
  const [sonuc, setSonuc] = useState<SiparisSonuc | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siparisNo.trim() || !email.trim()) {
      setHata('Lütfen sipariş numarası ve e-posta adresinizi girin.');
      return;
    }

    setLoading(true);
    setHata('');
    setSonuc(null);

    try {
      const res = await fetch('/api/siparis-sorgula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siparisNo: siparisNo.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setHata(data.error || 'Sipariş bulunamadı. Lütfen bilgilerinizi kontrol edin.');
      } else {
        setSonuc(data.siparis);
      }
    } catch {
      setHata('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const kargoKoduKopyala = (kod: string) => {
    navigator.clipboard.writeText(kod);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  const kargoFirma = KARGO_FIRMALARI.find((f) => f.kod === sonuc?.kargoFirmasi);

  return (
    <>
      {/* Header Tetikleyici Butonu */}
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 hover:text-[#BA4700] hover:bg-orange-50/70 border border-gray-200 transition-colors"
        title="Sipariş ve Kargo Takibi"
      >
        <LuPackage size={15} className="text-[#CC4E00]" />
        <span>Kargom Nerede?</span>
      </button>

      {/* Modal Diyalog */}
      {acik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Başlık */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-100 text-[#BA4700]">
                  <LuPackage size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Kargom Nerede?</h3>
                  <p className="text-xs text-gray-500">Hızlı Sipariş ve Gönderi Sorgulama</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAcik(false);
                  setHata('');
                  setSonuc(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LuX size={20} />
              </button>
            </div>

            {/* Modal İçerik Formu */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-3.5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Sipariş Numarası *
                  </label>
                  <input
                    type="text"
                    value={siparisNo}
                    onChange={(e) => setSiparisNo(e.target.value)}
                    placeholder="Örn: ISY2026-0001 veya SG-2026-..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:outline-none focus:border-[#CC4E00] focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Siparişteki E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#CC4E00] focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#CC4E00] hover:bg-[#A63F00] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-orange-950/20"
                >
                  <LuSearch size={16} />
                  {loading ? 'Sorgulanıyor...' : 'Kargoyu Sorgula'}
                </button>
              </form>

              {hata && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {hata}
                </div>
              )}

              {/* Sonuç Kartı */}
              {sonuc && (
                <div className="rounded-xl border border-gray-200 bg-[#FAFAF9] p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <div>
                      <span className="text-xs font-mono font-bold text-gray-900">
                        #{sonuc.orderNumber}
                      </span>
                      <p className="text-[11px] text-gray-500">
                        {new Date(sonuc.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        DURUM_BILGISI[sonuc.status]?.renk || 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {DURUM_BILGISI[sonuc.status]?.baslik || sonuc.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {DURUM_BILGISI[sonuc.status]?.aciklama}
                  </p>

                  {/* Kargo Bilgisi Varsa */}
                  {sonuc.kargoTakipNo ? (
                    <div className="p-3 bg-white rounded-lg border border-indigo-100 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <LuTruck size={15} />
                          {kargoFirma?.ad || 'Kargo Firması'}
                        </span>
                        {kargoFirma?.takipSayfasi && (
                          <a
                            href={kargoFirma.takipSayfasi}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            Takip Sayfası <LuExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                        <span className="font-mono text-xs font-bold text-gray-800">
                          {sonuc.kargoTakipNo}
                        </span>
                        <button
                          type="button"
                          onClick={() => kargoKoduKopyala(sonuc.kargoTakipNo!)}
                          className="text-[11px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1"
                        >
                          {kopyalandi ? (
                            <>
                              <LuCheck size={13} className="text-emerald-600" /> Kopyalandı
                            </>
                          ) : (
                            <>
                              <LuCopy size={13} /> Kodu Kopyala
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-100 text-[11px] text-orange-900">
                      <LuClock size={15} className="shrink-0 text-orange-600" />
                      <span>Kargo takip numaranız koli şubeye teslim edildiğinde burada görünecektir.</span>
                    </div>
                  )}

                  {/* Sipariş Kalemleri */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Paket İçeriği ({sonuc.items.length} Kalem)
                    </p>
                    <ul className="divide-y divide-gray-100 text-xs">
                      {sonuc.items.map((it) => (
                        <li key={it.id} className="py-1.5 flex justify-between">
                          <span className="text-gray-800 font-medium truncate max-w-[280px]">
                            {it.product.name} <span className="text-gray-400">x{it.quantity}</span>
                          </span>
                          <span className="font-semibold text-gray-900">
                            ₺{(it.price * it.quantity).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
