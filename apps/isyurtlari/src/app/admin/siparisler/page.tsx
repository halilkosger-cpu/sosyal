'use client';

import { useEffect, useState } from 'react';
import { LuClock, LuCheck, LuTruck, LuPackage, LuX } from 'react-icons/lu';
import { KARGO_FIRMALARI } from '@/lib/kargo';

interface OrderItem { quantity: number; price: number; product?: { name: string }; }
interface Order {
  id: string; orderNumber: string; status: string; totalAmount: number;
  paymentMethod: string; shippingAddress: string; createdAt: string;
  user?: { name: string; email: string } | null;
  items: OrderItem[];
  kargoFirmasi?: string | null;
  kargoTakipNo?: string | null;
  shippedAt?: string | null;
}

const statusConfig: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  PENDING:   { label: 'Bekliyor',   color: 'bg-yellow-50 text-yellow-700 border-yellow-200', Icon: LuClock   },
  CONFIRMED: { label: 'Onaylandı',  color: 'bg-blue-50 text-blue-700 border-blue-200',       Icon: LuCheck   },
  SHIPPED:   { label: 'Gönderildi', color: 'bg-purple-50 text-purple-700 border-purple-200', Icon: LuTruck   },
  DELIVERED: { label: 'Teslim',     color: 'bg-green-50 text-green-700 border-green-200',    Icon: LuPackage },
  CANCELLED: { label: 'İptal',      color: 'bg-red-50 text-red-700 border-red-200',          Icon: LuX       },
};

const statusFlow = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    fetch('/api/admin/orders').then((r) => r.json()).then((d) => {
      setOrders(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  /**
   * Kargo bilgisi taslagi.
   *
   * Siparis basina firma + takip numarasi; kaydedilene kadar burada
   * tutuluyor ki her tusta istek gitmesin.
   */
  const [kargoTaslak, setKargoTaslak] = useState<Record<string, { firma: string; takipNo: string }>>({});

  const kargoAlanlari = (order: Order) =>
    kargoTaslak[order.id] ?? {
      firma: order.kargoFirmasi ?? '',
      takipNo: order.kargoTakipNo ?? '',
    };

  const siparisGuncelle = async (id: string, govde: Record<string, unknown>) => {
    setUpdating(id);
    const yanit = await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(govde),
    });
    if (!yanit.ok) {
      const veri = await yanit.json().catch(() => ({}));
      alert(veri.error || 'Sipariş güncellenemedi');
    }
    load();
    setUpdating(null);
  };

  const updateStatus = (id: string, status: string) => siparisGuncelle(id, { status });

  /**
   * Kargo bilgisi kaydedilirken siparis SHIPPED degilse otomatik olarak
   * oraya cekiliyor: takip numarasi girildiyse gonderi zaten yola cikmis
   * demektir, iki ayri tusa basmayi beklemek gereksiz.
   */
  const kargoKaydet = (order: Order) => {
    const { firma, takipNo } = kargoAlanlari(order);
    const durumIlerlesin =
      takipNo.trim() !== '' && order.status !== 'SHIPPED' && order.status !== 'DELIVERED'
        ? { status: 'SHIPPED' }
        : {};
    return siparisGuncelle(order.id, {
      kargoFirmasi: firma || null,
      kargoTakipNo: takipNo.trim() || null,
      ...durumIlerlesin,
    });
  };

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Siparişler</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} sipariş</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['ALL', 'Tümü'], ...Object.entries(statusConfig).map(([k, v]) => [k, v.label])].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              filter === key
                ? 'bg-[#0F2040] text-white border-[#0F2040]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {label}
            {key !== 'ALL' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({orders.filter((o) => o.status === key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 text-sm">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 text-sm">Sipariş bulunamadı</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const cfg = statusConfig[order.status];
            const Icon = cfg?.Icon ?? LuClock;
            const isExp = expanded === order.id;
            const currentIdx = statusFlow.indexOf(order.status);

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExp ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">#{order.orderNumber}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg?.color}`}>
                        <Icon size={11} /> {cfg?.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {order.paymentMethod === 'TRANSFER' ? '🏦 Havale' : '💳 Kredi Kartı'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{order.user?.name || 'Misafir'} · {order.user?.email || 'Bilinmiyor'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[#BA4700]">₺{order.totalAmount.toFixed(2)}</p>
                    {(() => {
                      const cost = order.items.reduce((s: number, it: any) => {
                        const unitCost = it.purchasePrice > 0 ? it.purchasePrice : (it.product?.purchasePrice || 0);
                        return s + unitCost * it.quantity;
                      }, 0);
                      const profit = order.totalAmount - cost;
                      return cost > 0 ? (
                        <p className={`text-[11px] font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          Kâr: ₺{profit.toFixed(2)}
                        </p>
                      ) : null;
                    })()}
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExp && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                    {/* Items */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ürünler</p>
                      <div className="space-y-1">
                        {order.items.map((item: any, i) => {
                          const unitCost = item.purchasePrice > 0 ? item.purchasePrice : (item.product?.purchasePrice || 0);
                          const lineProfit = (item.price - unitCost) * item.quantity;
                          return (
                            <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                              <div>
                                <span className="text-gray-700 font-medium">{item.product?.name || 'Bilinmeyen Ürün'} <span className="text-gray-400">x{item.quantity}</span></span>
                                {unitCost > 0 && (
                                  <span className="block text-[11px] text-gray-400">
                                    Birim Alış: ₺{unitCost.toFixed(2)} • Brüt Kâr: <strong className={lineProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}>₺{lineProfit.toFixed(2)}</strong>
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-gray-900">₺{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Teslimat Adresi</p>
                      <p className="text-sm text-gray-700">{order.shippingAddress}</p>
                    </div>

                    {/* Kargo & Sevk İrsaliyesi */}
                    {order.status !== 'CANCELLED' && (
                      <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                            Kargo ve Sevk İşlemleri
                          </p>
                          <button
                            onClick={() => {
                              const printWindow = window.open('', '_blank');
                              if (!printWindow) return;
                              const firmaAd = KARGO_FIRMALARI.find(f => f.kod === kargoAlanlari(order).firma)?.ad || 'Standart Kargo';
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Koli Sevk Fişi - #${order.orderNumber}</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
                                      .box { border: 2px solid #000; padding: 20px; max-width: 500px; margin: 0 auto; border-radius: 8px; }
                                      .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
                                      .title { font-size: 18px; font-weight: bold; }
                                      .meta { font-size: 12px; }
                                      .section { margin-bottom: 14px; }
                                      .label { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #555; }
                                      .val { font-size: 14px; font-weight: bold; margin-top: 2px; }
                                      .items { font-size: 12px; width: 100%; border-collapse: collapse; margin-top: 8px; }
                                      .items td, .items th { border: 1px solid #ddd; padding: 6px; }
                                      .barcode { font-family: monospace; font-size: 24px; letter-spacing: 4px; text-align: center; margin: 16px 0; border: 1px dashed #999; padding: 10px; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="box">
                                      <div class="header">
                                        <div>
                                          <div class="title">İŞYURTLARI KURUMU</div>
                                          <div class="meta">Online Satış Mağazası - isyurtlari.com.tr</div>
                                        </div>
                                        <div style="text-align: right;">
                                          <div style="font-weight: bold; font-size: 16px;">#${order.orderNumber}</div>
                                          <div class="meta">${new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                      </div>
                                      
                                      <div class="section">
                                        <div class="label">ALICI (MÜŞTERİ) BİLGİLERİ</div>
                                        <div class="val">${order.user?.name || 'Müşteri'}</div>
                                        <div style="font-size: 13px; margin-top: 4px; line-height: 1.4;">${order.shippingAddress}</div>
                                        <div style="font-size: 13px; font-weight: bold; margin-top: 4px;">Tel: ${order.user?.email || ''}</div>
                                      </div>

                                      <div class="barcode">
                                        *${order.orderNumber}*
                                      </div>

                                      <div class="section">
                                        <div class="label">KARGO BİLGİSİ</div>
                                        <div class="val">${firmaAd} ${kargoAlanlari(order).takipNo ? `· Takip No: ${kargoAlanlari(order).takipNo}` : '· (Karşı Ödemeli / Anlaşmalı)'}</div>
                                      </div>

                                      <div class="section">
                                        <div class="label">PAKET İÇERİĞİ (${order.items.length} Kalem)</div>
                                        <table class="items">
                                          <tr><th>Ürün</th><th>Adet</th></tr>
                                          ${order.items.map(it => `<tr><td>${it.product?.name || 'Ürün'}</td><td align="center">${it.quantity}</td></tr>`).join('')}
                                        </table>
                                      </div>
                                      
                                      <div style="font-size: 10px; text-align: center; color: #777; margin-top: 14px;">
                                        Bu belge koli üzeri teslimat ve sevk etiketi olarak düzenlenmiştir.
                                      </div>
                                    </div>
                                    <script>window.print();</script>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors border border-blue-200"
                            title="Koli üzeri teslimat ve sevk etiketini yazdır"
                          >
                            📦 Koli Etiketi Yazdır
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={kargoAlanlari(order).firma}
                            onChange={(e) =>
                              setKargoTaslak((o) => ({
                                ...o,
                                [order.id]: { ...kargoAlanlari(order), firma: e.target.value },
                              }))
                            }
                            className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white font-medium"
                          >
                            <option value="">Kargo firması seçin</option>
                            {KARGO_FIRMALARI.map((f) => (
                              <option key={f.kod} value={f.kod}>{f.ad}</option>
                            ))}
                          </select>
                          <input
                            value={kargoAlanlari(order).takipNo}
                            onChange={(e) =>
                              setKargoTaslak((o) => ({
                                ...o,
                                [order.id]: { ...kargoAlanlari(order), takipNo: e.target.value },
                              }))
                            }
                            placeholder="Kargo Takip No (Örn: 123456789)"
                            className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono w-56 font-bold"
                          />
                          <button
                            onClick={() => kargoKaydet(order)}
                            disabled={updating === order.id}
                            className="bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                          >
                            Takip Kodunu Kaydet
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-2">
                          Takip numarası girildiğinde sipariş otomatik "Gönderildi" durumuna geçer ve müşterinin sipariş takip ekranına düşer.
                        </p>
                      </div>
                    )}

                    {/* Status update */}
                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Durumu Güncelle</p>
                        <div className="flex gap-2 flex-wrap">
                          {statusFlow.slice(currentIdx + 1).map((s) => (
                            <button key={s}
                              onClick={() => updateStatus(order.id, s)}
                              disabled={updating === order.id}
                              className="bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                            >
                              {statusConfig[s]?.label} olarak işaretle
                            </button>
                          ))}
                          <button
                            onClick={() => updateStatus(order.id, 'CANCELLED')}
                            disabled={updating === order.id}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-4 py-2 rounded-lg border border-red-200 transition-colors"
                          >
                            İptal Et
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
