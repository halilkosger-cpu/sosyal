'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LuInfo, LuMapPin, LuPlus, LuArrowLeft, LuLandmark, LuCreditCard, LuLock, LuRotateCcw, LuTruck, LuCopy, LuCheck, LuQrCode } from 'react-icons/lu';
import { generateQrSvg, generateTrKarekodFastPayload } from '@/lib/qr-generator';
import { odemeyeBaslandi } from '@/lib/analiz';
import { useMusteri } from '@/lib/musteri-istemci';
import { siparisToplami, KARGO_KARSI_ODEMELI, kargoDurumuMetni } from '@/lib/fiyat';
import { indirimiKalemlereDagit } from '@/lib/kupon-hesap';
import WorkshopDeliveryCommitment from '@/components/WorkshopDeliveryCommitment';

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

/** Türkiye telefon numarası maskesi: (5XX) XXX XX XX */
function telefonFormatla(deger: string): string {
  let temiz = deger.replace(/\D/g, '');
  if (temiz.startsWith('0')) temiz = temiz.slice(1);
  temiz = temiz.slice(0, 10);
  if (!temiz) return '';
  if (temiz.length <= 3) return `(${temiz}`;
  if (temiz.length <= 6) return `(${temiz.slice(0, 3)}) ${temiz.slice(3)}`;
  if (temiz.length <= 8) return `(${temiz.slice(0, 3)}) ${temiz.slice(3, 6)} ${temiz.slice(6)}`;
  return `(${temiz.slice(0, 3)}) ${temiz.slice(3, 6)} ${temiz.slice(6, 8)} ${temiz.slice(8, 10)}`;
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
  const [ibanKopyalandi, setIbanKopyalandi] = useState(false);
  const [qrAcik, setQrAcik] = useState(false);
  const [qrModu, setQrModu] = useState<'fast' | 'iban'>('iban');

  const ibanKopyala = (iban: string) => {
    navigator.clipboard.writeText(iban.replace(/\s/g, ''));
    setIbanKopyalandi(true);
    setTimeout(() => setIbanKopyalandi(false), 2000);
  };
  const [ulkeKodu, setUlkeKodu] = useState('+90');
  const [telefonNo, setTelefonNo] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    ilce: '',
    il: '',
    postaKodu: '',
    faturaTuru: 'bireysel' as 'bireysel' | 'kurumsal',
    tcKimlikNo: '',
    sirketUnvani: '',
    vergiDairesi: '',
    vergiNo: '',
  });

  useEffect(() => {
    const odemeHatasi = new URLSearchParams(window.location.search).get('hata');
    if (odemeHatasi) {
      setError(`Kartla ödeme tamamlanamadı: ${odemeHatasi.replace(/_/g, ' ')}. Lütfen tekrar deneyin veya havale/EFT seçin.`);
    }
  }, []);

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

    if (musteri.phone) {
      const p = musteri.phone.trim();
      if (p.startsWith('+')) {
        const parcalar = p.split(' ');
        const kod = parcalar[0];
        const num = parcalar.slice(1).join('') || p.slice(kod.length);
        setUlkeKodu(kod);
        setTelefonNo(kod === '+90' ? telefonFormatla(num) : num);
      } else {
        setUlkeKodu('+90');
        setTelefonNo(telefonFormatla(p));
      }
    }

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
    hamUrunToplami,
    kasimIndirimi,
    urunToplami: subtotal,
    kargo: shipping,
  } = siparisToplami(
    cart.map((item) => ({
      tutar: getItemPrice(item) * item.quantity,
      kdvOrani: item.kdvOrani,
    }))
  );
  const totalDiscount = originalSubtotal - (hamUrunToplami || subtotal);

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
    const tamTelefon = `${ulkeKodu.trim()} ${telefonNo.trim()}`.trim();

    if (!formData.name || !formData.email || !telefonNo.trim()) {
      setError('Lütfen tüm iletişim alanlarını doldurunuz');
      return;
    }
    if (ulkeKodu === '+90') {
      const rakamlar = telefonNo.replace(/\D/g, '');
      const temizRakam = rakamlar.startsWith('0') ? rakamlar.slice(1) : rakamlar;
      if (temizRakam.length !== 10 || !temizRakam.startsWith('5')) {
        setError('Lütfen geçerli bir cep telefonu numarası giriniz: (5XX) XXX XX XX');
        return;
      }
    }
    if (!kayitliAdresSecili && (!formData.address.trim() || !formData.ilce.trim() || !formData.il.trim())) {
      setError('Adres, ilçe ve il alanlarını doldurun ya da kayıtlı adreslerinizden birini seçin');
      return;
    }

    // Fatura & Yasal Kimlik Doğrulaması (Kargo ve fatura için zorunlu)
    if (formData.faturaTuru === 'bireysel') {
      const tckn = formData.tcKimlikNo.replace(/\D/g, '');
      if (!tckn || tckn.length !== 11 || tckn.startsWith('0')) {
        setError('Bireysel fatura ve kargo teslimatı için lütfen geçerli bir 11 haneli T.C. Kimlik Numarası giriniz');
        return;
      }
    } else {
      if (!formData.sirketUnvani.trim()) {
        setError('Kurumsal fatura için lütfen şirket / firma tam ünvanını giriniz');
        return;
      }
      if (!formData.vergiDairesi.trim()) {
        setError('Kurumsal fatura için lütfen vergi dairesini giriniz');
        return;
      }
      const vkn = formData.vergiNo.replace(/\D/g, '');
      if (!vkn || (vkn.length !== 10 && vkn.length !== 11)) {
        setError('Kurumsal fatura için lütfen geçerli bir Vergi Numarası (10 veya 11 hane) giriniz');
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          email: formData.email,
          phone: tamTelefon,
          /**
           * Kayitli adres secildiyse yalnizca kimligi gonderiliyor; adresin
           * metni sunucuda veritabanindaki kayittan uretiliyor. Istemciden
           * gelen metne guvenilseydi, istegi elle duzenleyen biri kayitli
           * adresle alakasi olmayan bir adres yazdirabilirdi.
           */
          ...(kayitliAdresSecili
            ? { addressId: seciliAdres }
            : {
                shippingAddress: [
                  formData.address.trim(),
                  `${formData.ilce.trim()} / ${formData.il.trim()}`,
                  formData.postaKodu.trim(),
                ]
                  .filter(Boolean)
                  .join(', '),
              }),
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: getItemPrice(item),
          })),
          totalAmount: kuponluToplam,
          paymentMethod,
          faturaTuru: formData.faturaTuru,
          tcKimlikNo: formData.tcKimlikNo.replace(/\D/g, ''),
          sirketUnvani: formData.sirketUnvani.trim(),
          vergiDairesi: formData.vergiDairesi.trim(),
          vergiNo: formData.vergiNo.replace(/\D/g, ''),
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
        /**
         * Yalnizca orderId gonderiliyor. Onceden tutar, e-posta ve isim de
         * buradan gidiyordu; uc de onlara guveniyordu, yani sepet tutari
         * tarayicidan degistirilebiliyordu. Artik hepsi siparis kaydindan
         * okunuyor (bkz. api/checkout/iyzico/route.ts).
         */
        const paymentRes = await fetch('/api/checkout/iyzico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderId }),
        });

        if (!paymentRes.ok) {
          const paymentError = await paymentRes.json();
          setError(paymentError.error || 'Ödeme formu oluşturulamadı');
          setSubmitting(false);
          return;
        }

        const paymentData = await paymentRes.json();

        if (!paymentData.paymentPageUrl) {
          setError('Ödeme sayfası açılamadı, lütfen tekrar deneyin.');
          setSubmitting(false);
          return;
        }
        window.location.assign(paymentData.paymentPageUrl);
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
    `flex items-start gap-3 p-3.5 sm:p-4 border rounded-xl cursor-pointer transition min-w-0 max-w-full overflow-hidden ${secili ? 'border-[#CC4E00] bg-orange-50/60' : 'border-gray-200 hover:bg-gray-50'}`;

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

        {/* Atölye & Hasat Teslimat Taahhüdü */}
        <WorkshopDeliveryCommitment items={cart} className="mb-6" />

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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Cep Telefonu</label>
                  <div className="flex rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#CC4E00] focus-within:border-transparent transition overflow-hidden">
                    <input
                      type="text"
                      value={ulkeKodu}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        if (val && !val.startsWith('+')) val = '+' + val.replace(/\D/g, '');
                        setUlkeKodu(val || '+');
                      }}
                      className="w-16 px-2 py-2.5 bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm text-center border-r border-gray-200 focus:outline-none focus:bg-white select-all"
                      title="Ülke kodu (+90 varsayılan; yabancı numara için değiştirebilirsiniz)"
                      placeholder="+90"
                      maxLength={5}
                    />
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel-national"
                      value={telefonNo}
                      onChange={(e) => {
                        const val = ulkeKodu === '+90' ? telefonFormatla(e.target.value) : e.target.value;
                        setTelefonNo(val);
                      }}
                      className="flex-1 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none bg-transparent"
                      placeholder={ulkeKodu === '+90' ? '(5__) ___ __ __' : 'Telefon numaranız'}
                      required
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {ulkeKodu === '+90' ? 'Varsayılan Türkiye (+90). Yabancı numara için kodu düzenleyebilirsiniz.' : 'Yurtdışı numarası olarak kaydedilecektir.'}
                  </p>
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
                  <textarea id="address" name="address" autoComplete="street-address" value={formData.address} onChange={handleInputChange} rows={2} className="store-input" placeholder="Mahalle, sokak, bina no, daire no" required />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label htmlFor="ilce" className="block text-sm font-medium text-gray-700 mb-1.5">İlçe</label>
                      <input id="ilce" type="text" name="ilce" autoComplete="address-level2" value={formData.ilce} onChange={handleInputChange} className="store-input" required />
                    </div>
                    <div>
                      <label htmlFor="il" className="block text-sm font-medium text-gray-700 mb-1.5">İl</label>
                      <input id="il" type="text" name="il" autoComplete="address-level1" value={formData.il} onChange={handleInputChange} className="store-input" required />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label htmlFor="postaKodu" className="block text-sm font-medium text-gray-700 mb-1.5">Posta kodu <span className="text-gray-400 font-normal">(isteğe bağlı)</span></label>
                    <input id="postaKodu" type="text" name="postaKodu" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={formData.postaKodu} onChange={handleInputChange} className="store-input" />
                  </div>
                  {musteri && adresler.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Bu adresi <Link href="/adreslerim" className="text-[#BA4700] hover:text-[#8F3700] font-medium underline">adres defterinize</Link> kaydederseniz sonraki siparişlerinizde baştan yazmanız gerekmez.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* 3. Fatura & Kimlik Bilgileri */}
            <section className={kutu}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className={baslik}>{adim(3)} Fatura & Kimlik Bilgileri</h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                  Mevzuat Gereği Zorunlu
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Kargo taşıma mevzuatı ve resmi e-Arşiv / e-Fatura kesilebilmesi için Bireysel (T.C. Kimlik No) veya Şirket (Ünvan, Vergi No) bilgilerinden birinin girilmesi zorunludur.
              </p>

              {/* Fatura Türü Seçimi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, faturaTuru: 'bireysel' }))}
                  className={`p-3.5 rounded-xl border text-left font-medium text-sm transition flex items-center gap-2.5 cursor-pointer ${
                    formData.faturaTuru === 'bireysel'
                      ? 'border-[#CC4E00] bg-orange-50/70 text-[#CC4E00] font-bold ring-1 ring-[#CC4E00]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    formData.faturaTuru === 'bireysel' ? 'border-[#CC4E00]' : 'border-gray-300'
                  }`}>
                    {formData.faturaTuru === 'bireysel' && <span className="w-2 h-2 rounded-full bg-[#CC4E00]" />}
                  </span>
                  <span>👤 Bireysel Fatura (T.C. Kimlik)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, faturaTuru: 'kurumsal' }))}
                  className={`p-3.5 rounded-xl border text-left font-medium text-sm transition flex items-center gap-2.5 cursor-pointer ${
                    formData.faturaTuru === 'kurumsal'
                      ? 'border-[#CC4E00] bg-orange-50/70 text-[#CC4E00] font-bold ring-1 ring-[#CC4E00]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    formData.faturaTuru === 'kurumsal' ? 'border-[#CC4E00]' : 'border-gray-300'
                  }`}>
                    {formData.faturaTuru === 'kurumsal' && <span className="w-2 h-2 rounded-full bg-[#CC4E00]" />}
                  </span>
                  <span>🏢 Kurumsal (Şirket / Firma)</span>
                </button>
              </div>

              {/* Bireysel Alanlar */}
              {formData.faturaTuru === 'bireysel' ? (
                <div className="mt-4">
                  <label htmlFor="tcKimlikNo" className="block text-sm font-medium text-gray-700 mb-1.5">
                    T.C. Kimlik Numarası <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    id="tcKimlikNo"
                    type="text"
                    name="tcKimlikNo"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={11}
                    value={formData.tcKimlikNo}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setFormData((p) => ({ ...p, tcKimlikNo: val }));
                    }}
                    className="store-input"
                    placeholder="11 haneli T.C. Kimlik Numaranız"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Vergi Usul Kanunu uyarınca adınıza düzenlenecek e-Arşiv fatura ve kargo teslim fişi için zorunludur.
                  </p>
                </div>
              ) : (
                /* Kurumsal Alanlar */
                <div className="mt-4 space-y-3.5">
                  <div>
                    <label htmlFor="sirketUnvani" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Şirket / Firma Tam Ünvanı <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      id="sirketUnvani"
                      type="text"
                      name="sirketUnvani"
                      value={formData.sirketUnvani}
                      onChange={handleInputChange}
                      className="store-input"
                      placeholder="Örn: ABC Gıda ve Tarım San. Tic. Ltd. Şti."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="vergiDairesi" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Vergi Dairesi <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        id="vergiDairesi"
                        type="text"
                        name="vergiDairesi"
                        value={formData.vergiDairesi}
                        onChange={handleInputChange}
                        className="store-input"
                        placeholder="Örn: Çankaya V.D."
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="vergiNo" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Vergi Numarası (VKN) <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        id="vergiNo"
                        type="text"
                        name="vergiNo"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={11}
                        value={formData.vergiNo}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setFormData((p) => ({ ...p, vergiNo: val }));
                        }}
                        className="store-input"
                        placeholder="10 Haneli VKN veya 11 Haneli TCKN"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 4. Ödeme yöntemi */}
            <section className={kutu}>
              <h2 className={baslik}>{adim(4)} Ödeme & Sipariş Yöntemi</h2>
              <div className="space-y-3 mt-5">
                <label className={secenek(paymentMethod === 'TRANSFER')}>
                  <input type="radio" name="paymentMethod" value="TRANSFER" checked={paymentMethod === 'TRANSFER'} onChange={() => setPaymentMethod('TRANSFER')} className="mt-1 w-4 h-4 accent-[#CC4E00] shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 font-bold text-gray-900 flex-wrap">
                      <LuLandmark size={17} className="text-[#BA4700] shrink-0" />
                      <span className="break-words">Havale / EFT ile Güvenli Ödeme (Halkbank Şirket Hesabı)</span>
                    </span>
                    <span className="block text-xs text-gray-600 mt-1 leading-relaxed">
                      Sipariş onayından sonra Türkiye Halk Bankası şirket hesabımıza havale veya EFT yapabilirsiniz.
                    </span>
                    {paymentMethod === 'TRANSFER' && (
                      <div className="mt-3 p-3.5 sm:p-4 bg-white border border-gray-200 rounded-xl text-xs space-y-3 shadow-xs max-w-full overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-gray-700 font-semibold border-b border-gray-100 pb-2 gap-1">
                          <span className="truncate">Türkiye Halk Bankası (Halkbank)</span>
                          <span className="text-gray-500 font-normal text-[11px] sm:text-xs shrink-0">Ovacık Ankara Şb. (1553)</span>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Hesap Sahibi</p>
                          <p className="font-bold text-gray-900 break-words">İŞ YRT E-TİCARET GIDA LİMİTED ŞİRKETİ</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-gray-500 uppercase tracking-wide">IBAN</span>
                            <span className="text-[11px] text-gray-400">Tek tıkla kopyalayın</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 max-w-full">
                            <div className="flex-1 min-w-0 font-mono font-bold text-[#BA4700] text-[11px] sm:text-xs md:text-sm bg-orange-50/60 p-2 sm:p-2.5 rounded-lg border border-orange-100 select-all overflow-x-auto whitespace-nowrap">
                              TR43 0001 2001 5530 0010 1022 58
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                ibanKopyala('TR43 0001 2001 5530 0010 1022 58');
                              }}
                              className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shrink-0"
                              title="IBAN'ı Kopyala"
                            >
                              {ibanKopyalandi ? (
                                <>
                                  <LuCheck size={14} className="text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Kopyalandı</span>
                                </>
                              ) : (
                                <>
                                  <LuCopy size={14} className="text-gray-600" />
                                  <span>Kopyala</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* QR Kod ile Kolay Ödeme */}
                        <div className="pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setQrAcik((prev) => !prev);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#BA4700] hover:text-[#8F3700] transition-colors"
                          >
                            <LuQrCode size={15} />
                            <span>{qrAcik ? 'Karekodunu Gizle' : 'Karekod (QR) ile Öde'}</span>
                          </button>

                          {qrAcik && (
                            <div className="mt-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                              {/* QR Modu Seçimi */}
                              <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-gray-200 text-[11px] font-medium">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setQrModu('iban');
                                  }}
                                  className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center ${
                                    qrModu === 'iban'
                                      ? 'bg-[#0F2040] text-white font-semibold shadow-xs'
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  📱 Telefon Kamerası (Düz IBAN)
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setQrModu('fast');
                                  }}
                                  className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center ${
                                    qrModu === 'fast'
                                      ? 'bg-[#0F2040] text-white font-semibold shadow-xs'
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  ⚡ Akbank & Banka FAST
                                </button>
                              </div>

                              <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div
                                  className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs shrink-0"
                                  dangerouslySetInnerHTML={{
                                    __html: generateQrSvg(
                                      qrModu === 'fast'
                                        ? generateTrKarekodFastPayload({
                                            iban: 'TR430001200155300010102258',
                                            name: 'İŞ YRT E-TİCARET GIDA LİMİTED ŞİRKETİ',
                                          })
                                        : 'TR430001200155300010102258',
                                      150,
                                      4
                                    ),
                                  }}
                                />
                                <div className="text-left space-y-1.5">
                                  {qrModu === 'iban' ? (
                                    <>
                                      <p className="font-bold text-gray-900 text-xs">iPhone &amp; Genel Kamera ile Tara</p>
                                      <p className="text-[11px] text-gray-600 leading-relaxed">
                                        iPhone Kamera, Android veya herhangi bir QR okuyucu ile okuttuğunuzda IBAN doğrudan ekrana gelir ve tek tıkla kopyalanır.
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="font-bold text-gray-900 text-xs">Akbank / Banka FAST ile Tara</p>
                                      <p className="text-[11px] text-gray-600 leading-relaxed">
                                        Akbank, Halkbank, İş Bankası, Garanti vb. uygulamanızdan <strong>&apos;Karekod ile Transfer / FAST&apos;</strong> menüsünü açıp okutunuz. IBAN ve alıcı ünvanı otomatik doldurulur.
                                      </p>
                                    </>
                                  )}
                                  <p className="text-[10px] text-gray-400">
                                    {qrModu === 'iban' ? 'Standart ISO/IEC 18004 IBAN Karekodu' : 'TCMB TR-Karekod (FAST) Standardı'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-500 pt-1">
                          * Siparişiniz tamamlandığında bu bilgiler ve sipariş numaranız ekranda ve e-posta adresinizde gösterilecektir.
                        </p>
                      </div>
                    )}
                  </span>
                </label>
                <label className={secenek(paymentMethod === 'CREDIT_CARD')}>
                  <input type="radio" name="paymentMethod" value="CREDIT_CARD" checked={paymentMethod === 'CREDIT_CARD'} onChange={() => setPaymentMethod('CREDIT_CARD')} className="mt-1 w-4 h-4 accent-[#CC4E00] shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2 font-bold text-gray-900 flex-wrap">
                      <span className="flex items-center gap-2">
                        <LuCreditCard size={17} className="text-[#BA4700] shrink-0" /> Kredi / Banka Kartı ile Ödeme
                      </span>
                      <span className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-200">
                        <Image src="/visa.png" alt="Visa" width={28} height={16} className="h-3 w-auto object-contain" />
                        <Image src="/mastercard.png" alt="MasterCard" width={24} height={16} className="h-3.5 w-auto object-contain" />
                        <Image src="/iyzico.png" alt="iyzico" width={40} height={16} className="h-3 w-auto object-contain" />
                      </span>
                    </span>
                    <span className="block text-xs text-gray-600 mt-1 leading-relaxed">
                      Kart bilgileriniz iyzico'nun güvenli ödeme sayfasında girilir; sitemizde saklanmaz.
                    </span>
                  </span>
                </label>
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
                  <LuLock size={16} /> {paymentMethod === 'CREDIT_CARD' ? 'Kartla Güvenli Öde' : 'Siparişi Tamamla'} · ₺{kuponluToplam.toFixed(2).replace('.', ',')}
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
                <div className="flex justify-between text-green-700 font-semibold"><dt>Ürün İndirimi</dt><dd>-₺{totalDiscount.toFixed(2)}</dd></div>
              )}
              {kasimIndirimi > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
                  <dt className="flex items-center gap-1.5">
                    <span>🔥</span> Açılış &amp; Kasım İndirimi (%10)
                  </dt>
                  <dd>-₺{kasimIndirimi.toFixed(2)}</dd>
                </div>
              )}
              {kuponIndirimi > 0 && (
                <div className="flex justify-between text-green-700 font-semibold"><dt>Kupon ({uygulananKupon})</dt><dd>-₺{kuponIndirimi.toFixed(2)}</dd></div>
              )}
              {/* Kargo tutara dahil degil: gonderiler karsi odemeli. */}
              <div className="flex justify-between text-gray-600">
                <dt>Kargo</dt>
                <dd className="font-medium text-gray-700">{KARGO_KARSI_ODEMELI ? kargoDurumuMetni(kuponluTutar.kargoUcretsiz) : shipping > 0 ? `₺${shipping.toFixed(2)}` : 'Ücretsiz'}</dd>
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
              {KARGO_KARSI_ODEMELI && !kuponluTutar.kargoUcretsiz ? ' Kargo ücreti bu tutara dahil değildir; teslimat sırasında kargo firmasına ödenir.' : ''}
              {KARGO_KARSI_ODEMELI && kuponluTutar.kargoUcretsiz ? ' Kargo bu siparişte ücretsizdir; teslimatta kargo ücreti ödemezsiniz.' : ''}
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
