'use client';

import { useEffect, useState } from 'react';
import { LuClock, LuBell, LuCheck, LuX, LuPackage } from 'react-icons/lu';
import ExcelIndirDugmesi from '@/components/ExcelIndirDugmesi';

interface PreOrder {
  id: string;
  quantity: number;
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  status: string;
  notifiedAt: string | null;
  createdAt: string;
  product: { id: string; name: string; slug: string; quantity: number } | null;
}

interface Summary {
  productId: string;
  productName: string;
  productSlug: string | null;
  currentStock: number;
  waitingCount: number;
  totalQuantity: number;
}

const statusConfig: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  WAITING:   { label: 'Bekliyor',    color: 'bg-yellow-50 text-yellow-700 border-yellow-200', Icon: LuClock   },
  NOTIFIED:  { label: 'Haber verildi', color: 'bg-blue-50 text-blue-700 border-blue-200',     Icon: LuBell    },
  CONVERTED: { label: 'Siparişe döndü', color: 'bg-green-50 text-green-700 border-green-200', Icon: LuCheck   },
  CANCELLED: { label: 'İptal',       color: 'bg-red-50 text-red-700 border-red-200',          Icon: LuX       },
};

import { ATOLYE_ASAMALARI, parseStageFromNote } from '@/lib/on-talep-asama';

export default function AdminPreOrdersPage() {
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [summary, setSummary]     = useState<Summary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('ALL');
  const [notifying, setNotifying] = useState<string | null>(null);
  const [message, setMessage]     = useState<string | null>(null);

  const load = () => {
    fetch('/api/admin/preorders', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setPreOrders(Array.isArray(d.preOrders) ? d.preOrders : []);
        setSummary(Array.isArray(d.summary) ? d.summary : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const notify = async (productId: string, productName: string, count: number) => {
    const ok = window.confirm(
      `${productName} ürününü bekleyen ${count} müşteriye "stokta" e-postası gönderilecek.\n\nOnaylıyor musunuz?`
    );
    if (!ok) return;

    setNotifying(productId);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/preorders/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();

      setMessage(
        res.ok
          ? `✅ ${data.sent} bildirim gönderildi${data.failed ? `, ${data.failed} tanesi başarısız` : ''}.`
          : `⚠️ ${data.error || 'Bildirim gönderilemedi'}`
      );
      load();
    } catch {
      setMessage('⚠️ Bağlantı hatası, bildirim gönderilemedi.');
    } finally {
      setNotifying(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/preorders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const updateStage = async (id: string, stage: number) => {
    await fetch('/api/admin/preorders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage }),
    });
    load();
  };

  const sendStageNotification = async (preOrderId: string, stage: number, name: string) => {
    const ok = window.confirm(
      `${name} müşterisine Aşama ${stage + 1} ("${ATOLYE_ASAMALARI[stage]?.baslik}") bilgilendirme e-postası gönderilsin mi?`
    );
    if (!ok) return;

    try {
      const res = await fetch('/api/admin/preorders/stage-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preOrderId, stage }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${name} müşterisine aşama bildirimi başarıyla gönderildi.`);
      } else {
        setMessage(`⚠️ ${data.error || 'Aşama bildirimi gönderilemedi'}`);
      }
    } catch {
      setMessage('⚠️ Bağlantı hatası, bildirim gönderilemedi.');
    }
  };

  const filtered = filter === 'ALL' ? preOrders : preOrders.filter((p) => p.status === filter);
  const readyToNotify = summary.filter((s) => s.currentStock > 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ön Talepler</h1>
          <p className="text-gray-500 text-sm mt-1">
            {preOrders.length} ön talep · {summary.reduce((a, s) => a + s.waitingCount, 0)} tanesi stok bekliyor
          </p>
        </div>
        <ExcelIndirDugmesi tur="on-talepler" />
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800">
          {message}
        </div>
      )}

      {/* ─── STOĞA GİRENLER: BİLDİRİM GÖNDER ─── */}
      {readyToNotify.length > 0 && (
        <div className="mb-8 rounded-2xl border-2 border-green-500 bg-green-50 p-5">
          <h2 className="font-bold text-green-900 flex items-center gap-2 mb-1">
            <LuPackage size={18} strokeWidth={2} /> Bildirim gönderilmeyi bekleyen ürünler
          </h2>
          <p className="text-sm text-green-800 mb-4">
            Bu ürünler stoğa girdi ve bekleyen müşterileri var. Bildirimi siz onayladığınızda gönderilir.
          </p>

          <div className="space-y-3">
            {readyToNotify.map((s) => (
              <div key={s.productId} className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-green-200">
                <div>
                  <p className="font-bold text-gray-900">{s.productName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Stok: <strong className="text-green-600">{s.currentStock}</strong> ·
                    {' '}{s.waitingCount} kişi bekliyor · toplam {s.totalQuantity} adet talep
                  </p>
                </div>
                <button
                  onClick={() => notify(s.productId, s.productName, s.waitingCount)}
                  disabled={notifying === s.productId}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                >
                  <LuBell size={16} strokeWidth={2} />
                  {notifying === s.productId ? 'Gönderiliyor…' : 'Bildirim Gönder'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── STOK BEKLEYEN ÜRÜNLER ÖZETİ ─── */}
      {summary.filter((s) => s.currentStock === 0).length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-gray-900 mb-3">Stok bekleyen ürünler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.filter((s) => s.currentStock === 0).map((s) => (
              <div key={s.productId} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="font-bold text-gray-900 text-sm">{s.productName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <strong className="text-[#BA4700]">{s.waitingCount}</strong> kişi ·
                  toplam <strong>{s.totalQuantity}</strong> adet bekliyor
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── FİLTRE ─── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['ALL', 'WAITING', 'NOTIFIED', 'CONVERTED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filter === s
                ? 'bg-[#CC4E00] text-white border-[#FF6000]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'Tümü' : statusConfig[s].label}
          </button>
        ))}
      </div>

      {/* ─── LİSTE ─── */}
      {loading ? (
        <p className="text-gray-500 text-sm">Yükleniyor…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500">Bu filtrede ön talep yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const cfg = statusConfig[p.status] ?? statusConfig.WAITING;
            const currentStage = parseStageFromNote(p.note);
            const activeStageConfig = ATOLYE_ASAMALARI[currentStage] || ATOLYE_ASAMALARI[0];
            const cleanNote = p.note ? p.note.replace(/\[AŞAMA:\s*\d\]/g, '').trim() : null;

            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{p.product?.name ?? 'Silinmiş ürün'}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        <cfg.Icon size={12} strokeWidth={2} /> {cfg.label}
                      </span>
                      <span className="text-xs font-bold text-[#BA4700] bg-orange-50 px-2 py-0.5 rounded-full">
                        {p.quantity} adet
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mt-2">
                      <strong>{p.name}</strong> ·{' '}
                      <a href={`mailto:${p.email}`} className="text-[#BA4700] hover:underline">{p.email}</a>
                      {p.phone && (
                        <> · <a href={`tel:${p.phone}`} className="text-[#BA4700] hover:underline">{p.phone}</a></>
                      )}
                    </p>

                    {cleanNote && (
                      <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-3 py-2">
                        {cleanNote}
                      </p>
                    )}

                    {/* ─── ATÖLYE ÜRETİM AŞAMASI YÖNETİMİ ─── */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`stage-${p.id}`} className="text-xs font-bold text-gray-700">
                          Üretim Aşaması:
                        </label>
                        <select
                          id={`stage-${p.id}`}
                          aria-label="Üretim Aşaması"
                          value={currentStage}
                          onChange={(e) => updateStage(p.id, Number(e.target.value))}
                          className="text-xs font-semibold rounded-lg border border-gray-300 px-2.5 py-1.5 bg-white text-gray-800 focus:outline-none focus:border-[#CC4E00]"
                        >
                          {ATOLYE_ASAMALARI.map((st) => (
                            <option key={st.id} value={st.id}>
                              Aşama {st.id + 1}: {st.baslik}
                            </option>
                          ))}
                        </select>
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${activeStageConfig.renk}`}>
                        Aşama {currentStage + 1}: {activeStageConfig.baslik}
                      </span>

                      <button
                        type="button"
                        onClick={() => sendStageNotification(p.id, currentStage, p.name)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-orange-200 bg-orange-50/80 text-[#BA4700] hover:bg-orange-100 transition-colors"
                        title="Müşteriye Aşama Bilgilendirme E-postası Gönder"
                      >
                        <LuBell size={13} />
                        <span>Aşama Bildirimi Gönder</span>
                      </button>
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(p.createdAt).toLocaleString('tr-TR')}
                      {p.notifiedAt && ` · Haber verildi: ${new Date(p.notifiedAt).toLocaleString('tr-TR')}`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {p.status !== 'CONVERTED' && (
                      <button
                        onClick={() => updateStatus(p.id, 'CONVERTED')}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
                      >
                        Siparişe döndü
                      </button>
                    )}
                    {p.status !== 'CANCELLED' && (
                      <button
                        onClick={() => updateStatus(p.id, 'CANCELLED')}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        İptal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
