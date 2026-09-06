import { prisma } from '@isyurtlari/database';
import HomeClient from './HomeClient';
import { absoluteUrl, hasDatabaseUrl } from '@/lib/seo';

/**
 * Ana sayfa her istekte yeniden üretilmiyor.
 *
 * `force-dynamic` her ziyarette üç veritabanı sorgusu demekti (kategoriler,
 * son ürünler, kampanyalar) - üstelik sitenin en çok ziyaret edilen
 * sayfasında. Katalog günde birkaç kez değişiyor, ziyaretçi sayısı üç ayda
 * %3000 arttı; bu takas artık mantıklı değil.
 *
 * Yönetim panelinden ürün, kategori, fiyat ya da kampanya değiştiğinde
 * icerikTazele() çağrılıyor (bkz. lib/kategoriler.ts) ve sayfa anında
 * tazeleniyor. Beş dakika bir gecikme değil, yalnızca üst sınır.
 */
export const revalidate = 300;

/**
 * Ana sayfanin basligi ve aciklamasi BILEREK kok layout'tan miras aliniyor.
 *
 * "Cezaevi Ürünleri Online Satış Mağazası ve 2026 Fiyatları" basligi hazirlandi
 * ama uygulanmadi. Iki sebep:
 *
 *  - Vaat tutmuyor. Baslik ve aciklama fiyat listesi vaat ediyor; 69 urunun
 *    48'inin (%70) fiyati girilmemis ve satin alinabilir urun sayisi 2.
 *    "fiyat" araması yapan ziyaretci sayfada fiyat bulamayip geri donerdi.
 *  - Marka adi basliktan tamamen cikiyordu. Site "işyurtları" aramalarinda ilk
 *    sirada; marka adini basliktan cikarmak o konumu riske atardi.
 *
 * Fiyatlar girildikten sonra marka adini koruyan bir surumle degistirilebilir:
 *   "Cezaevi Ürünleri Fiyatları | İsyurtları Online Satış Mağazası"
 */

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
