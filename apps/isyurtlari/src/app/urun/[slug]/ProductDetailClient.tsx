'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LuHouse, LuBadgeCheck, LuHeart } from 'react-icons/lu';
import FavoriteButton from '@/components/FavoriteButton';
import {
  IconProductOrigin,
  IconVocationalTraining,
  IconSocialContribution,
  IconCampaign,
  IconSuccess,
  IconEducationGoal,
  IconEmploymentSupport,
  IconReintegration,
  IconTransferInfo,
} from '@/components/Icons';

const categoryPurpose: Record<string, { purpose: string; trainingHours: number; skillDescription: string }> = {
  'gida-urunleri': { purpose: 'Beslenme & Aşçılık Eğitimi', trainingHours: 40, skillDescription: 'Profesyonel aşçılık ve beslenme bilgisi' },
  'tekstil-urunleri': { purpose: 'Derzillik Meslek Eğitimi', trainingHours: 48, skillDescription: 'Kumaş işleme ve dikiş becerisi' },
  'ahsap-urunler': { purpose: 'Marangozluk Eğitimi', trainingHours: 60, skillDescription: 'Ahşap işçiliği ve tasarım becerisi' },
  'dokuma': { purpose: 'Dokuma & Sanat Terapisi', trainingHours: 50, skillDescription: 'Geleneksel dokuma teknikleri' },
  'mobilya-urunleri': { purpose: 'Mobilya Tasarım Eğitimi', trainingHours: 65, skillDescription: 'Furniture tasarım ve üretim becerisi' },
  'demir-metal-urunleri': { purpose: 'Metal İşleri Eğitimi', trainingHours: 55, skillDescription: 'Metal işleri ve tornacılık becerisi' },
};

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
  category: { name: string; slug: string };
  campaign?: Campaign;
}

const productValues: Record<string, string[]> = {
  'zeytinyag': [
    'Doğal zeytinyağı - hiçbir kimyasal katkı veya rafine işlem yapılmadan',
    'Geleneksel soğuk presyon yöntemiyle el emeğiyle üretilmiştir',
    'Sosyal Giriş Beslenme Eğitimi Alan Hükümlüler Tarafından İşlenmiş',
    'Kar amacı gütmeden sosyal sorumluluk projesi kapsamında',
    'Her satın alma, hükümlülerin yeniden sosyal hayata kazanılmasına destek olur'
  ],
  'peynir': [
    'Saf ve pastörize sütünden geleneksel yöntemlerle yapılan peynir',
    'Hiçbir koruyucu madde, sentetik katkı veya boyar madde içermez',
    'Beslenme & Aşçılık Eğitimi Alan Hükümlüler Tarafından El Emeğiyle Üretildi',
    'Sosyal Giriş Onaylı Sosyal Girişim Ürünü',
    'Devlet garantili, doğal ve sağlıklı üretim sürecine sahip'
  ],
  'badem': [
    'Doğal ve taze badem - kimyasal pestisit veya katkı madde kullanılmadan',
    'Seçilmiş, temizlenmiş ve doğal yöntemlerle işlenmiştir',
    'Beslenme Eğitim Programı Katılımcıları Tarafından El Emeğiyle Hazırlanmış',
    'Kar amacı gütmeyen Sosyal Giriş sosyal projesi',
    'Her alışveriş, hükümlülerin rehabilitasyon ve reintegrasyon programlarını destekler'
  ],
  'pirinc': [
    'Kaliteli, temiz ve doğal pirinç - hiçbir kimyasal işlem yapılmaksızın',
    'Sosyal Giriş İşyurtlarında depolanan, kontrol edilen ürün',
    'Beslenme Eğitimi Alan Hükümlüler Tarafından Paketlenmiştir',
    'Kar amacı gütmeden sunulan kaliteli beslenme ürünü',
    'Devlet tarafından onaylanmış ve güvence altına alınan sosyal girişim'
  ],
  'tereyag': [
    'Doğal sütten üretilen, hiçbir yapay maddesi olmayan tereyağ',
    'Geleneksel yöntemlerle el emeğiyle üretilmiştir',
    'Beslenme & Aşçılık Eğitim Programının Başarılı Ürünü',
    'Sosyal Giriş Sosyal Sorumluluk Projesi',
    'Her satın alma doğal ve sağlıklı üretimi teşvik eder'
  ],
  'biber-receli': [
    'Seçilmiş, taze biber ve doğal şeker ile yapılan reçel',
    'Pestisite maruz kalmamış kaynaklardan el emeğiyle hazırlanmıştır',
    'Sosyal Giriş Beslenme Eğitim Program Mezunları Tarafından Yapılmış',
    'Koruyucu ve katkı madde kullanılmaksızın geleneksel yöntemle konserve edilmiş',
    'Devlet destekli sosyal girişim - her satın alma bireyin yeniden başlamasını sağlar'
  ],
  'findik': [
    'Kaliteli, taze ve doğal fındık - özel seçim ve temizlik işlemi yapılmış',
    'İşyurtlarında higienik koşullarda işlenen, kalite kontrol geçmiş ürün',
    'Beslenme Eğitimi Alan Hükümlüler Tarafından Hazırlanmıştır',
    'Pestisit ve kimyasal işlem olmaksızın doğal sunumu korunmuştur',
    'Kar amacı gütmeyen Sosyal Giriş Sosyal Girişimi'
  ],
  'havlu-beyaz': [
    'Doğal pamuk kumaştan dokumacılık eğitimi alan hükümlüler tarafından yapılan havlu',
    'Hiçbir sentetik boya veya zararlı kimyasal kullanılmadan renglendirilmiş',
    'Derzillik ve Tekstil Meslek Eğitim Programının Başarılı Ürünü',
    'Sosyal Giriş Onaylı - Sağlık ve Çevre Dostu Üretim',
    'El emeğinin göz kamaştırıcı sonucu, her kullanımda rehabilitasyon programını desteklersiniz'
  ],
  'ahsap-sandalye': [
    'Doğal ve seçilmiş ahşap kullanılarak Marangozluk Eğitim Alan Hükümlüler Tarafından Yapılan Sandalye',
    'Hiçbir sentetik boya veya toksik kimyasal sürü kullanılmamıştır, tamamen doğal işlenmedir',
    'Sosyal Giriş El Sanatları Programı - Yüksek Kalite Garantisi',
    'Çevre dostu, karbon ayakizi düşük, yerel üretim ürünü',
    'Her satın alma, çatılı ve sosyal yardım alan hükümlüyü destekler'
  ],
  'geleneksel-hali': [
    'Geleneksel dokuma tekniklerini kullanan Dokuma Terapisi Programı Katılımcıları Tarafından El Emeğiyle Yapılan Halı',
    'Doğal renklendirilmiş, sentetik boya ve kimyasal işlem uygulanmamış',
    'Sosyal Giriş Sosyal Girişimi - Sanat ve Terapi Programı Ürünü',
    'Her iplik, hükümlünün sanat terapisi ve rehabilitasyon sürecinin parçasıdır',
    'Devlet koruması altında, etik ve sosyal sorumluluk ilkesiyle üretilmiş'
  ],
};

const getProductValues = (slug: string): string[] => {
  return productValues[slug] || [
    'Sosyal Giriş Tarafından Onaylanmış El Yapımı Ürün',
    'Hiçbir Kimyasal Katkı Veya Yapay Madde İçermez',
    'Kar Amacı Gütmeden, Sosyal Sorumluluk İlkesiyle Üretilmiştir',
    'Hükümlülerin Meslek Eğitimi ve Rehabilitasyonunu Destekler',
    'Devlet Garantili - Her Satın Alma Yeniden Başlamaya Yardım Eder'
  ];
};

interface Review {
  id: string;
  rating: number;
  title?: string;
  text: string;
  user: { name: string; avatar?: string };
  createdAt: string;
  helpfulCount: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((res) => res.json())
      .then((data) => { setProduct(data?.id ? data : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setReviewsLoading(true);
    fetch(`/api/products/${slug}/reviews`)
      .then((res) => res.json())
      .then((data) => { setReviews(Array.isArray(data) ? data : []); setReviewsLoading(false); })
      .catch(() => setReviewsLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((i: { id: string }) => i.id === product.id);
    if (existing) { existing.quantity += quantity; }
    else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        slug: product.slug,
        imageUrl: product.imageUrl,
        campaign: product.campaign || null,
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 3000);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6000]" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4">
      <span className="text-6xl">😕</span>
      <p className="text-gray-600 font-medium">Ürün bulunamadı</p>
      <Link href="/" className="bg-[#FF6000] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e55500] transition-colors">
        Ana Sayfaya Dön
      </Link>
    </div>
  );

  const inStock = product.quantity > 0;
  const hasPrice = product.price > 0;

  return (
    <div className="store-shell">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#FF6000] flex items-center gap-1 transition-colors">
              <LuHouse size={14} strokeWidth={2} /> Ana Sayfa
            </Link>
            <span>/</span>
            <Link href={`/${product.category.slug}`} className="hover:text-[#FF6000] transition-colors">
              {product.category.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ─── IMAGE ─── */}
          <div className="store-card rounded-3xl overflow-hidden aspect-square flex items-center justify-center relative bg-gradient-to-br from-orange-50 to-slate-100">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <IconProductOrigin className="w-40 h-40 object-contain opacity-95" />
            )}
            {!inStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-red-500 text-white text-lg font-bold px-6 py-2 rounded-full">Tükendi</span>
              </div>
            )}
          </div>

          {/* ─── INFO ─── */}
          <div className="flex flex-col">

            {/* Category + stock */}
            <div className="flex items-center gap-3 mb-3">
              <Link
                href={`/${product.category.slug}`}
                className="bg-orange-100 text-[#FF6000] text-xs font-bold px-3 py-1 rounded-full hover:bg-orange-200 transition-colors"
              >
                {product.category.name}
              </Link>
              {inStock ? (
                <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Stokta
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Tükendi
                </span>
              )}
            </div>

            {/* Title + Favorite */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {product.name}
              </h1>
              <FavoriteButton productId={product.id} size="lg" />
            </div>

            {/* Description */}
            <p className="text-gray-500 leading-relaxed mb-6 text-sm">
              {product.description}
            </p>

            {/* Production Values */}
            <div className="bg-white border border-orange-200 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <IconSuccess className="w-8 h-8 object-contain" />
                <h3 className="font-bold text-gray-900">Üretim Değerleri & Güvence</h3>
              </div>
              <ul className="space-y-3">
                {getProductValues(slug).map((value, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-[#FF6000] font-bold text-lg leading-none mt-0.5">✓</span>
                    <span className="text-sm text-gray-700 leading-relaxed">{value}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Campaign Banner */}
            {product.campaign && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <IconCampaign className="w-9 h-9 object-contain" />
                  <h4 className="font-bold text-red-700">Kampanya: {product.campaign.name}</h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-red-600">%{product.campaign.discount}</span>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="line-through">₺{product.price.toFixed(2)}</span>
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      ₺{product.campaign.discountedPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Price box */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
              {hasPrice ? (
                <>
                  <p className="text-sm text-gray-400 mb-1">{product.campaign ? 'İndirimli Fiyat' : 'Fiyat'}</p>
                  <p className="text-4xl font-extrabold text-[#FF6000]">
                    ₺{product.campaign ? product.campaign.discountedPrice.toFixed(2) : product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">KDV dahil · Ücretsiz kargo</p>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-200 shadow-sm">
                    <IconTransferInfo className="w-9 h-9 object-contain" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">Fiyat Belirleniyor</p>
                    <p className="text-xs text-gray-400">Bu ürünün fiyatı yakında açıklanacak</p>
                  </div>
                </div>
              )}
            </div>

            {/* Add to cart */}
            {hasPrice && inStock ? (
              <div className="space-y-3">
                {/* Quantity */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium">Adet:</span>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg font-bold"
                    >−</button>
                    <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg font-bold"
                    >+</button>
                  </div>
                  <span className="text-xs text-gray-400">({product.quantity} adet mevcut)</span>
                </div>

                {/* Button */}
                {added ? (
                  <div className="w-full bg-green-500 text-white py-3.5 rounded-xl font-bold text-center flex items-center justify-center gap-2">
                    <LuBadgeCheck size={20} strokeWidth={2} /> Sepete Eklendi! Teşekkürler 🙏
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-[#FF6000] hover:bg-[#e55500] text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-base"
                  >
                    <LuHeart size={18} strokeWidth={2} /> Destekle ve Sepete Ekle
                  </button>
                )}

                <Link
                  href="/sepet"
                  className="w-full border-2 border-[#FF6000] text-[#FF6000] hover:bg-orange-50 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  Sepete Git →
                </Link>
              </div>
            ) : !inStock ? (
              <button disabled className="w-full bg-gray-200 text-gray-400 py-3.5 rounded-xl font-bold cursor-not-allowed">
                Stokta Yok
              </button>
            ) : (
              <button disabled className="w-full bg-gray-200 text-gray-400 py-3.5 rounded-xl font-bold cursor-not-allowed">
                Fiyat Bekleniyor
              </button>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { Icon: IconVocationalTraining, text: 'Meslek Eğitimi' },
                { Icon: IconSuccess,            text: 'Sosyal Giriş' },
                { Icon: IconSocialContribution, text: 'Sosyal Proje' },
              ].map(({ Icon, text }) => (
                <div key={text} className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col items-center gap-1.5 text-center shadow-sm">
                  <Icon className="w-9 h-9 object-contain" />
                  <span className="text-xs font-medium text-blue-900">{text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ─── MISSION & IMPACT SECTIONS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

          {/* Purpose section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                <IconVocationalTraining className="w-11 h-11 object-contain" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Bu Ürün Kimden Geliyor?</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                Bu ürün, <span className="font-semibold text-blue-900">{categoryPurpose[product.category.slug]?.purpose || 'Meslek Eğitimi'}</span> alan hükümlüler tarafından el emeğiyle üretilmiştir.
              </p>
              <div className="flex items-start gap-3 rounded-2xl bg-orange-50 border border-orange-200 p-3">
                <IconEducationGoal className="w-9 h-9 object-contain flex-shrink-0" />
                <p>
                  <span className="font-semibold">Eğitim Hedefi:</span> {categoryPurpose[product.category.slug]?.skillDescription || 'Profesyonel beceri geliştirme'}
                </p>
              </div>
              <p className="text-xs text-gray-600 italic border-l-4 border-blue-400 pl-3 mt-2">
                Her satın alma, bu bireyin yeniden başlama yolculuğuna ve topluma kazanılmasına direkt katkı sağlar.
              </p>
            </div>
          </div>

          {/* Impact section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                <IconSocialContribution className="w-11 h-11 object-contain" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Yardımın Nasıl Kullanılacak?</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              {[
                {
                  Icon: IconEducationGoal,
                  title: 'Eğitim Programı',
                  text: `${categoryPurpose[product.category.slug]?.trainingHours || 50} saat mesleki eğitime yatırım`,
                },
                {
                  Icon: IconEmploymentSupport,
                  title: 'İstihdam Desteği',
                  text: 'Yeniden başlayan bireyin iş arayışına destek',
                },
                {
                  Icon: IconReintegration,
                  title: 'Reentegrasyon',
                  text: 'Topluma başarılı dönüş için gerekli tüm destek',
                },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl bg-gray-50 border border-gray-200 p-3">
                  <Icon className="w-9 h-9 object-contain flex-shrink-0" />
                  <span><span className="font-semibold">{title}:</span> {text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ─── REVIEWS SECTION ─── */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6000]" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <p className="text-gray-600 mb-4">Bu ürün hakkında henüz yorum yapılmamış</p>
              <p className="text-sm text-gray-500">Bu ürünü satın aldıysanız ilk yorum yapan siz olabilirsiniz!</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                      </span>
                      <div className="flex gap-0.5">
                        {Array(Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)).fill(0).map((_, i) => (
                          <span key={i} className="text-2xl">⭐</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{reviews.length} müşteri yorumu</p>
                  </div>
                </div>

                {/* Rating breakdown */}
                <div className="space-y-2 max-w-xs">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter(r => r.rating === stars).length;
                    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 min-w-fit">{stars}★ ({count})</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#FF6000]" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews list */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF6000] to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {review.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{review.user.name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array(review.rating).fill(0).map((_, i) => (
                          <span key={i} className="text-lg">⭐</span>
                        ))}
                      </div>
                    </div>
                    {review.title && (
                      <p className="font-semibold text-gray-900 text-sm mb-2">{review.title}</p>
                    )}
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.text}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <button className="text-gray-500 hover:text-[#FF6000] font-medium transition-colors">
                        👍 Faydalı ({review.helpfulCount})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Review Form Modal */}
          {reviewFormOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Ürün Yorumu Yaz</h3>

                <div className="space-y-4">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Puan (1-5 ⭐)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className={`text-3xl transition ${star <= reviewForm.rating ? '⭐' : '☆'}`}
                        >
                          {star <= reviewForm.rating ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Başlık (İsteğe bağlı)</label>
                    <input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      placeholder="Ürün hakkındaki düşünceniz"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6000]"
                    />
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Yorumunuz *</label>
                    <textarea
                      value={reviewForm.text}
                      onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                      placeholder="Ürünü kullanarak yaşadığınız deneyimi paylaşın..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6000]"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setReviewFormOpen(false);
                        setReviewForm({ rating: 5, title: '', text: '' });
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
                    >
                      İptal
                    </button>
                    <button
                      onClick={async () => {
                        if (!reviewForm.text.trim()) {
                          alert('Yorum metni boş olamaz');
                          return;
                        }
                        setSubmittingReview(true);
                        try {
                          const userId = localStorage.getItem('userId') || 'guest-' + Date.now();
                          const res = await fetch(`/api/products/${slug}/reviews`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId,
                              rating: reviewForm.rating,
                              title: reviewForm.title || null,
                              text: reviewForm.text,
                            }),
                          });

                          if (res.ok) {
                            alert('✅ Yorumunuz alındı! Admin onayı sonrasında yayımlanacak.');
                            setReviewFormOpen(false);
                            setReviewForm({ rating: 5, title: '', text: '' });
                          } else {
                            const error = await res.json();
                            alert('❌ ' + (error.error || 'Yorum gönderilemedi'));
                          }
                        } catch (error) {
                          alert('❌ Bir hata oluştu');
                        } finally {
                          setSubmittingReview(false);
                        }
                      }}
                      disabled={submittingReview}
                      className="flex-1 bg-[#FF6000] hover:bg-[#e55500] disabled:bg-orange-300 text-white font-medium py-2 rounded-lg transition"
                    >
                      {submittingReview ? 'Gönderiliyor...' : 'Yorumu Gönder'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Write review CTA */}
          <div className="mt-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-6 text-center">
            <h3 className="font-bold text-gray-900 mb-2">Siz de Yorum Yapın</h3>
            <p className="text-sm text-gray-600 mb-4">Bu ürünü satın aldıysanız deneyiminizi diğer müşterilerle paylaşın</p>
            <button
              onClick={() => setReviewFormOpen(true)}
              className="bg-[#FF6000] hover:bg-[#e55500] text-white px-6 py-2.5 rounded-xl font-medium transition inline-block"
            >
              Yorum Yaz ⭐
            </button>
          </div>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
