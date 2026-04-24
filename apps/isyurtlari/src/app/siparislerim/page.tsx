'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuArrowLeft, LuPackage, LuTruck, LuCheck, LuClock } from 'react-icons/lu';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  itemCount: number;
}

const statusColors: Record<string, { color: string; bgColor: string; icon: any }> = {
  PENDING: { color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200', icon: LuClock },
  CONFIRMED: { color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: LuCheck },
  SHIPPED: { color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200', icon: LuTruck },
  DELIVERED: { color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', icon: LuCheck },
  CANCELLED: { color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', icon: LuPackage },
};

const statusText: Record<string, string> = {
  PENDING: '⏳ Ödeme Bekleniyor',
  CONFIRMED: '✅ Ödeme Onaylandı',
  SHIPPED: '🚚 Gönderildi',
  DELIVERED: '📦 Teslim Edildi',
  CANCELLED: '❌ İptal Edildi',
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from localStorage (future: from session)
    const mockUserId = localStorage.getItem('userId');
    if (mockUserId) {
      setUserId(mockUserId);
      fetch(`/api/user/orders?userId=${mockUserId}`)
        .then((res) => res.json())
        .then((data) => {
          setOrders(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#FF6000] hover:text-[#e55500] font-medium mb-4 transition">
            <LuArrowLeft size={18} /> Geri
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <LuPackage size={22} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Siparişlerim</h1>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            {loading ? '...' : `${orders.length} sipariş`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6000]"></div>
          </div>
        ) : !userId ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <span className="text-6xl block mb-4">🔐</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Giriş Gerekli</h2>
            <p className="text-gray-600 mb-6">Siparişlerini görmek için giriş yapmalısın</p>
            <Link
              href="/"
              className="inline-block bg-[#FF6000] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e55500] transition"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <span className="text-6xl block mb-4">📋</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sipariş Yok</h2>
            <p className="text-gray-600 mb-6">Henüz bir sipariş vermemişsin. Ürünleri keşfedebilirsin!</p>
            <Link
              href="/"
              className="inline-block bg-[#FF6000] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e55500] transition"
            >
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const StatusIcon = statusColors[order.status]?.icon || LuPackage;
              return (
                <div key={order.id} className={`bg-white rounded-xl border-2 ${statusColors[order.status]?.bgColor} p-6`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Sipariş #{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon size={20} className={statusColors[order.status]?.color} />
                      <span className={`text-sm font-bold ${statusColors[order.status]?.color}`}>
                        {statusText[order.status] || order.status}
                      </span>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">{order.itemCount} ürün</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          {item.product.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <span className="text-gray-600 line-clamp-1 text-xs">
                            {item.product.name} (×{item.quantity})
                          </span>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <p className="text-xs text-gray-400">+{order.items.length - 4} daha...</p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Toplam</p>
                      <p className="text-2xl font-bold text-[#FF6000]">₺{order.totalAmount.toFixed(2)}</p>
                    </div>
                    <Link
                      href={`/order-confirmation/${order.id}`}
                      className="bg-[#FF6000] hover:bg-[#e55500] text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                      Detayları Gör
                    </Link>
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
