'use client';

import { useEffect, useState } from 'react';
import { LuClock, LuCheck, LuTruck, LuPackage, LuX } from 'react-icons/lu';

interface OrderItem { quantity: number; price: number; product?: { name: string }; }
interface Order {
  id: string; orderNumber: string; status: string; totalAmount: number;
  paymentMethod: string; shippingAddress: string; createdAt: string;
  user?: { name: string; email: string } | null;
  items: OrderItem[];
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

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
    setUpdating(null);
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
                    <p className="font-bold text-[#FF6000]">₺{order.totalAmount.toFixed(2)}</p>
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
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.product?.name || 'Bilinmeyen Ürün'} <span className="text-gray-400">x{item.quantity}</span></span>
                            <span className="font-semibold text-gray-900">₺{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Teslimat Adresi</p>
                      <p className="text-sm text-gray-700">{order.shippingAddress}</p>
                    </div>

                    {/* Status update */}
                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Durumu Güncelle</p>
                        <div className="flex gap-2 flex-wrap">
                          {statusFlow.slice(currentIdx + 1).map((s) => (
                            <button key={s}
                              onClick={() => updateStatus(order.id, s)}
                              disabled={updating === order.id}
                              className="bg-[#FF6000] hover:bg-[#e55500] disabled:bg-orange-300 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
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
