import type { Metadata } from 'next';
import { prisma } from '@isyurtlari/database';
import HomeClient from './HomeClient';
import { SITE_NAME, absoluteUrl, defaultOpenGraphImage, hasDatabaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const SAYFA_BASLIGI = 'Cezaevi Ürünleri Online Satış Mağazası ve 2026 Fiyatları';
const SAYFA_ACIKLAMASI =
  'İşyurtları cezaevi ürünleri online satış kataloğu ve güncel fiyat listesi. ' +
  'En çok tercih edilen el emeği ürünlerin fiyatlarını inceleyin ve güvenle satın alın.';

/**
 * Ana sayfanin kendi basligi.
 *
 * Onceden ana sayfa kok layout'taki varsayilan basligi kullaniyordu. Baslik
 * `title.absolute` ile veriliyor: layout'ta "%s | isyurtlari.com.tr" sablonu
 * var, absolute olmasaydi site adi sonuna eklenip baslik uzayacakti.
 *
 * canonical bilerek yazilmadi; kok layout'tan '/' olarak miras aliniyor.
 */
export const metadata: Metadata = {
  title: { absolute: SAYFA_BASLIGI },
  description: SAYFA_ACIKLAMASI,
  openGraph: {
    title: SAYFA_BASLIGI,
    description: SAYFA_ACIKLAMASI,
    url: absoluteUrl('/'),
    siteName: SITE_NAME,
    type: 'website',
    locale: 'tr_TR',
    images: [{ url: defaultOpenGraphImage, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SAYFA_BASLIGI,
    description: SAYFA_ACIKLAMASI,
    images: [defaultOpenGraphImage],
  },
};

/**
 * Sikca sorulan sorular (FAQPage).
 *
 * Not: Google 2023'ten beri FAQ zengin sonuclarini yalnizca resmi kurum ve
 * saglik sitelerinde gosteriyor; bu isaretleme arama sonucunda acilir soru
 * listesi URETMEZ. Yine de gecerli bir isaretleme ve sayfanin ne hakkinda
 * oldugunu makinelere anlatiyor.
 *
 * Cevaplar sitenin gercek isleyisine gore yazildi: kargo karsi odemeli,
 * fiyatlar KDV dahil, kategoriler veritabanindan geliyor.
 */
const sssJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${absoluteUrl('/')}#sss`,
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Cezaevi satış mağazası fiyatları güncel mi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Evet. Ürün fiyatları mağaza yönetim panelinden güncellenir ve sitede anında ' +
          'yayınlanır; sayfada gördüğünüz tutar o anki geçerli fiyattır. Fiyatlar KDV ' +
          'dahil gösterilir. Fiyatı henüz belirlenmemiş ürünlerde tutar yerine ' +
          '"Fiyat belirleniyor" ifadesi yer alır ve bu ürünler sepete eklenemez.',
      },
    },
    {
      '@type': 'Question',
      name: 'İşyurtları online satış kargosu ne kadar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Gönderiler karşı ödemeli gönderilir. Kargo ücreti sipariş tutarına dahil ' +
          'değildir; teslimat sırasında doğrudan kargo firmasına ödenir. Tutar, kargo ' +
          'firmasının o günkü tarifesine ve teslimat adresine göre belirlenir. ' +
          'Siparişler Türkiye geneline gönderilir.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hangi kategorilerde cezaevi ürünleri var?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Gıda, tekstil, ahşap, hediyelik, temizlik ve kozmetik, sanat & zanaat ile ' +
          'peyzaj kategorilerinde ürün bulunmaktadır. Tüm ürünler Adalet Bakanlığı ' +
          'işyurtlarındaki meslek eğitim atölyelerinde hükümlülerin el emeğiyle ' +
          'üretilir. Kategoriler zaman zaman genişletilir; güncel listeyi sitenin üst ' +
          'menüsünden görebilirsiniz.',
      },
    },
  ],
};

/**
 * Ana sayfa verisi sunucuda cekiliyor.
 *
 * Onceden bu uc istek istemcide, useEffect icinde yapiliyordu; sonuc olarak
 * arama motorlari ve ilk boyama sirasinda sayfada urun bulunmuyordu, sadece
 * iskelet animasyonu vardi. Ayni veri burada cekilip HomeClient'a baslangic
 * degeri olarak gecirilince icerik sunucu HTML'ine giriyor.
 */
async function anaSayfaVerisi() {
  if (!hasDatabaseUrl()) return { kategoriler: null, urunler: null, kampanyalar: null };

  try {
    const now = new Date();

    const [kategoriler, urunler, kampanyalar] = await Promise.all([
      prisma.productCategory.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      prisma.product.findMany({
        take: 8,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaign.findMany({
        where: { active: true, startDate: { lte: now }, endDate: { gte: now } },
        include: {
          products: {
            include: { product: { include: { category: { select: { name: true, slug: true } } } } },
          },
        },
      }),
    ]);

    return {
      kategoriler,
      urunler: urunler.map((u) => ({
        id: u.id,
        name: u.name,
        slug: u.slug,
        price: u.price,
        quantity: u.quantity,
        imageUrl: u.imageUrl ?? undefined,
        category: { name: u.category.name, slug: u.category.slug },
      })),
      kampanyalar: kampanyalar.map((k) => ({
        id: k.id,
        name: k.name,
        products: k.products.map((kp) => ({
          productId: kp.productId,
          discount: kp.discount,
          product: {
            id: kp.product.id,
            name: kp.product.name,
            slug: kp.product.slug,
            price: kp.product.price,
            quantity: kp.product.quantity,
            imageUrl: kp.product.imageUrl ?? undefined,
            category: { name: kp.product.category.name, slug: kp.product.category.slug },
          },
        })),
      })),
    };
  } catch (error) {
    console.error('Ana sayfa verisi alinamadi:', error);
    return { kategoriler: null, urunler: null, kampanyalar: null };
  }
}

export default async function HomePage() {
  const { kategoriler, urunler, kampanyalar } = await anaSayfaVerisi();

  return (
    <>
      {/* Yapisal veri duz <script> ile veriliyor: next/script ile verildiginde
          gec yukleniyor ve sunucu HTML'inde bulunmuyordu. */}
      <script
        id="sss-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sssJsonLd) }}
      />
      <HomeClient
        baslangicKategoriler={kategoriler}
        baslangicUrunler={urunler}
        baslangicKampanyalar={kampanyalar}
      />
    </>
  );
}
