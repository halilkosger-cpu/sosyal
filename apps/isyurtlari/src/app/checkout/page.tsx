'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LuInfo, LuMapPin, LuPlus, LuArrowLeft, LuLandmark, LuCreditCard, LuLock, LuRotateCcw, LuTruck } from 'react-icons/lu';
import { odemeyeBaslandi } from '@/lib/analiz';
import { useMusteri } from '@/lib/musteri-istemci';
import { siparisToplami, KARGO_KARSI_ODEMELI } from '@/lib/fiyat';
import { indirimiKalemlereDagit } from '@/lib/kupon-hesap';

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
  const [kuponKodu, setKuponKodu] = useState('');
  const [uygulananKupon, setUygulananKupon] = useState('');
  const [kuponIndirimi, setKuponIndirimi] = useState(0);
  const [kuponMesaji, setKuponMesaji] = useState('');
  const [kuponIsleniyor, setKuponIsleniyor] = useState(false);
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
  const { urunToplami: subtotal, kargo: shipping } = siparisToplami(
    cart.map((item) => ({
      tutar: getItemPrice(item) * item.quantity,
      kdvOrani: item.kdvOrani,
    }))
  );
  const totalDiscount = originalSubtotal - subtotal;

  /**
   * Kupon.
   *
   * Buradaki indirim yalnızca GÖSTERİM içindir. Sipariş ucu kuponu
   * kendisi yeniden doğrulayıp indirimi kendisi hesaplıyor; gövdede
   * yalnızca kod gönderiliyor. İstemcinin hesapladığı bir indirime
   * güvenilseydi, isteği elle düzenleyen biri istediği indirimi
   * yazdırabilirdi.
   *
   * Tutar da toplamdan çıkarılarak değil YENİDEN hesaplanıyor.
   *
   * Fiyatlar KDV dahil ve oran kategoriye göre değişebiliyor. İndirimi
   * toplamdan düşüp KDV'yi indirimsiz tutar üzerinden gösterseydik,
   * ödeme sayfası gerçekte tahsil edilmeyen bir KDV yazardı ve sipariş
   * ucunun yazdığı kırılımla uyuşmazdı. Dağıtım sipariş ucundakiyle aynı
   * fonksiyon (lib/kupon-hesap.ts).
   */
  const kuponluTutar = siparisToplami(
    indirimiKalemlereDagit(
      cart.map((item) => ({
        tutar: getItemPrice(item) * item.quantity,
        kdvOrani: item.kdvOrani,
      })),
      kuponIndirimi
    ).map((k) => ({ tutar: k.indirimliTutar, kdvOrani: k.kdvOrani }))
  );
  const kuponluToplam = kuponluTutar.toplam;
  const kuponluKdv = kuponluTutar.kdv;

  const kuponuUygula = async (e: React.FormEvent) => {
    e.preventDefault();
    const kod = kuponKodu.trim();
    if (!kod) return;

    setKuponIsleniyor(true);
    setKuponMesaji('');
    try {
      const yanit = await fetch('/api/kupon/dogrula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kod,
          kalemler: cart.map((k) => ({ id: k.id, adet: k.quantity })),
          eposta: formData.email || undefined,
        }),
      });
      const veri = await yanit.json().catch(() => ({}));

      if (!yanit.ok || !veri.gecerli) {
        setKuponIndirimi(0);
        setUygulananKupon('');
        setKuponMesaji(veri.mesaj || veri.error || 'Kupon kullanılamıyor');
        return;
      }

      setKuponIndirimi(Number(veri.indirim) || 0);
      setUygulananKupon(veri.kod || kod.toUpperCase());
      setKuponMesaji(veri.mesaj || '');
    } catch {
      setKuponMesaji('Kupon kontrol edilemedi');
    } finally {
      setKuponIsleniyor(false);
    }
  };

  const kuponuKaldir = () => {
    setKuponKodu('');
    setUygulananKupon('');
    setKuponIndirimi(0);
    setKuponMesaji('');
  };

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
          totalAmount: kuponluToplam,
          paymentMethod,
          ...(uygulananKupon ? { kuponKodu: uygulananKupon } : {}),
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
            totalAmount: kuponluToplam,
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#CC4E00]" />
      </div>
    );
  }

  const kutu = 'rounded-2xl border border-gray-200 bg-white p-5 md:p-6';
  const baslik = 'flex items-center gap-2.5 text-lg font-bold text-gray-900';
  const adim = (n: number) => (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#CC4E00] text-white text-sm font-bold">{n}</span>
  );
  const secenek = (secili: boolean) =>
    `flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition ${secili ? 'border-[#CC4E00] bg-orange-50/60' : 'border-gray-200 hover:bg-gray-50'}`;

  return (
    <div className="bg-[#FAFAF9] min-h-[70vh]">
      <div className="bg-gradient-to-b from-[#FBF6EF] to-[#FAFAF9] border-b border-orange-100/60">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <Link href="/sepet" className="inline-flex items-center gap-1 text-sm font-semibold text-[#BA4700] hover:text-[#8F3700]">
            <LuArrowLeft size={16} /> Sepete dön
          </Link>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141B2D] mt-2">Ödeme</h1>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6 md:py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
            <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
            {/* 1. İletişim */}
            <section className={kutu}>
              <h2 className={baslik}>{adim(1)} İletişim Bilgileri</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad</label>
                  <input id="name" type="text" name="name" autoComplete="name" value={formData.name} onChange={handleInputChange} className="store-input" placeholder="Adınız Soyadınız" required />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
                  <input id="email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleInputChange} className="store-input" placeholder="ornek@email.com" required />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                  <input id="phone" type="tel" name="phone" autoComplete="tel" value={formData.phone} onChange={handleInputChange} className="store-input" placeholder="05XX XXX XX XX" required />
                </div>
              </div>
            </section>

            {/* 2. Teslimat adresi */}
            <section className={kutu}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className={baslik}>{adim(2)} Teslimat Adresi</h2>
                {musteri && (
                  <Link href="/adreslerim" className="text-sm font-semibold text-[#BA4700] hover:text-[#8F3700]">Adres defterim</Link>
                )}
              </div>

              {/* Kayitli adresi olan musteri listeden seciyor; digerleri serbest metin. Misafir odemesi de calisiyor. */}
              {adresler.length > 0 && (
                <div className="space-y-3 mt-5">
                  {adresler.map((adres) => (
                    <label key={adres.id} className={secenek(seciliAdres === adres.id)}>
                      <input type="radio" name="teslimatAdresi" checked={seciliAdres === adres.id} onChange={() => setSeciliAdres(adres.id)} className="mt-1 w-4 h-4 accent-[#CC4E00] flex-shrink-0" />
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="flex items-center gap-2 font-semibold text-gray-900">
                          <LuMapPin size={14} className="text-[#BA4700] flex-shrink-0" /> {adres.title}
                        </span>
                        <span className="block text-gray-700 mt-1">{adres.fullName} · {adres.phone}</span>
                        <span className="block text-gray-600 mt-0.5 leading-relaxed">{adresOzeti(adres)}</span>
                      </span>
                    </label>
                  ))}
                  <label className={secenek(seciliAdres === 'yeni')}>
                    <input type="radio" name="teslimatAdresi" checked={seciliAdres === 'yeni'} onChange={() => setSeciliAdres('yeni')} className="mt-0.5 w-4 h-4 accent-[#CC4E00] flex-shrink-0" />
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900"><LuPlus size={14} className="text-[#BA4700]" /> Farklı bir adrese gönder</span>
                  </label>
                </div>
              )}

              {seciliAdres === 'yeni' && (
                <div className="mt-5">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">Adres</label>
                  <textarea id="address" name="address" autoComplete="street-address" value={formData.address} onChange={handleInputChange} rows={3} className="store-input" placeholder="Mahalle, sokak, bina no, daire no, ilçe / il" required />
                  {musteri && adresler.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Bu adresi <Link href="/adreslerim" className="text-[#BA4700] hover:text-[#8F3700] font-medium underline">adres defterinize</Link> kaydederseniz sonraki siparişlerinizde baştan yazmanız gerekmez.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* 3. Ödeme yöntemi - kart ödemesi iyzico hesabı açılınca eklenecek */}
            <section className={kutu}>
              <h2 className={baslik}>{adim(3)} Ödeme Yöntemi</h2>
              <div className="space-y-3 mt-5">
                <label className={secenek(paymentMethod === 'TRANSFER')}>
                  <input type="radio" name="paymentMethod" value="TRANSFER" checked={paymentMethod === 'TRANSFER'} onChange={() => setPaymentMethod('TRANSFER')} className="mt-1 w-4 h-4 accent-[#CC4E00]" />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 font-semibold text-gray-900"><LuLandmark size={16} className="text-[#BA4700]" /> Havale / EFT</span>
                    <span className="block text-sm text-gray-600 mt-0.5">Banka bilgileri sipariş onayından sonra gösterilir. Ödemeniz onaylanınca siparişiniz hazırlanır.</span>
                  </span>
                </label>
                <div className="flex items-center gap-3 p-4 border border-dashed border-gray-200 rounded-xl text-sm text-gray-500">
                  <LuCreditCard size={18} className="shrink-0" /> Kartla ödeme yakında eklenecek.
                </div>
              </div>
            </section>

            {/* Mesafeli Sozlesmeler Yonetmeligi: tuketici on bilgilendirmeyi okudugunu siparis oncesi onaylamali. */}
            <label className="flex items-start gap-3 text-sm text-gray-700 px-1">
              <input type="checkbox" required className="mt-0.5 w-4 h-4 accent-[#CC4E00] shrink-0" />
              <span>
                <Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="font-semibold text-[#BA4700] underline">Ön bilgilendirme formunu ve mesafeli satış sözleşmesini</Link> okudum, onaylıyorum.
              </span>
            </label>

            <button type="submit" disabled={submitting} className="w-full h-12 bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> İşleniyor...
                </>
              ) : (
                <>
                  <LuLock size={16} /> Siparişi Tamamla · ₺{kuponluToplam.toFixed(2).replace('.', ',')}
                </>
              )}
            </button>
          </form>

          {/* Sipariş özeti */}
          <aside className="rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-40">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sipariş Özeti</h2>

            <div className="space-y-3 pb-4 border-b border-gray-100 max-h-80 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <span className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[#F6EFE6]">
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-gray-800 text-white text-[11px] font-bold flex items-center justify-center">{item.quantity}</span>
                  </span>
                  <p className="flex-1 min-w-0 font-medium text-gray-900 line-clamp-2">{item.name}</p>
                  <p className="font-semibold text-gray-900 shrink-0">₺{((item.campaign?.discountedPrice ?? item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <dl className="space-y-2.5 text-sm pt-4">
              <div className="flex justify-between text-gray-600"><dt>Ara toplam</dt><dd>₺{originalSubtotal.toFixed(2)}</dd></div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold"><dt>İndirim</dt><dd>-₺{totalDiscount.toFixed(2)}</dd></div>
              )}
              {kuponIndirimi > 0 && (
                <div className="flex justify-between text-green-700 font-semibold"><dt>Kupon ({uygulananKupon})</dt><dd>-₺{kuponIndirimi.toFixed(2)}</dd></div>
              )}
              {/* Kargo tutara dahil degil: gonderiler karsi odemeli. */}
              <div className="flex justify-between text-gray-600">
                <dt>Kargo</dt>
                <dd className="font-medium text-gray-700">{KARGO_KARSI_ODEMELI ? 'Karşı ödemeli' : shipping > 0 ? `₺${shipping.toFixed(2)}` : 'Ücretsiz'}</dd>
              </div>
            </dl>

            {/* Kupon */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {uygulananKupon ? (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                  <span className="text-sm text-green-700 font-semibold">{kuponMesaji || 'Kupon uygulandı'}</span>
                  <button type="button" onClick={kuponuKaldir} className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline">Kaldır</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input value={kuponKodu} onChange={(e) => setKuponKodu(e.target.value)} placeholder="Kupon kodu" aria-label="Kupon kodu" className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-[#CC4E00]" />
                    <button type="button" onClick={kuponuUygula} disabled={kuponIsleniyor || !kuponKodu.trim()} className="text-sm font-semibold px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                      {kuponIsleniyor ? '...' : 'Uygula'}
                    </button>
                  </div>
                  {kuponMesaji && <p className="text-xs text-red-600 mt-1.5">{kuponMesaji}</p>}
                </>
              )}
            </div>

            <div className="flex justify-between items-baseline border-t border-gray-100 mt-4 pt-4">
              <span className="font-bold text-gray-900">Toplam</span>
              <span className="text-2xl font-extrabold text-[#141B2D]">₺{kuponluToplam.toFixed(2)}</span>
            </div>
            {/* Fiyatlar KDV dahil: KDV toplamin ustune eklenmiyor. */}
            <p className="text-xs leading-relaxed text-gray-500 mt-2">
              Fiyatlara KDV dahildir (₺{kuponluKdv.toFixed(2)}).
              {KARGO_KARSI_ODEMELI ? ' Kargo ücreti bu tutara dahil değildir; teslimat sırasında kargo firmasına ödenir.' : ''}
            </p>
            <ul className="mt-4 space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2"><LuRotateCcw size={14} className="text-[#E8620C] shrink-0" /> 14 gün cayma hakkı</li>
              <li className="flex items-center gap-2"><LuTruck size={14} className="text-[#E8620C] shrink-0" /> Kargo takip numarasıyla sipariş takibi</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
