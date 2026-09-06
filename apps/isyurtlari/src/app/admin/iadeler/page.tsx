'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuRotateCcw, LuInfo } from 'react-icons/lu';
import { IADE_DURUM_METNI } from '@/lib/iade';

/**
 * Yönetim: iade kuyruğu.
 *
 * Bekleyen talepler önce geliyor. Karar verilirken müşteriye gidecek not
 * ve iade tutarı aynı ekranda giriliyor: ayrı adımlara bölmek, iadenin
 * yarım kalmasının en kolay yolu.
 */

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
  order: { orderNumber: string; totalAmount: number; shippingAddress: string; notes: string | null };
  customer: { name: string; email: string; phone: string | null } | null;
  items: { quantity: number; orderItem: { price: number; product: { name: string } } }[];
}

const DURUMLAR = ['TALEP', 'ONAYLANDI', 'REDDEDILDI', 'URUN_ULASTI', 'TAMAMLANDI', 'IPTAL'];

const DURUM_RENGI: Record<string, string> = {
  TALEP: 'bg-yellow-100 text-yellow-800',
  ONAYLANDI: 'bg-blue-100 text-blue-800',
  REDDEDILDI: 'bg-red-100 text-red-700',
  URUN_ULASTI: 'bg-purple-100 text-purple-800',
  TAMAMLANDI: 'bg-green-100 text-green-800',
  IPTAL: 'bg-gray-100 text-gray-600',
};

export default function AdminIadeler() {
  const [iadeler, setIadeler] = useState<Iade[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [suzgec, setSuzgec] = useState('');
  const [taslak, setTaslak] = useState<Record<string, { adminNote: string; refundAmount: string }>>({});
  const [islemde, setIslemde] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const yanit = await fetch(`/api/admin/iadeler${suzgec ? `?durum=${suzgec}` : ''}`, {
        cache: 'no-store',
      });
      if (!yanit.ok) {
        setHata('İade talepleri getirilemedi');
        return;
      }
      const veri = await yanit.json();
      setIadeler(Array.isArray(veri.iadeler) ? veri.iadeler : []);
      setHata('');
    } catch {
      setHata('Bağlantı hatası');
    } finally {
      setYukleniyor(false);
    }
  }, [suzgec]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  const durumDegistir = async (iade: Iade, yeniDurum: string) => {
    setIslemde(iade.id);
    setHata('');

    const t = taslak[iade.id] ?? { adminNote: iade.adminNote ?? '', refundAmount: '' };

    try {
      const yanit = await fetch('/api/admin/iadeler', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnId: iade.id,
          status: yeniDurum,
          adminNote: t.adminNote,
          ...(t.refundAmount.trim() !== '' ? { refundAmount: Number(t.refundAmount) } : {}),
        }),
      });

      if (!yanit.ok) {
        const veri = await yanit.json().catch(() => ({}));
        setHata(veri.error || 'Güncellenemedi');
        return;
      }
      await yukle();
    } catch {
      setHata('Bağlantı hatası');
    } finally {
      setIslemde(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <LuRotateCcw size={20} className="text-[#BA4700]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">İade Talepleri</h1>
            <p className="text-sm text-gray-500">{yukleniyor ? '...' : `${iadeler.length} kayıt`}</p>
          </div>
        </div>

        <select value={suzgec} onChange={(e) => setSuzgec(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Tüm durumlar</option>
          {DURUMLAR.map((d) => (
            <option key={d} value={d}>{IADE_DURUM_METNI[d]}</option>
          ))}
        </select>
      </div>

      {hata && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
          <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
          <div>{hata}</div>
        </div>
      )}

      {yukleniyor ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6000]" />
        </div>
      ) : iadeler.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-600">
          Bu süzgeçle eşleşen iade talebi yok.
        </div>
      ) : (
        <div className="space-y-4">
          {iadeler.map((iade) => {
            const t = taslak[iade.id] ?? { adminNote: iade.adminNote ?? '', refundAmount: '' };
            const tahmini = iade.items.reduce((toplam, k) => toplam + k.orderItem.price * k.quantity, 0);

            return (
              <div key={iade.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div>
                    <h2 className="font-bold text-gray-900">
                      {iade.returnNumber}
                      <span className="text-gray-400 font-normal"> · Sipariş {iade.order.orderNumber}</span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(iade.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${DURUM_RENGI[iade.status] ?? 'bg-gray-100'}`}>
                    {IADE_DURUM_METNI[iade.status] ?? iade.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700 mb-2">Müşteri</p>
                    <p className="text-gray-900">{iade.customer?.name ?? 'Misafir'}</p>
                    <p className="text-gray-600">{iade.customer?.email}</p>
                    {iade.customer?.phone && <p className="text-gray-600">{iade.customer.phone}</p>}

                    <p className="font-semibold text-gray-700 mt-4 mb-2">Sebep</p>
                    <p className="text-gray-900">{iade.reason}</p>
                    {iade.note && <p className="text-gray-600 mt-1 leading-relaxed">{iade.note}</p>}
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700 mb-2">İade edilen kalemler</p>
                    <ul className="space-y-1">
                      {iade.items.map((k, i) => (
                        <li key={i} className="flex justify-between text-gray-900">
                          <span>{k.orderItem.product.name} ×{k.quantity}</span>
                          <span>₺{(k.orderItem.price * k.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-gray-500 mt-2 pt-2 border-t border-gray-100">
                      Kalem toplamı: <strong className="text-gray-900">₺{tahmini.toFixed(2)}</strong>
                      <span className="block text-xs mt-0.5">
                        Sipariş toplamı ₺{iade.order.totalAmount.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Karar alanı */}
                <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Müşteriye not
                      </label>
                      <input
                        value={t.adminNote}
                        onChange={(e) =>
                          setTaslak((o) => ({ ...o, [iade.id]: { ...t, adminNote: e.target.value } }))
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder="Karar gerekçesi — müşteri bu notu görecek"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        İade tutarı (₺)
                      </label>
                      <input
                        value={t.refundAmount}
                        onChange={(e) =>
                          setTaslak((o) => ({ ...o, [iade.id]: { ...t, refundAmount: e.target.value } }))
                        }
                        inputMode="decimal"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        placeholder={tahmini.toFixed(2)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {DURUMLAR.filter((d) => d !== iade.status).map((durum) => (
                      <button
                        key={durum}
                        onClick={() => durumDegistir(iade, durum)}
                        disabled={islemde === iade.id}
                        className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                      >
                        {IADE_DURUM_METNI[durum]}
                      </button>
                    ))}
                  </div>

                  {iade.refundedAt && (
                    <p className="text-xs text-green-700">
                      Para iadesi {new Date(iade.refundedAt).toLocaleString('tr-TR')} tarihinde
                      işaretlendi
                      {typeof iade.refundAmount === 'number' ? ` — ₺${iade.refundAmount.toFixed(2)}` : ''}.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
