'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LuHouse, LuCheck, LuShoppingCart, LuTruck, LuRotateCcw, LuShieldCheck,
  LuHandHeart, LuStar, LuMinus, LuPlus, LuChevronRight,
} from 'react-icons/lu';
import FavoriteButton from '@/components/FavoriteButton';
import PreOrderForm from '@/components/PreOrderForm';
import UrunKarti, { type KartUrunu } from '@/components/UrunKarti';
import KategoriIkon from '@/components/KategoriIkon';
import { sepeteEkle } from '@/lib/cart';
import { urunGoruntulendi } from '@/lib/analiz';
import { useMusteri } from '@/lib/musteri-istemci';

/**
 * Urun sayfasi - 2026 Eylul tasarimi.
 *
 * Duzen: galeri | bilgi + fiyat + sepet + guvence rozetleri; altta sekmeler
 * (Aciklama / Ozellikler / Teslimat & Iade / Yorumlar) ve Benzer Urunler.
 * Sekme icerikleri hep DOM'da; secili olmayanlar yalnizca gizleniyor, arama
 * motoru hepsini okuyor.
 *
 * KALDIRILAN METINLER (bilerek)
 * Eski sayfada her urune "Devlet Garantili", "Hicbir kimyasal katki veya
 * yapay madde icermez", "40/60 saat mesleki egitime yatirim" gibi cumleler
 * basiliyordu. Hicbiri bir veriden gelmiyordu; kimyasal icermez beyani
 * temizlik urunlerine bile yaziliyordu. Gidada saglik/icerik beyani ve
 * dogrulanamayan taahhut tuketici mevzuatinda sorun. Yerine yalnizca
 * dogrulanabilir bilgi kondu: uretim yeri, KDV, karsi odemeli kargo,
 * 14 gun cayma hakki.
 */

interface Campaign {
  id: string;
  name: string;
  discount: number;
  discountedPrice: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category: { name: string; slug: string; kdvOrani?: number };
  campaign?: Campaign;
  /** Ana görsel başta olmak üzere ürün galerisi. */
  galeri?: { url: string; alt: string }[];
  ozellikler?: { ad: string; deger: string }[];
  /** Onaylı yorumların ortalaması; yorum yoksa null. */
  puan?: number | null;
  yorumSayisi?: number;
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  text: string;
  user: { name: string; avatar?: string };
  createdAt: string;
  helpfulCount: number;
}

type Sekme = 'aciklama' | 'ozellikler' | 'teslimat' | 'yorumlar';

const fiyat = (n: number) => `₺${n.toFixed(2).replace('.', ',')}`;

const Yildizlar = ({ puan, boyut = 16 }: { puan: number; boyut?: number }) => (
  <span className="flex" aria-label={`5 üzerinden ${puan.toFixed(1)}`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <LuStar
        key={i}
        size={boyut}
        className={i <= Math.round(puan) ? 'text-[#E8620C] fill-[#E8620C]' : 'text-gray-300'}
      />
    ))}
  </span>
);

const GUVENCELER = [
  { Icon: LuTruck, baslik: 'Türkiye geneline gönderim', alt: 'Kargo ücreti teslimatta ödenir' },
  { Icon: LuRotateCcw, baslik: '14 gün cayma hakkı', alt: 'Teslimden itibaren iade' },
  { Icon: LuShieldCheck, baslik: 'Kamu kurumu güvencesi', alt: 'Adalet Bakanlığı İşyurtları Kurumu' },
  { Icon: LuHandHeart, baslik: 'Sosyal katkı', alt: 'Meslek eğitimine destek' },
];

export default function ProductDetailPage({
  baslangicUrun = null,
  benzerUrunler = [],
}: {
  baslangicUrun?: Product | null;
  benzerUrunler?: KartUrunu[];
}) {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(baslangicUrun);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!baslangicUrun);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  /** Galeride seçili görselin sırası. */
  const [seciliGorsel, setSeciliGorsel] = useState(0);
  const [sekme, setSekme] = useState<Sekme>('aciklama');
  /** Yorum formunun geri bildirimi. alert() yerine sayfada gösteriliyor. */
  const [reviewMesaji, setReviewMesaji] = useState<{ tur: 'ok' | 'hata'; metin: string } | null>(null);
  const { musteri } = useMusteri();

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((res) => res.json())
      .then((data) => { setProduct(data?.id ? data : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  // GA4 view_item. Urun kimligine bagli: ayni sayfada urun degisirse yeniden
  // gonderilir, ama her render'da degil.
  useEffect(() => {
    if (!product) return;
    urunGoruntulendi({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category.name,
      price: product.campaign?.discountedPrice ?? product.price,
      quantity: 1,
    });
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setReviewsLoading(true);
    fetch(`/api/products/${slug}/reviews`)
      .then((res) => res.json())
      .then((data) => { setReviews(Array.isArray(data) ? data : []); setReviewsLoading(false); })
      .catch(() => setReviewsLoading(false));
  }, [slug]);

  /**
   * Sepete ekleme lib/cart.ts'teki sepeteEkle() uzerinden: kampanya fiyati,
   * stok ve fiyat kontrolu ve GA add_to_cart orada.
   */
  const handleAddToCart = () => {
    if (!product) return;
    const eklendi = sepeteEkle(
      {
        id: product.id,
        name: product.name,
        price: product.campaign?.discountedPrice ?? product.price,
        slug: product.slug,
        imageUrl: product.imageUrl,
        quantity: product.quantity,
        campaign: product.campaign ?? null,
        kdvOrani: product.category?.kdvOrani ?? null,
      },
      quantity
    );
    if (!eklendi) return;
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 3000);
  };

  const yorumGonder = async () => {
    setReviewMesaji(null);
    if (reviewForm.text.trim().length < 10) {
      setReviewMesaji({ tur: 'hata', metin: 'Yorum en az 10 karakter olmalı.' });
      return;
    }
    setSubmittingReview(true);
    try {
      // Kimlik gonderilmiyor: yazar sunucuda oturumdan belirleniyor (baskasi
      // adina yorum birakilamasin).
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewForm.rating,
          title: reviewForm.title || null,
          text: reviewForm.text,
        }),
      });
      const veri = await res.json().catch(() => ({}));
      if (res.ok) {
        setReviewMesaji({ tur: 'ok', metin: veri.mesaj || 'Yorumunuz alındı. İncelendikten sonra yayınlanacak.' });
        setReviewFormOpen(false);
        setReviewForm({ rating: 5, title: '', text: '' });
      } else {
        setReviewMesaji({ tur: 'hata', metin: veri.error || 'Yorum gönderilemedi' });
      }
    } catch {
      setReviewMesaji({ tur: 'hata', metin: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#CC4E00]" />
    </div>
  );

  if (!product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="text-gray-600 font-medium">Ürün bulunamadı</p>
      <Link href="/" className="bg-[#CC4E00] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#A63F00] transition-colors">
        Ana Sayfaya Dön
      </Link>
    </div>
  );

  const inStock = product.quantity > 0;
  const hasPrice = product.price > 0;
  const gecerliFiyat = product.campaign?.discountedPrice ?? product.price;
  const ortalama = reviews.length > 0 ? reviews.reduce((t, r) => t + r.rating, 0) / reviews.length : null;

  /** Uç galeri döndürmezse ana görsele düşülüyor. */
  const gorseller =
    product.galeri && product.galeri.length > 0
      ? product.galeri
      : product.imageUrl
        ? [{ url: product.imageUrl, alt: product.name }]
        : [];
  const secili = gorseller[Math.min(seciliGorsel, gorseller.length - 1)];

  const sekmeler: { id: Sekme; ad: string }[] = [
    { id: 'aciklama', ad: 'Açıklama' },
    ...(product.ozellikler && product.ozellikler.length > 0 ? [{ id: 'ozellikler' as Sekme, ad: 'Özellikler' }] : []),
    { id: 'teslimat', ad: 'Teslimat & İade' },
    { id: 'yorumlar', ad: `Yorumlar (${reviews.length})` },
  ];

  return (
    <div className="bg-white">

      {/* Breadcrumb */}
      <nav className="max-w-screen-xl mx-auto px-4 pt-4 pb-2 flex items-center gap-1.5 text-sm text-gray-500 overflow-hidden" aria-label="Sayfa yolu">
        <Link href="/" className="hover:text-[#BA4700] flex items-center gap-1 shrink-0"><LuHouse size={14} /> Ana Sayfa</Link>
        <LuChevronRight size={14} className="shrink-0" />
        <Link href={`/${product.category.slug}`} className="hover:text-[#BA4700] shrink-0">{product.category.name}</Link>
        <LuChevronRight size={14} className="shrink-0" />
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="max-w-screen-xl mx-auto px-4 pb-8 pt-2 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">

        {/* ─── GALERİ ─── */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#FBF6EF] to-[#F3EBE1] flex items-center justify-center">
            {secili ? (
              <Image src={secili.url} alt={secili.alt} fill priority quality={80} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            ) : (
              <KategoriIkon slug={product.category.slug} className="w-40 h-40" />
            )}
            {!inStock && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">Tükendi</span>
            )}
            {product.campaign && (
              <span className="absolute top-4 right-4 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full">%{product.campaign.discount} İndirim</span>
            )}
          </div>
          {gorseller.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {gorseller.map((g, i) => (
                <button
                  key={g.url}
                  onClick={() => setSeciliGorsel(i)}
                  aria-label={`${i + 1}. görseli göster`}
                  aria-current={i === seciliGorsel}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition ${i === seciliGorsel ? 'border-[#CC4E00]' : 'border-transparent hover:border-gray-300'}`}
                >
                  <Image src={g.url} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── BİLGİ ─── */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/${product.category.slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#BA4700] bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-full">
              <KategoriIkon slug={product.category.slug} className="w-5 h-5" />
              {product.category.name}
            </Link>
            <span className={`flex items-center gap-1.5 text-xs font-semibold ${inStock ? 'text-green-700' : 'text-red-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-600' : 'bg-red-600'}`} />
              {inStock ? 'Stokta' : 'Tükendi'}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <h1 className="font-serif text-2xl md:text-[2rem] font-bold text-[#141B2D] leading-tight">{product.name}</h1>
            <FavoriteButton productId={product.id} size="lg" />
          </div>

          {ortalama !== null && (
            <button onClick={() => setSekme('yorumlar')} className="flex items-center gap-2 mt-2 text-sm text-gray-600 hover:text-[#BA4700] w-fit">
              <Yildizlar puan={ortalama} /> {ortalama.toFixed(1)} · {reviews.length} yorum
            </button>
          )}

          {/* Fiyat */}
          <div className="mt-5">
            {hasPrice ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className={`text-4xl font-extrabold tracking-tight ${product.campaign ? 'text-red-600' : 'text-[#141B2D]'}`}>{fiyat(gecerliFiyat)}</span>
                  {product.campaign && <span className="text-lg text-gray-400 line-through">{fiyat(product.price)}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">KDV dahil · Kargo karşı ödemeli</p>
              </>
            ) : (
              <p className="text-lg font-bold text-gray-700">Fiyat belirleniyor</p>
            )}
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-gray-600 line-clamp-4">{product.description}</p>
          {product.description && product.description.length > 220 && (
            <button onClick={() => { setSekme('aciklama'); document.getElementById('urun-sekmeler')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-1 text-sm font-semibold text-[#BA4700] w-fit">
              Devamını oku
            </button>
          )}

          {/* Satın alma */}
          <div className="mt-6">
            {hasPrice && inStock ? (
              <div className="flex gap-3">
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden shrink-0">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-100" aria-label="Azalt"><LuMinus size={16} /></button>
                  <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))} className="w-11 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-100" aria-label="Arttır"><LuPlus size={16} /></button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${added ? 'bg-green-600' : 'bg-[#CC4E00] hover:bg-[#A63F00]'}`}
                >
                  {added ? <><LuCheck size={18} /> Sepete eklendi</> : <><LuShoppingCart size={18} /> Sepete Ekle</>}
                </button>
              </div>
            ) : !inStock ? (
              <PreOrderForm productId={product.id} productName={product.name} />
            ) : (
              <button disabled className="w-full h-12 bg-gray-100 text-gray-500 rounded-xl font-bold cursor-not-allowed">Fiyat belirlenince satışa açılacak</button>
            )}
            {added && (
              <Link href="/sepet" className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-[#BA4700] hover:text-[#8F3700]">
                Sepete git <LuChevronRight size={16} />
              </Link>
            )}
            {hasPrice && inStock && product.quantity <= 5 && (
              <p className="mt-2 text-xs font-semibold text-[#BA4700]">Son {product.quantity} adet</p>
            )}
          </div>

          {/* Güvence rozetleri - her biri doğrulanabilir bilgi */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {GUVENCELER.map(({ Icon, baslik, alt }) => (
              <div key={baslik} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-[#FAFAF9] p-3">
                <Icon size={22} className="text-[#E8620C] shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 leading-tight">{baslik}</p>
                  <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{alt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SEKMELER ─── */}
      <section id="urun-sekmeler" className="max-w-screen-xl mx-auto px-4 pb-10 scroll-mt-40">
        <div role="tablist" className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {sekmeler.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={sekme === s.id}
              onClick={() => setSekme(s.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${sekme === s.id ? 'border-[#CC4E00] text-[#BA4700]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {s.ad}
            </button>
          ))}
        </div>

        <div className="pt-6 max-w-4xl">
          <div role="tabpanel" hidden={sekme !== 'aciklama'} className="space-y-4 text-[15px] leading-7 text-gray-700">
            <p className="whitespace-pre-line">{product.description}</p>
            <p className="rounded-xl bg-[#FDF1E7] border border-orange-100 px-4 py-3 text-sm text-gray-700">
              Bu ürün, Adalet Bakanlığı işyurtlarındaki meslek eğitim atölyelerinde hükümlülerin el emeğiyle üretilmiştir.
            </p>
          </div>

          {product.ozellikler && product.ozellikler.length > 0 && (
            <div role="tabpanel" hidden={sekme !== 'ozellikler'}>
              <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                {product.ozellikler.map((o) => (
                  <div key={o.ad} className="flex gap-4 px-4 py-3 text-sm odd:bg-[#FAFAF9]">
                    <dt className="w-40 shrink-0 text-gray-500">{o.ad}</dt>
                    <dd className="flex-1 font-medium text-gray-900">{o.deger}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div role="tabpanel" hidden={sekme !== 'teslimat'} className="space-y-3 text-[15px] leading-7 text-gray-700">
            <p><strong className="text-gray-900">Kargo:</strong> Gönderiler karşı ödemeli yapılır. Kargo ücreti sipariş toplamına dahil değildir, teslimat sırasında kargo firmasına ödenir.</p>
            <p><strong className="text-gray-900">Sipariş takibi:</strong> Siparişiniz kargoya verildiğinde takip numarası Siparişlerim sayfasında görünür.</p>
            <p><strong className="text-gray-900">Cayma hakkı:</strong> Ürünü teslim aldığınız tarihten itibaren 14 gün içinde hiçbir gerekçe göstermeden iade edebilirsiniz.</p>
            <Link href="/teslimat-iade-sartlari" className="inline-flex items-center gap-1 text-sm font-semibold text-[#BA4700] hover:text-[#8F3700]">
              Teslimat ve iade şartlarının tamamı <LuChevronRight size={16} />
            </Link>
          </div>

          <div role="tabpanel" hidden={sekme !== 'yorumlar'}>
            {reviewsLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC4E00]" /></div>
            ) : ortalama === null ? (
              <p className="text-gray-600 py-4">Bu ürün için henüz yorum yok.</p>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{ortalama.toFixed(1)}</span>
                  <div>
                    <Yildizlar puan={ortalama} boyut={18} />
                    <p className="text-sm text-gray-500 mt-1">{reviews.length} müşteri yorumu</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-orange-100 text-[#BA4700] font-bold text-sm flex items-center justify-center">{r.user.name.charAt(0)}</span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{r.user.name}</p>
                            <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                        <Yildizlar puan={r.rating} />
                      </div>
                      {r.title && <p className="font-semibold text-gray-900 text-sm mb-1">{r.title}</p>}
                      <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {reviewMesaji && (
              <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${reviewMesaji.tur === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {reviewMesaji.metin}
              </div>
            )}

            <div className="mt-6 rounded-xl bg-[#FDF1E7] border border-orange-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-gray-700">
                {musteri ? 'Bu ürünü satın aldıysanız deneyiminizi paylaşın.' : 'Yorum yazmak için giriş yapın. Yalnızca satın aldığınız ürünlere yorum yazabilirsiniz.'}
              </p>
              {musteri ? (
                <button onClick={() => { setReviewMesaji(null); setReviewFormOpen(true); }} className="shrink-0 bg-[#CC4E00] hover:bg-[#A63F00] text-white px-5 py-2.5 rounded-lg text-sm font-semibold">Yorum Yaz</button>
              ) : (
                <Link href={`/giris?devam=/urun/${slug}`} className="shrink-0 bg-[#CC4E00] hover:bg-[#A63F00] text-white px-5 py-2.5 rounded-lg text-sm font-semibold text-center">Giriş Yap</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {benzerUrunler.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Benzer Ürünler</h2>
            <Link href={`/${product.category.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#BA4700] hover:text-[#8F3700]">
              Tümünü Gör <LuChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {benzerUrunler.map((u) => (
              <UrunKarti key={u.id} urun={u} kompakt favoriButonu={false} gorselArkaPlani="from-[#F6EFE6] to-[#EFE4D6]" gorselYuksekligi="h-36 md:h-44" gorselBoyutlari="(max-width: 768px) 50vw, 25vw" />
            ))}
          </div>
        </section>
      )}

      {reviewFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ürün Yorumu Yaz</h3>
            <div className="space-y-4">
              <div className="flex gap-1" role="radiogroup" aria-label="Puan">
                {[1, 2, 3, 4, 5].map((y) => (
                  <button key={y} onClick={() => setReviewForm({ ...reviewForm, rating: y })} aria-label={`${y} yıldız`}>
                    <LuStar size={30} className={y <= reviewForm.rating ? 'text-[#E8620C] fill-[#E8620C]' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
              <input type="text" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} placeholder="Başlık (isteğe bağlı)" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#CC4E00]" />
              <textarea value={reviewForm.text} onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })} placeholder="Ürünle ilgili deneyiminiz (en az 10 karakter)" rows={4} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#CC4E00]" />
              {reviewMesaji?.tur === 'hata' && <p className="text-sm text-red-600">{reviewMesaji.metin}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setReviewFormOpen(false); setReviewForm({ rating: 5, title: '', text: '' }); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg">İptal</button>
                <button onClick={yorumGonder} disabled={submittingReview} className="flex-1 bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white font-medium py-2.5 rounded-lg">
                  {submittingReview ? 'Gönderiliyor...' : 'Yorumu Gönder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobilde sabit satın alma çubuğu (alt gezinmenin üstünde) */}
      {hasPrice && inStock && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <div className="min-w-0 flex-1">
            {product.campaign && <p className="text-[11px] text-gray-400 line-through leading-none">{fiyat(product.price)}</p>}
            <p className={`text-lg font-bold leading-tight ${product.campaign ? 'text-red-600' : 'text-[#141B2D]'}`}>{fiyat(gecerliFiyat)}</p>
            <p className="text-[10px] text-gray-500 leading-none">KDV dahil · Kargo karşı ödemeli</p>
          </div>
          <button onClick={handleAddToCart} className={`shrink-0 px-6 py-3 rounded-xl font-semibold text-white transition-colors ${added ? 'bg-green-600' : 'bg-[#CC4E00] hover:bg-[#A63F00]'}`}>
            {added ? 'Sepete eklendi' : 'Sepete Ekle'}
          </button>
        </div>
      )}
      <div className="h-20 md:h-0" />
    </div>
  );
}
