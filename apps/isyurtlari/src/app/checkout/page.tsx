'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LuInfo, LuMapPin, LuPlus } from 'react-icons/lu';
import { odemeyeBaslandi } from '@/lib/analiz';
import { useMusteri } from '@/lib/musteri-istemci';
import { siparisToplami, KARGO_KARSI_ODEMELI } from '@/lib/fiyat';
import { IconTransfer, IconSocialContribution } from '@/components/Icons';

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

interface Adres {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  addressLine: string;
  postalCode: string | null;
  isDefaultShipping: boolean;
}

/** Kayitli adresi kart uzerinde tek satirda gosterir. */
function adresOzeti(a: Adres): string {
  return [a.addressLine, a.neighborhood, `${a.district} / ${a.city}`, a.postalCode]
    .filter(Boolean)
    .join(', ');
}

export default function CheckoutPage() {
  const router = useRouter();
  const { musteri, yukleniyor: musteriYukleniyor } = useMusteri();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [adresler, setAdresler] = useState<Adres[]>([]);
  /** Secili kayitli adres; 'yeni' ise asagidaki serbest metin alani kullaniliyor. */
  const [seciliAdres, setSeciliAdres] = useState<string>('yeni');
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'TRANSFER'>('TRANSFER');
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

    // GA4 begin_checkout. Sepet bos olsaydi zaten yukarida /sepet'e
    // yonlendirilmis olurduk, yani buraya yalnizca gercek bir odeme baslangici
    // ulasiyor.
    odemeyeBaslandi(
      savedCart.map((u: CartItem) => ({
        item_id: u.id,
        item_name: u.name,
        price: u.campaign?.discountedPrice ?? u.price,
        quantity: u.quantity,
      }))
    );
  }, [router]);

  /**
   * Giris yapmis musterinin bilgileri ve adres defteri.
   *
   * Onceden odeme sayfasi her seferinde ad, e-posta, telefon ve adresi
   * bastan istiyordu - hesabi olan musteri icin bile. Artik hesaptaki
   * bilgiler on dolduruluyor ve kayitli adres secilebiliyor.
   */
  useEffect(() => {
    if (musteriYukleniyor || !musteri) return;

    setFormData((onceki) => ({
      ...onceki,
      name: onceki.name || musteri.name,
      email: onceki.email || musteri.email,
      phone: onceki.phone || musteri.phone || '',
    }));

    let iptal = false;
    fetch('/api/musteri/adresler', { cache: 'no-store' })
      .then((yanit) => (yanit.ok ? yanit.json() : null))
      .then((veri) => {
        if (iptal || !veri) return;
        const liste: Adres[] = Array.isArray(veri.adresler) ? veri.adresler : [];
        setAdresler(liste);

        // Varsayilan teslimat adresi secili gelsin; yoksa ilk adres.
        const varsayilan = liste.find((a) => a.isDefaultShipping) ?? liste[0];
        if (varsayilan) setSeciliAdres(varsayilan.id);
      })
      .catch(() => {
        // Adres defteri okunamazsa serbest metin alani zaten duruyor.
      });

    return () => {
      iptal = true;
    };
  }, [musteri, musteriYukleniyor]);

  // Calculate prices with campaign discounts
  const getItemPrice = (item: CartItem): number => {
    if (item.campaign) {
      return item.campaign.discountedPrice;
    }
    return item.price;
  };

  const originalSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Tutar hesabi lib/fiyat.ts'te; siparis ucu de ayni fonksiyonu cagiriyor ki
  // musteriye gosterilen tutar ile siparise yazilan tutar ayrismasin.
  // Fiyatlar KDV dahil: kdv toplama eklenmiyor, icinden hesaplaniyor.
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const kayitliAdresSecili = seciliAdres !== 'yeni' && adresler.some((a) => a.id === seciliAdres);

    if (!formData.name || !formData.email || !formData.phone) {
      setError('Lütfen tüm alanları doldurunuz');
      return;
    }
    if (!kayitliAdresSecili && !formData.address.trim()) {
      setError('Teslimat adresi girin ya da kayıtlı adreslerinizden birini seçin');
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
          /**
           * Kayitli adres secildiyse yalnizca kimligi gonderiliyor; adresin
           * metni sunucuda veritabanindaki kayittan uretiliyor. Istemciden
           * gelen metne guvenilseydi, istegi elle duzenleyen biri kayitli
           * adresle alakasi olmayan bir adres yazdirabilirdi.
           */
          ...(kayitliAdresSecili
            ? { addressId: seciliAdres }
            : { shippingAddress: formData.address }),
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

      if (!data.orderId) {
        setError('Sipariş oluşturulmadı (orderId bulunamadı)');
        setSubmitting(false);
        return;
      }

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
    <div className="store-shell">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 py-4">
          <Link href="/sepet" className="text-[#BA4700] hover:text-[#BA4700] font-medium">
            Sepete geri dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Ödeme</h1>
          <p className="text-gray-600 text-sm mt-1">Her satın alma, hükümlülerin yeniden başlamasına destek olur.</p>
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
              <div className="store-card rounded-2xl p-6">
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
                      className="store-input"
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
                      className="store-input"
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
                      className="store-input"
                      placeholder="+90 (5XX) XXX XX XX"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Teslimat Adresi */}
              <div className="store-card rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900">Teslimat Adresi</h2>
                  {musteri && (
                    <Link href="/adreslerim" className="text-sm font-medium text-[#BA4700] hover:text-[#8F3700] transition">
                      Adres defterim
                    </Link>
                  )}
                </div>

                {/* Kayitli adresi olan musteri listeden seciyor; olmayan ya da
                    baska bir adrese gonderecek olan icin serbest metin alani
                    duruyor. Misafir odemesi de eskisi gibi calisiyor. */}
                {adresler.length > 0 && (
                  <div className="space-y-3 mb-5">
                    {adresler.map((adres) => (
                      <label
                        key={adres.id}
                        className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition ${
                          seciliAdres === adres.id
                            ? 'border-[#FF6000] bg-orange-50/60'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="teslimatAdresi"
                          checked={seciliAdres === adres.id}
                          onChange={() => setSeciliAdres(adres.id)}
                          className="mt-1 w-4 h-4 accent-[#FF6000] flex-shrink-0"
                        />
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="flex items-center gap-2 font-semibold text-gray-900">
                            <LuMapPin size={14} className="text-[#BA4700] flex-shrink-0" />
                            {adres.title}
                          </span>
                          <span className="block text-gray-700 mt-1">{adres.fullName} · {adres.phone}</span>
                          <span className="block text-gray-600 mt-0.5 leading-relaxed">{adresOzeti(adres)}</span>
                        </span>
                      </label>
                    ))}

                    <label
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${
                        seciliAdres === 'yeni'
                          ? 'border-[#FF6000] bg-orange-50/60'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="teslimatAdresi"
                        checked={seciliAdres === 'yeni'}
                        onChange={() => setSeciliAdres('yeni')}
                        className="w-4 h-4 accent-[#FF6000] flex-shrink-0"
                      />
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <LuPlus size={14} className="text-[#BA4700]" />
                        Farklı bir adrese gönder
                      </span>
                    </label>
                  </div>
                )}

                {seciliAdres === 'yeni' && (
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Adres
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={4}
                      className="store-input"
                      placeholder="Mahalle, sokak, bina no, daire no, ilçe / il"
                      required
                    />
                    {musteri && adresler.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Bu adresi{' '}
                        <Link href="/adreslerim" className="text-[#BA4700] hover:text-[#8F3700] font-medium underline">
                          adres defterinize
                        </Link>{' '}
                        kaydederseniz sonraki siparişlerinizde baştan yazmanız gerekmez.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Ödeme Yöntemi */}
              <div className="store-card rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ödeme Yöntemi</h2>
                <div className="space-y-4">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-not-allowed bg-gray-50 opacity-50 transition"
                    title="Yakında aktif edilecek">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CREDIT_CARD"
                      checked={false}
                      disabled
                      className="w-4 h-4 text-gray-400"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-semibold text-gray-600">iyzico ile Öde</p>
                      <p className="text-sm text-gray-500">Visa, Mastercard ve daha fazla (Yakında)</p>
                    </div>
                    <Image src="/iyzico.png" alt="iyzico" width={60} height={24} className="h-6 w-auto opacity-50" />
                  </label>

                  <label className="flex items-center p-4 border rounded-2xl cursor-pointer hover:bg-orange-50/60 transition"
                    style={{borderColor: paymentMethod === 'TRANSFER' ? '#FF6000' : '#e5e7eb',
                            backgroundColor: paymentMethod === 'TRANSFER' ? '#fff7ed' : undefined}}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="TRANSFER"
                      checked={paymentMethod === 'TRANSFER'}
                      onChange={() => setPaymentMethod('TRANSFER')}
                      className="w-4 h-4 accent-[#FF6000]"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-semibold text-gray-900">Havale / EFT</p>
                      <p className="text-sm text-gray-600">Manuel ödeme onayı gerekir</p>
                    </div>
                    <IconTransfer className="w-10 h-10 object-contain" />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    İşleniyor...
                  </>
                ) : paymentMethod === 'CREDIT_CARD' ? (
                  'Kredi Kartı ile Destekle'
                ) : (
                  'Havale ile Devam Et'
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="store-card rounded-2xl p-6 sticky top-20 space-y-6">
              {/* Impact Preview */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <IconSocialContribution className="w-8 h-8 object-contain" />
                  <h4 className="text-sm font-bold text-gray-900">Yardımın etkisi</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Eğitim Saati</span>
                    <span className="font-bold">{cart.reduce((sum, item) => sum + item.quantity * 5, 0)} saat</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
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
                {/* Kargo tutara dahil degil: gonderiler karsi odemeli. Musteri
                    bunu siparisi onaylamadan once bilmeli. */}
                <div className="flex justify-between text-gray-600">
                  <span>Kargo</span>
                  <span className="font-semibold text-gray-700">
                    {KARGO_KARSI_ODEMELI ? 'Karşı ödemeli' : shipping > 0 ? `₺${shipping.toFixed(2)}` : 'Ücretsiz'}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                  <span>Toplam</span>
                  <span>₺{total.toFixed(2)}</span>
                </div>
                {/* Fiyatlar KDV dahil oldugu icin KDV toplamin ustune
                    eklenmiyor; sepette gorulen tutar ile burada tahsil edilen
                    tutar ayni. */}
                <p className="text-xs leading-relaxed text-gray-500">
                  Fiyatlara KDV dahildir (₺{tax.toFixed(2)}).
                  {KARGO_KARSI_ODEMELI
                    ? ' Kargo ücreti bu tutara dahil değildir; teslimat sırasında kargo firmasına ödenir.'
                    : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
