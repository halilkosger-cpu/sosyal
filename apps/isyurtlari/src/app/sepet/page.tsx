'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconCart, IconProductOrigin, IconContinueShopping } from '@/components/Icons';
import { sepettenCikarildi } from '@/lib/analiz';
import { siparisToplami, KARGO_KARSI_ODEMELI } from '@/lib/fiyat';

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
  kdvOrani?: number | null;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage'dan sepeti yükle
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    setLoading(false);
  }, []);

  const updateQuantity = (id: string, newQuantity: number) => {
    const updated = cart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
    );
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id: string) => {
    const cikarilan = cart.find((item) => item.id === id);
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));

    // GA4 remove_from_cart: hunide nerede vazgecildigini gorebilmek icin
    if (cikarilan) {
      sepettenCikarildi({
        item_id: cikarilan.id,
        item_name: cikarilan.name,
        price: getItemPrice(cikarilan),
        quantity: cikarilan.quantity,
      });
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.setItem('cart', JSON.stringify([]));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Calculate prices with campaign discounts
  const getItemPrice = (item: CartItem): number => {
    if (item.campaign) {
      return item.campaign.discountedPrice;
    }
    return item.price;
  };

  const originalSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Tutar hesabi lib/fiyat.ts'te: sepet, odeme sayfasi ve siparis ucu ayni
  // fonksiyonu cagiriyor. Burada daha once "subtotal * 0.1" diye ayrica
  // yazilmisti; iki yerde duran hesap birbirinden ayrisabiliyordu.
  // Fiyatlar KDV dahil oldugu icin kdv toplama EKLENMIYOR, icinden cikiyor.
  const {
    urunToplami: subtotal,
    kdv: tax,
    kargo: shipping,
    toplam: total,
  } = siparisToplami(
    cart.map((item) => ({
      tutar: getItemPrice(item) * item.quantity,
      kdvOrani: item.kdvOrani,
    }))
  );
  const totalDiscount = originalSubtotal - subtotal;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="store-shell">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 py-4">
          <Link href="/" className="text-[#BA4700] hover:text-[#BA4700] font-medium inline-flex items-center gap-2">
            <IconContinueShopping className="w-5 h-5 object-contain" /> Alışverişe devam et
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Sepetim</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
            <IconCart className="w-24 h-24 object-contain mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sepetiniz boş</h2>
            <p className="text-gray-600 mb-6">Sosyal faydaya dönüşecek ürünleri keşfetmek için vitrine dönebilirsiniz.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-[#CC4E00] text-white px-6 py-3 rounded-xl hover:bg-[#A63F00] transition font-semibold"
            >
              Ürünleri keşfet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="store-card rounded-2xl p-4 flex gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <IconProductOrigin className="w-14 h-14 object-contain" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <Link
                      href={`/urun/${item.slug}`}
                      className="text-lg font-semibold text-gray-900 hover:text-[#BA4700] transition"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      {item.campaign ? (
                        <>
                          <span className="text-red-600 font-bold text-lg">
                            ₺{item.campaign.discountedPrice.toFixed(2)}
                          </span>
                          <span className="text-gray-400 line-through text-sm">
                            ₺{item.price.toFixed(2)}
                          </span>
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">
                            %{item.campaign.discount} İndirim
                          </span>
                        </>
                      ) : (
                        <span className="text-[#BA4700] font-bold text-lg">
                          ₺{item.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-3 w-fit">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-10 text-center bg-gray-100 rounded outline-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="flex flex-col justify-between items-end">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 transition font-medium text-sm"
                    >
                      Sil
                    </button>
                    <p className="text-gray-900 font-bold text-lg">
                      ₺{(getItemPrice(item) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="store-card rounded-2xl p-6 sticky top-20">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Sipariş özeti</h3>

                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
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
                    <span>Kargo</span>
                    <span className="font-semibold text-gray-700">
                      {KARGO_KARSI_ODEMELI ? 'Karşı ödemeli' : shipping > 0 ? `₺${shipping.toFixed(2)}` : 'Ücretsiz'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-xl font-bold text-gray-900 mb-2">
                  <span>Toplam</span>
                  <span>₺{total.toFixed(2)}</span>
                </div>

                {/* Fiyatlar KDV dahil: KDV toplamin ustune eklenmiyor, icinden
                    cikiyor. Musteri odeme sayfasinda farkli bir tutarla
                    karsilasmasin diye burada aciklaniyor. */}
                <p className="text-xs leading-relaxed text-gray-500 mb-6">
                  Fiyatlara KDV dahildir (₺{tax.toFixed(2)}).
                  {KARGO_KARSI_ODEMELI
                    ? ' Kargo ücreti bu tutara dahil değildir; teslimat sırasında kargo firmasına ödenir.'
                    : ''}
                </p>

                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-[#CC4E00] text-white py-3 rounded-xl font-semibold hover:bg-[#A63F00] transition mb-3"
                >
                  Ödemeye Geç
                </button>

                <button
                  onClick={clearCart}
                  className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
                >
                  Sepeti Boşalt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
