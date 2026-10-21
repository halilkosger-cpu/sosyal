'use client';

import { useEffect, useState } from 'react';
import { LuClock, LuCheck, LuTruck, LuPackage, LuX } from 'react-icons/lu';
import { KARGO_FIRMALARI } from '@/lib/kargo';

interface OrderItem { quantity: number; price: number; product?: { name: string }; }
interface Order {
  id: string; orderNumber: string; status: string; totalAmount: number;
  paymentMethod: string; shippingAddress: string; createdAt: string;
  notes?: string | null;
  user?: { name: string; email: string } | null;
  customer?: { name: string; email: string; phone?: string | null } | null;
  items: OrderItem[];
  kargoFirmasi?: string | null;
  kargoTakipNo?: string | null;
  shippedAt?: string | null;
}

function nottanCikar(notes: string | null | undefined, anahtar: string): string {
  if (!notes) return '';
  const eslesme = notes.match(new RegExp(`${anahtar}:\\s*([^|\\n]+)`, 'i'));
  return eslesme ? eslesme[1].trim() : '';
}

function kacisHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function siparisMusteriBilgisi(order: Order) {
  const notAd = nottanCikar(order.notes, 'Müşteri');
  const notEposta = nottanCikar(order.notes, 'Email') || nottanCikar(order.notes, 'E-posta');
  const notTelefon = nottanCikar(order.notes, 'Telefon') || nottanCikar(order.notes, 'Tel');

  // Adres ilk satırında "Ad Soyad (05xxxxxxxxx)" varsa
  const satirlar = (order.shippingAddress || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const ilkSatir = satirlar[0] || '';
  const adresEslesme = ilkSatir.match(/^(.*?)\s*\((.+?)\)\s*$/);
  const adresAd = adresEslesme ? adresEslesme[1].trim() : '';
  const adresTelefon = adresEslesme ? adresEslesme[2].trim() : '';

  const ad =
    order.customer?.name ||
    notAd ||
    order.user?.name ||
    adresAd ||
    'Müşteri';

  const telefon =
    order.customer?.phone ||
    notTelefon ||
    adresTelefon ||
    '';

  const eposta =
    order.customer?.email ||
    notEposta ||
    order.user?.email ||
    '';

  const temizAdres =
    adresEslesme && satirlar.length > 1
      ? satirlar.slice(1).join('\n')
      : (order.shippingAddress || '-');

  return { ad, telefon, eposta, temizAdres };
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
            const musteri = siparisMusteriBilgisi(order);

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
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                      <strong className="text-gray-900 font-semibold">{musteri.ad}</strong>
                      {musteri.telefon && <span className="text-gray-700">· 📞 {musteri.telefon}</span>}
                      {musteri.eposta && <span className="text-gray-400">· ✉️ {musteri.eposta}</span>}
                    </p>
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

                    {/* Address & Customer details */}
                    <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Teslimat ve Alıcı Bilgileri</p>
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                        <span>{musteri.ad}</span>
                        {musteri.telefon && <span className="text-xs font-semibold text-gray-700">📞 {musteri.telefon}</span>}
                        {musteri.eposta && <span className="text-xs font-normal text-gray-500">✉️ {musteri.eposta}</span>}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2 pt-2 border-t border-gray-200/60 leading-relaxed">
                        {order.shippingAddress}
                      </p>
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
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <meta charset="UTF-8">
                                    <title>Koli Sevk Fişi - #${kacisHtml(order.orderNumber)}</title>
                                    <style>
                                      @page { size: auto; margin: 8mm; }
                                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 16px; color: #111; margin: 0; background: #fff; }
                                      .box { border: 2px solid #000; padding: 18px; max-width: 520px; margin: 0 auto; border-radius: 8px; box-sizing: border-box; }
                                      .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
                                      .title { font-size: 17px; font-weight: 800; color: #000; letter-spacing: -0.2px; }
                                      .meta { font-size: 12px; color: #555; }
                                      .section { margin-bottom: 12px; }
                                      .label { font-size: 10px; text-transform: uppercase; font-weight: 800; color: #555; letter-spacing: 0.5px; margin-bottom: 2px; }
                                      .val { font-size: 14px; font-weight: 700; color: #000; }
                                      .buyer-box { background: #fcfcfc; border: 1.5px solid #111; border-radius: 6px; padding: 10px 12px; margin-top: 3px; }
                                      .items { font-size: 12px; width: 100%; border-collapse: collapse; margin-top: 6px; }
                                      .items td, .items th { border: 1px solid #ccc; padding: 5px 8px; }
                                      .items th { background: #f2f2f2; text-align: left; font-size: 11px; text-transform: uppercase; }
                                      .barcode { font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 12px 0; border: 1.5px dashed #444; padding: 6px; background: #fafafa; }
                                      @media print {
                                        body { padding: 0; }
                                        .box { border: 2px solid #000; }
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="box">
                                      <div class="header">
                                        <div>
                                          <div class="title">İŞ-YRT GIDA LTD. ŞTİ.</div>
                                          <div class="meta">isyurtlari.com.tr · Sipariş Sevk ve Teslimat Fişi</div>
                                        </div>
                                        <div style="text-align: right;">
                                          <div style="font-weight: 800; font-size: 16px;">#${kacisHtml(order.orderNumber)}</div>
                                          <div class="meta">${new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                      </div>
                                      
                                      <div class="section" style="border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 10px;">
                                        <div class="label">GÖNDERİCİ BİLGİLERİ</div>
                                        <div class="val" style="font-size: 13px;">İŞ-YRT Gıda Ltd. Şti.</div>
                                        <div style="font-size: 11px; color: #555;">Online Dağıtım & Sevkiyat Merkezi · isyurtlari.com.tr</div>
                                      </div>

                                      <div class="section">
                                        <div class="label" style="color: #000; font-size: 11px;">ALICI (MÜŞTERİ) BİLGİLERİ</div>
                                        <div class="buyer-box">
                                          <div style="font-size: 16px; font-weight: 800; color: #000; margin-bottom: 4px;">
                                            ${kacisHtml(musteri.ad)}
                                          </div>
                                          <div style="font-size: 13px; font-weight: 700; color: #111; margin-bottom: 6px;">
                                            📞 Tel: ${kacisHtml(musteri.telefon || 'Belirtilmedi')}
                                            ${musteri.eposta ? `<span style="font-weight: normal; color: #555; margin-left: 8px;">✉️ ${kacisHtml(musteri.eposta)}</span>` : ''}
                                          </div>
                                          <div style="font-size: 11px; font-weight: bold; color: #555; margin-top: 6px; text-transform: uppercase;">Teslimat Adresi:</div>
                                          <div style="font-size: 13px; line-height: 1.45; white-space: pre-wrap; margin-top: 2px;">${kacisHtml(musteri.temizAdres)}</div>
                                        </div>
                                      </div>

                                      <div class="barcode">
                                        *${kacisHtml(order.orderNumber)}*
                                      </div>

                                      <div class="section">
                                        <div class="label">KARGO VE ÖDEME BİLGİSİ</div>
                                        <div class="val" style="font-size: 13px;">
                                          ${kacisHtml(firmaAd)} ${kargoAlanlari(order).takipNo ? `· Takip No: ${kacisHtml(kargoAlanlari(order).takipNo)}` : '· (Karşı Ödemeli / Anlaşmalı)'}
                                        </div>
                                        <div style="font-size: 11px; color: #555; margin-top: 2px;">
                                          Ödeme: ${order.paymentMethod === 'TRANSFER' ? 'Banka Havalesi / EFT' : 'Kredi Kartı'} · Sipariş Tutarı: ₺${order.totalAmount.toFixed(2)}
                                        </div>
                                      </div>

                                      <div class="section">
                                        <div class="label">PAKET İÇERİĞİ (${order.items.length} Kalem)</div>
                                        <table class="items">
                                          <thead>
                                            <tr><th>Ürün</th><th style="width: 50px; text-align: center;">Adet</th></tr>
                                          </thead>
                                          <tbody>
                                            ${order.items.map(it => `<tr><td>${kacisHtml(it.product?.name || 'Ürün')}</td><td align="center"><strong>${it.quantity}</strong></td></tr>`).join('')}
                                          </tbody>
                                        </table>
                                      </div>
                                      
                                      <div style="font-size: 10px; text-align: center; color: #777; margin-top: 12px; border-top: 1px dotted #ccc; padding-top: 6px;">
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
