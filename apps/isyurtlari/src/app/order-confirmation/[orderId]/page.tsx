'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LuCheck, LuCopy, LuShare2, LuHouse, LuArrowRight } from 'react-icons/lu';

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: string;
  notes?: string;
  orderItems: Array<{ id: string; quantity: number; price: number; product: { name: string; slug: string } }>;
  impact?: {
    trainingHoursFunded: number;
    prisonersSupportedCount: number;
    totalItemsCount: number;
    missionMessage: string;
  };
  bankDetails?: {
    accountName: string;
    iban: string;
    branch: string;
    accountNo: string;
    message?: string;
  };
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;
  const paymentType = searchParams.get('payment') || 'pending';

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId || orderId === 'undefined') {
      setLoading(false);
      return;
    }

    fetch(`/api/orders?id=${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching order:', err);
        setLoading(false);
      });
  }, [orderId]);

  const handleShare = () => {
    const text = `🎉 Sosyal Giriş'i destekledim! Hükümlülerin rehabilitasyonuna katkı sağladım. Sen de katıl: isyurtlari.com.tr`;
    if (navigator.share) {
      navigator.share({ title: 'İsyurtları', text, url: window.location.href });
    } else {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
      window.open(url, '_blank');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Sipariş bulunamadı</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50">
      {/* Success Header */}
      <div className="bg-white border-b-2 border-green-200">
        <div className="max-w-screen-xl mx-auto px-4 py-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <LuCheck size={40} color="#16a34a" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎉 BAŞARILI!</h1>
          <p className="text-xl text-green-700 font-semibold mb-2">Değiştirdin. Destekledin. Fark Yarattın.</p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {order.impact?.missionMessage || 'Sosyal Giriş'e katkı sağladığınız için teşekkürler.'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sipariş Detayları</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sipariş Numarası</span>
                  <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Durumu</span>
                  <span className="font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm">
                    {order.status === 'PENDING' ? 'Ödeme Bekleniyor' : 'Onaylandı'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Toplam Tutar</span>
                  <span className="font-bold text-2xl text-[#FF6000]">₺{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Siparişin Ürünleri</h3>
                <div className="space-y-3">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-500">×{item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900">₺{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Impact Celebration */}
            {order.impact && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Yardımının Etkisi</h2>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center border border-blue-100">
                    <p className="text-3xl font-bold text-blue-600">{order.impact.trainingHoursFunded}</p>
                    <p className="text-sm text-gray-600 mt-2">Saat Meslek Eğitimi</p>
                    <p className="text-xs text-gray-500 mt-1">Fonlanan</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 text-center border border-green-100">
                    <p className="text-3xl font-bold text-green-600">~{order.impact.prisonersSupportedCount}</p>
                    <p className="text-sm text-gray-600 mt-2">Hükümlü Desteklenmiş</p>
                    <p className="text-xs text-gray-500 mt-1">Yeniden Başlama</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 text-center border border-purple-100">
                    <p className="text-3xl font-bold text-purple-600">{order.impact.totalItemsCount}</p>
                    <p className="text-sm text-gray-600 mt-2">Ürün Satın Alındı</p>
                    <p className="text-xs text-gray-500 mt-1">Toplam</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mt-6 p-4 bg-white rounded-lg border border-blue-100 italic">
                  💡 Bu satın alma, hükümlülerin meslek eğitimi, istihdam desteği ve topluma başarılı reentegrasyon için gerekli tüm destek programlarını destekler.
                </p>
              </div>
            )}

            {/* Payment Details - Bank Transfer */}
            {paymentType === 'transfer' && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🏦 Havale Bilgileri</h2>

                <div className="space-y-4 bg-white rounded-xl p-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hesap Adı</p>
                    <p className="font-semibold text-gray-900">{order.bankDetails?.accountName || 'Sosyal Giriş'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">IBAN</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-gray-900">{order.bankDetails?.iban || 'TR...'}</p>
                      <button
                        onClick={() => copyToClipboard(order.bankDetails?.iban || '')}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Kopyala"
                      >
                        <LuCopy size={16} className="text-gray-600" />
                      </button>
                      {copied && <span className="text-xs text-green-600">Kopyalandı!</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Şube</p>
                      <p className="font-semibold text-gray-900">{order.bankDetails?.branch || 'Ankara'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hesap No</p>
                      <p className="font-semibold text-gray-900">{order.bankDetails?.accountNo || '...'}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-blue-900 font-semibold mb-1">📝 ÖNEMLİ:</p>
                    <p className="text-sm text-blue-900">
                      Lütfen havale açıklamasına sipariş numarasını yazınız: <span className="font-bold">{order.orderNumber}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details - Credit Card */}
            {paymentType === 'pending' && order.paymentMethod === 'CREDIT_CARD' && (
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">💳 Kredi Kartı Ödeme</h2>
                <p className="text-gray-700 mb-4">
                  Ödeme sayfasına yönlendirileceksiniz. Kredi kartı bilgilerinizi güvenli bir şekilde Iyzico aracılığıyla işleyin.
                </p>
                <Link
                  href={`/payment/${order.id}`}
                  className="inline-flex items-center gap-2 bg-[#FF6000] hover:bg-[#e55500] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Ödeme Sayfasına Git <LuArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Share */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Paylaş</h3>
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
              >
                <LuShare2 size={18} /> Sosyal Medyada Paylaş
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Arkadaşlarına Sosyal Giriş'i anlatmana yardımcı ol
              </p>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
              <Link
                href="/"
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <LuHouse size={18} className="text-gray-600 group-hover:text-[#FF6000]" />
                  <span className="font-medium text-gray-900 group-hover:text-[#FF6000]">Ana Sayfa</span>
                </div>
                <LuArrowRight size={16} className="text-gray-400" />
              </Link>

              <Link
                href="/"
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛍️</span>
                  <span className="font-medium text-gray-900 group-hover:text-[#FF6000]">Alışverişe Devam Et</span>
                </div>
                <LuArrowRight size={16} className="text-gray-400" />
              </Link>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">📍 Teslimat Adresi</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.shippingAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
