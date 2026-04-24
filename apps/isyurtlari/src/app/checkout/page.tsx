'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LuInfo } from 'react-icons/lu';

interface Campaign {
  id: string;
  name: string;
  discount: number;
  discountedPrice: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  slug: string;
  imageUrl?: string;
  campaign?: Campaign | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'TRANSFER'>('CREDIT_CARD');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (savedCart.length === 0) {
      router.push('/sepet');
      return;
    }
    setCart(savedCart);
    setPageLoading(false);
  }, [router]);

  // Calculate prices with campaign discounts
  const getItemPrice = (item: CartItem): number => {
    if (item.campaign) {
      return item.campaign.discountedPrice;
    }
    return item.price;
  };

  const subtotal = cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const originalSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = originalSubtotal - subtotal;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setError('Lütfen tüm alanları doldurunuz');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          email: formData.email,
          phone: formData.phone,
          shippingAddress: formData.address,
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: getItemPrice(item),
          })),
          totalAmount: total,
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || 'Sipariş oluşturulamadı');
        setSubmitting(false);
        return;
      }

      const data = await res.json();

      if (paymentMethod === 'CREDIT_CARD') {
        // Iyzico payment
        const paymentRes = await fetch('/api/checkout/iyzico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            totalAmount: total,
            customerEmail: formData.email,
            customerName: formData.name,
          }),
        });

        if (!paymentRes.ok) {
          const paymentError = await paymentRes.json();
          setError(paymentError.error || 'Ödeme formu oluşturulamadı');
          setSubmitting(false);
          return;
        }

        const paymentData = await paymentRes.json();

        // Iyzico checkout form HTML'ini DOM'a ekle
        if (paymentData.checkoutFormContent) {
          const checkoutForm = document.createElement('div');
          checkoutForm.innerHTML = paymentData.checkoutFormContent;
          document.body.appendChild(checkoutForm);
        }
      } else {
        // Bank transfer - show confirmation with bank details
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated'));
        router.push(`/order-confirmation/${data.orderId}?payment=transfer`);
      }
    } catch (err) {
      setError('Sipariş oluşturulurken hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-screen-2xl mx-auto px-4 py-4">
          <Link href="/sepet" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Geri
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Ödeme</h1>
          <p className="text-gray-600 text-sm mt-1">🎓 Her satın alma, hükümlülerin yeniden başlamasına destek olur</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
            <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Kişisel Bilgiler */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Kişisel Bilgiler</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Adınız Soyadınız"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ornek@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+90 (5XX) XXX XX XX"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Teslimat Adresi */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Teslimat Adresi</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ev/İş adresi"
                    required
                  />
                </div>
              </div>

              {/* Ödeme Yöntemi */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ödeme Yöntemi</h2>
                <div className="space-y-4">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    style={{borderColor: paymentMethod === 'CREDIT_CARD' ? '#2563eb' : undefined,
                            backgroundColor: paymentMethod === 'CREDIT_CARD' ? '#eff6ff' : undefined}}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CREDIT_CARD"
                      checked={paymentMethod === 'CREDIT_CARD'}
                      onChange={() => setPaymentMethod('CREDIT_CARD')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-semibold text-gray-900">iyzico ile Öde</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard ve daha fazla</p>
                    </div>
                    <Image src="/iyzico.png" alt="iyzico" width={60} height={24} className="h-6 w-auto" />
                  </label>

                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    style={{borderColor: paymentMethod === 'TRANSFER' ? '#2563eb' : undefined,
                            backgroundColor: paymentMethod === 'TRANSFER' ? '#eff6ff' : undefined}}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="TRANSFER"
                      checked={paymentMethod === 'TRANSFER'}
                      onChange={() => setPaymentMethod('TRANSFER')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-semibold text-gray-900">Havale / EFT</p>
                      <p className="text-sm text-gray-600">Manuel ödeme onayı gerekir</p>
                    </div>
                    <span className="text-2xl">🏦</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#FF6000] hover:bg-[#e55500] disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    İşleniyor...
                  </>
                ) : paymentMethod === 'CREDIT_CARD' ? (
                  '💳 Kredi Kartı ile Destekle'
                ) : (
                  '🏦 Havale ile Devam Et'
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-20 space-y-6">
              {/* Impact Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-3">🎓 Yardımın Etkisi</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-blue-900">
                    <span>Eğitim Saati</span>
                    <span className="font-bold">{cart.reduce((sum, item) => sum + item.quantity * 5, 0)} saat</span>
                  </div>
                  <div className="flex justify-between text-blue-900">
                    <span>Desteklenen Hükümlü</span>
                    <span className="font-bold">~{Math.ceil(cart.reduce((sum, item) => sum + item.quantity, 0) * 0.5)} kişi</span>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900">Sipariş Özeti</h3>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-gray-600">×{item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      ₺{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam</span>
                  <span>₺{originalSubtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>İndirim Tasarrufu</span>
                    <span>-₺{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>KDV (%10)</span>
                  <span>₺{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                  <span>Toplam</span>
                  <span>₺{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
