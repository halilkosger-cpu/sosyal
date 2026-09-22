'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuArrowRight, LuMinus, LuPlus, LuRotateCcw, LuShieldCheck, LuShoppingBag, LuTrash2 } from 'react-icons/lu';

const tl = (n: number) => `₺${n.toFixed(2).replace('.', ',')}`;
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#CC4E00]" />
      </div>
    );
  }

  const adet = cart.reduce((t, i) => t + i.quantity, 0);

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141B2D]">
            Sepetim {cart.length > 0 && <span className="text-base font-sans font-medium text-gray-500">({adet} ürün)</span>}
          </h1>
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-[#BA4700] hover:text-[#8F3700]">
            <LuArrowLeft size={16} /> Alışverişe devam et
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-[#FFFBF6] to-[#F7EFE5] p-10 md:p-14 text-center">
            <LuShoppingBag size={56} strokeWidth={1.25} className="mx-auto text-[#E8620C] mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sepetiniz boş</h2>
            <p className="text-gray-600 mb-6">El emeği ürünleri keşfetmek için vitrine göz atın.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] text-white px-6 py-3 rounded-xl font-semibold">
              Ürünleri keşfet <LuArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            {/* Ürünler */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <Link href={`/urun/${item.slug}`} className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden bg-[#F6EFE6] flex items-center justify-center">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <LuShoppingBag size={32} className="text-[#E8620C]" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/urun/${item.slug}`} className="font-semibold text-gray-900 hover:text-[#BA4700] leading-snug line-clamp-2">
                        {item.name}
                      </Link>
                      <button onClick={() => removeItem(item.id)} aria-label={`${item.name} ürününü sepetten çıkar`} className="shrink-0 p-1.5 -m-1.5 text-gray-400 hover:text-red-600">
                        <LuTrash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <span className={`font-semibold ${item.campaign ? 'text-red-600' : 'text-gray-700'}`}>{tl(getItemPrice(item))}</span>
                      {item.campaign && (
                        <>
                          <span className="text-gray-400 line-through text-xs">{tl(item.price)}</span>
                          <span className="bg-red-50 text-red-700 text-[11px] font-bold px-1.5 py-0.5 rounded">%{item.campaign.discount}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Azalt" className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40"><LuMinus size={14} /></button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          aria-label="Adet"
                          className="w-10 h-9 text-center font-semibold text-gray-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Arttır" className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100"><LuPlus size={14} /></button>
                      </div>
                      <p className="font-bold text-gray-900">{tl(getItemPrice(item) * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4 flex justify-end">
                <button onClick={clearCart} className="text-sm text-gray-500 hover:text-red-600">Sepeti boşalt</button>
              </div>
            </div>

            {/* Özet */}
            <aside className="rounded-2xl border border-gray-200 bg-[#FAFAF9] p-5 lg:sticky lg:top-40">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Sipariş özeti</h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600"><dt>Ara toplam</dt><dd>{tl(originalSubtotal)}</dd></div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold"><dt>İndirim</dt><dd>-{tl(totalDiscount)}</dd></div>
                )}
                <div className="flex justify-between text-gray-600">
                  <dt>Kargo</dt>
                  <dd className="font-medium text-gray-700">{KARGO_KARSI_ODEMELI ? 'Karşı ödemeli' : shipping > 0 ? tl(shipping) : 'Ücretsiz'}</dd>
                </div>
              </dl>
              <div className="flex justify-between items-baseline border-t border-gray-200 mt-4 pt-4">
                <span className="font-bold text-gray-900">Toplam</span>
                <span className="text-2xl font-extrabold text-[#141B2D]">{tl(total)}</span>
              </div>
              {/* Fiyatlar KDV dahil: KDV toplamin ustune eklenmiyor, icinden cikiyor. */}
              <p className="text-xs leading-relaxed text-gray-500 mt-2">
                Fiyatlara KDV dahildir ({tl(tax)}).
                {KARGO_KARSI_ODEMELI ? ' Kargo ücreti bu tutara dahil değildir; teslimat sırasında kargo firmasına ödenir.' : ''}
              </p>
              <button onClick={() => router.push('/checkout')} className="w-full mt-5 h-12 bg-[#CC4E00] hover:bg-[#A63F00] text-white rounded-xl font-bold flex items-center justify-center gap-2">
                Ödemeye Geç <LuArrowRight size={18} />
              </button>
              <ul className="mt-5 space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2"><LuRotateCcw size={15} className="text-[#E8620C] shrink-0" /> 14 gün cayma hakkı</li>
                <li className="flex items-center gap-2"><LuShieldCheck size={15} className="text-[#E8620C] shrink-0" /> Siparişlerim sayfasından kargo takibi</li>
              </ul>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
