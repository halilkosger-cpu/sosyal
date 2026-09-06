'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { LuArrowLeft, LuRotateCcw, LuInfo, LuPackage } from 'react-icons/lu';
import { useMusteri } from '@/lib/musteri-istemci';
import { CAYMA_GUN, IADE_DURUM_METNI, IADE_SEBEPLERI, MUSTERI_IPTAL_EDEBILIR, iadeUygunlugu } from '@/lib/iade';

/**
 * İadelerim.
 *
 * Alt bilgide "14 gün içinde cayma hakkı" yazıyordu ama müşterinin
 * yapabileceği tek şey iletişim formundan yazmaktı; talebin izi
 * kalmıyordu. Bu sayfa hem talep açıyor hem açılmış talepleri gösteriyor.
 */

interface IadeKalemi {
  quantity: number;
  orderItem: { price: number; product: { name: string; slug: string; imageUrl: string | null } };
}

interface Iade {
  id: string;
  returnNumber: string;
  status: string;
  reason: string;
  note: string | null;
  adminNote: string | null;
  refundAmount: number | null;
  refundedAt: string | null;
  createdAt: string;
  order: { orderNumber: string };
  items: IadeKalemi[];
}

interface Siparis {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  deliveredAt?: string | null;
  items: { id: string; quantity: number; price: number; product: { name: string } }[];
}

const DURUM_RENGI: Record<string, string> = {
  TALEP: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  ONAYLANDI: 'bg-blue-50 text-blue-800 border-blue-200',
  REDDEDILDI: 'bg-red-50 text-red-700 border-red-200',
  URUN_ULASTI: 'bg-purple-50 text-purple-800 border-purple-200',
  TAMAMLANDI: 'bg-green-50 text-green-800 border-green-200',
  IPTAL: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function IadelerimSayfasi() {
  const { musteri, yukleniyor } = useMusteri();
  const [iadeler, setIadeler] = useState<Iade[]>([]);
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [listeYukleniyor, setListeYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [seciliSiparis, setSeciliSiparis] = useState('');
  const [sebep, setSebep] = useState<string>(IADE_SEBEPLERI[0]);
  const [not, setNot] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = useCallback(async () => {
    try {
      const [iadeYanit, siparisYanit] = await Promise.all([
        fetch('/api/musteri/iadeler', { cache: 'no-store' }),
        fetch('/api/musteri/siparisler', { cache: 'no-store' }),
      ]);

      if (iadeYanit.ok) {
        const veri = await iadeYanit.json();
        setIadeler(Array.isArray(veri.iadeler) ? veri.iadeler : []);
      }
      if (siparisYanit.ok) {
        const veri = await siparisYanit.json();
        setSiparisler(Array.isArray(veri.siparisler) ? veri.siparisler : []);
      }
    } catch {
      setHata('Bilgiler yüklenemedi. Bağlantınızı kontrol edin.');
    } finally {
      setListeYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    if (yukleniyor) return;
    if (!musteri) {
      setListeYukleniyor(false);
      return;
    }
    yukle();
  }, [musteri, yukleniyor, yukle]);

  /** Yalnızca cayma süresi içindeki teslim edilmiş siparişler. */
  const iadeEdilebilir = siparisler.filter((s) => iadeUygunlugu(s).uygun);

  const talepGonder = async (olay: React.FormEvent) => {
    olay.preventDefault();
    setHata('');
    setBasari('');

    if (!seciliSiparis) {
      setHata('İade etmek istediğiniz siparişi seçin.');
      return;
    }

    setGonderiliyor(true);
    try {
      const yanit = await fetch('/api/musteri/iadeler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: seciliSiparis, reason: sebep, note: not }),
      });
      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.error || 'İade talebi oluşturulamadı');
        return;
      }

      setBasari(veri.mesaj || 'İade talebiniz alındı.');
      setFormAcik(false);
      setSeciliSiparis('');
      setNot('');
      await yukle();
    } catch {
      setHata('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setGonderiliyor(false);
    }
  };

  const iptalEt = async (id: string) => {
    setHata('');
    const yanit = await fetch('/api/musteri/iadeler', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnId: id }),
    });
    if (!yanit.ok) {
      const veri = await yanit.json().catch(() => ({}));
      setHata(veri.error || 'Talep iptal edilemedi');
      return;
    }
    await yukle();
  };

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6000]" />
      </div>
    );
  }

  if (!musteri) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#BA4700] flex items-center justify-center mx-auto mb-5">
            <LuRotateCcw size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Giriş yapmanız gerekiyor</h1>
          <p className="text-sm text-gray-600 mb-6">
            İade taleplerinizi görmek ve yeni talep oluşturmak için hesabınıza girin.
          </p>
          <Link href="/giris?devam=/iadelerim"
            className="inline-block bg-[#CC4E00] hover:bg-[#A63F00] text-white px-6 py-3 rounded-lg font-semibold transition">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-md mx-auto px-4 py-6">
          <Link href="/hesabim" className="flex items-center gap-2 text-[#BA4700] hover:text-[#8F3700] font-medium mb-4 transition">
            <LuArrowLeft size={18} /> Hesabım
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <LuRotateCcw size={20} className="text-[#BA4700]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">İadelerim</h1>
              <p className="text-sm text-gray-600">
                Teslim tarihinden itibaren {CAYMA_GUN} gün içinde cayma hakkınız var.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto px-4 py-8 space-y-6">
        {hata && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
            <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
            <div>{hata}</div>
          </div>
        )}
        {basari && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl">
            {basari}
          </div>
        )}

        {/* ─── YENİ TALEP ─── */}
        {!listeYukleniyor && (
          formAcik ? (
            <form onSubmit={talepGonder} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Yeni İade Talebi</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="siparis" className="block text-sm font-medium text-gray-700 mb-2">Sipariş</label>
                  <select id="siparis" required value={seciliSiparis}
                    onChange={(e) => setSeciliSiparis(e.target.value)} className="store-input">
                    <option value="">Sipariş seçin</option>
                    {iadeEdilebilir.map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.orderNumber} — {new Date(s.createdAt).toLocaleDateString('tr-TR')} (
                        {iadeUygunlugu(s).kalanGun} gün kaldı)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sebep" className="block text-sm font-medium text-gray-700 mb-2">İade sebebi</label>
                  <select id="sebep" value={sebep} onChange={(e) => setSebep(e.target.value)} className="store-input">
                    {IADE_SEBEPLERI.map((se) => (
                      <option key={se} value={se}>{se}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="not" className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                  </label>
                  <textarea id="not" rows={3} value={not} onChange={(e) => setNot(e.target.value)}
                    className="store-input" placeholder="Durumu kısaca anlatın" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" disabled={gonderiliyor}
                  className="bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg font-semibold transition">
                  {gonderiliyor ? 'Gönderiliyor...' : 'Talebi Gönder'}
                </button>
                <button type="button" onClick={() => { setFormAcik(false); setHata(''); }}
                  className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">
                  Vazgeç
                </button>
              </div>
            </form>
          ) : iadeEdilebilir.length > 0 ? (
            <button onClick={() => { setFormAcik(true); setBasari(''); }}
              className="w-full bg-white border border-dashed border-gray-300 hover:border-[#CC4E00] rounded-2xl p-6 text-center transition">
              <span className="font-semibold text-[#BA4700]">+ Yeni iade talebi oluştur</span>
              <span className="block text-sm text-gray-500 mt-1">
                {iadeEdilebilir.length} siparişiniz cayma süresi içinde
              </span>
            </button>
          ) : (
            /* Talep açılabilecek sipariş yoksa, sebebini söylemek gerekiyor:
               boş bir düğme göstermek kullanıcıyı denemeye ve hata almaya iter. */
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-sm text-gray-600">
              Şu anda iade talebi oluşturabileceğiniz bir siparişiniz yok. İade, sipariş teslim
              edildikten sonra {CAYMA_GUN} gün içinde açılabilir. Ürün kusurluysa süre dolmuş olsa
              bile{' '}
              <Link href="/bize-ulasin" className="text-[#BA4700] hover:text-[#8F3700] font-medium underline">
                bizimle iletişime geçin
              </Link>.
            </div>
          )
        )}

        {/* ─── TALEPLER ─── */}
        {listeYukleniyor ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6000]" />
          </div>
        ) : iadeler.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-5">
              <LuPackage size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Henüz iade talebiniz yok</h2>
            <p className="text-sm text-gray-600">Açtığınız talepler burada listelenir.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {iadeler.map((iade) => (
              <div key={iade.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">İade #{iade.returnNumber}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Sipariş #{iade.order.orderNumber} ·{' '}
                      {new Date(iade.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${DURUM_RENGI[iade.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {IADE_DURUM_METNI[iade.status] ?? iade.status}
                  </span>
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-4">
                  {iade.items.map((k, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">{k.orderItem.product.name}</span>
                      <span className="text-gray-500">×{k.quantity}</span>
                    </div>
                  ))}
                </div>

                <dl className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                  <div className="flex gap-3">
                    <dt className="text-gray-500 w-28 flex-shrink-0">Sebep</dt>
                    <dd className="text-gray-900">{iade.reason}</dd>
                  </div>
                  {iade.note && (
                    <div className="flex gap-3">
                      <dt className="text-gray-500 w-28 flex-shrink-0">Açıklamanız</dt>
                      <dd className="text-gray-700">{iade.note}</dd>
                    </div>
                  )}
                  {iade.adminNote && (
                    <div className="flex gap-3">
                      <dt className="text-gray-500 w-28 flex-shrink-0">Yanıtımız</dt>
                      <dd className="text-gray-900">{iade.adminNote}</dd>
                    </div>
                  )}
                  {/* Tutar yalnızca para iadesi yapıldığında kesinleşmiş sayılıyor;
                      öncesinde gösterilen rakam müşteriye söz verilmiş gibi okunur. */}
                  {iade.refundedAt && typeof iade.refundAmount === 'number' && (
                    <div className="flex gap-3">
                      <dt className="text-gray-500 w-28 flex-shrink-0">İade edilen</dt>
                      <dd className="text-gray-900 font-semibold">₺{iade.refundAmount.toFixed(2)}</dd>
                    </div>
                  )}
                </dl>

                {MUSTERI_IPTAL_EDEBILIR.includes(iade.status) && (
                  <button onClick={() => iptalEt(iade.id)}
                    className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium transition">
                    Talebi iptal et
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
