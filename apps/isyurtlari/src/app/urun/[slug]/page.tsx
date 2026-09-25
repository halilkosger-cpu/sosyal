import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@isyurtlari/database';
import ProductDetailClient from './ProductDetailClient';
import { varsayilanSirala } from '@/lib/urun-siralama';
import { GORSELLI_URUN, gorselliMi } from '@/lib/urun-gorunurluk';
import { yerelGorselVar } from '@/lib/urun-gorsel';
import {
  SITE_URL,
  absoluteUrl,
  breadcrumbJsonLd,
  defaultOpenGraphImage,
  hasDatabaseUrl,
  truncate,
} from '@/lib/seo';

/**
 * Ürün sayfaları da ISR ile saklanıyor; gerekçe ana sayfadakiyle aynı.
 *
 * Stok ve fiyat yapısal veride (Product/Offer) yer aldığı için tazelenmesi
 * önemli: yönetim panelindeki her değişiklik icerikTazele() ile bu rotayı
 * da düşürüyor, yani beş dakika yalnızca hiçbir değişiklik olmadığında
 * geçerli bir üst sınır.
 */
export const revalidate = 300;

/**
 * Ürünler derleme anında biliniyor; sayfaları önceden üretiliyor.
 * dynamicParams varsayılan olarak açık: sonradan eklenen ürün ilk istekte
 * üretilir, 404 vermez.
 */
export async function generateStaticParams() {
  if (!hasDatabaseUrl()) return [];
  try {
    // Fotografsiz urunler onceden uretilmiyor; bkz. lib/urun-gorunurluk.ts.
    const urunler = await prisma.product.findMany({
      where: GORSELLI_URUN,
      select: { slug: true },
    });
    return urunler.map((u) => ({ slug: u.slug }));
  } catch (error) {
    console.error('Ürün slug listesi alınamadı:', error);
    return [];
  }
}

type ProductPageProps = {
  params: {
    slug: string;
  };
};

/**
 * Urunu getirir. `yok` yalnizca sorgu basarili olup kayit bulunamadigini
 * belirtir; veritabanina hic ulasilamadiysa `erisilemedi` doner.
 *
 * Ayrim onemli: her iki durumda da null dondurulseydi, gecici bir baglanti
 * hatasi butun urun sayfalarina 404 verdirir ve Google bunlari indeksten
 * dusurebilirdi.
 */
type UrunSonucu =
  | { durum: 'bulundu'; urun: NonNullable<Awaited<ReturnType<typeof urunuSorgula>>> }
  | { durum: 'yok' }
  | { durum: 'erisilemedi' };

const urunuSorgula = (slug: string) =>
  prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        where: { approved: true },
        select: { rating: true },
      },
    },
  });

const getProduct = async (slug: string): Promise<UrunSonucu> => {
  if (!hasDatabaseUrl()) return { durum: 'erisilemedi' };

  try {
    const urun = await urunuSorgula(slug);
    return urun ? { durum: 'bulundu', urun } : { durum: 'yok' };
  } catch (error) {
    console.error('Product query error:', error);
    return { durum: 'erisilemedi' };
  }
};

/**
 * Paylasim ve schema.org gorseli.
 *
 * Bir urunun fotografi iki yerde olabiliyor: veritabanindaki imageUrl ya
 * da public/urun/ altindaki yerel surumler (bkz. lib/urun-gorsel.ts).
 * Burada yerel surum once geliyor; hem daha kucuk hem de resmi galeriden
 * gelen 12 urunun imageUrl'i bos. Yerelde 1024 piksellik surum seciliyor:
 * WhatsApp ve Twitter onizlemesi 800'den kucuk gorseli kirpiyordu.
 */
const getProductImage = (slug: string, imageUrl?: string | null) => {
  if (yerelGorselVar(slug)) return absoluteUrl(`/urun/${slug}-1024.webp`);
  return imageUrl ? absoluteUrl(imageUrl) : defaultOpenGraphImage;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const sonuc = await getProduct(params.slug);

  if (sonuc.durum !== 'bulundu') {
    // Bu metadata yalnizca `erisilemedi` durumunda kullaniliyor: `yok`
    // durumunda notFound() firlatiliyor ve Next rotanin metadata'sini atip
    // not-found ekranini kendi noindex etiketiyle donduruyor (olculdu).
    //
    // Veritabanina ulasilamadigi anda sayfa yine de render ediliyor; o haliyle
    // indekslenmemeli ve kendine canonical vermemeli. canonical: null kok
    // layout'tan miras kalan adresi de kaldiriyor.
    return {
      title: 'Ürün Bulunamadı',
      description: 'Aradığınız ürün bulunamadı.',
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    };
  }

  const product = sonuc.urun;

  const canonical = absoluteUrl(`/urun/${product.slug}`);
  const image = getProductImage(product.slug, product.imageUrl);
  const description = truncate(product.description);
  /**
   * Eskiden her urunun aciklamasina "- Cezaevi hukumlusu tarafindan el
   * yapimi, dogal urun." ekleniyordu. Katalog buyuyunce ikisi de her urun
   * icin dogru olmaktan cikti: parfum ve kolonya seri dolum sisede
   * geliyor, yuzey temizleyicinin etiketinde kimyasal bilesim yaziyor.
   * Ek artik yalnizca dogrulanabilir olani soyluyor.
   */
  const enrichedDescription = `${description} Adalet Bakanlığı İşyurtları atölyelerinde üretiliyor.`;
  const enrichedTitle = `${product.name} | İsyurtları - Cezaevi Ürünü`;

  return {
    title: enrichedTitle,
    description: enrichedDescription,
    keywords: [
      product.name,
      'işyurtları',
      'cezaevi ürünü',
      'hapishane ürünü',
      'işyurtları ürünü',
      product.category.name.toLowerCase(),
    ],
    alternates: {
      canonical,
    },
    // Fotografsiz urun sayfasi hicbir listede gorunmuyor ve sitemap'te de
    // yok; eski baglantilar calismaya devam etsin diye 404 vermiyoruz ama
    // Google'a indekslememesini soyluyoruz. Fotograf yuklendigi anda bu
    // etiket kendiliginden kalkiyor. Bkz. lib/urun-gorunurluk.ts.
    ...(gorselliMi(product) ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title: enrichedTitle,
      description: enrichedDescription,
      url: canonical,
      type: 'website',
      locale: 'tr_TR',
      images: [{ url: image, width: 1200, height: 630, alt: `${product.name} - Cezaevi Ürünü` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: enrichedTitle,
      description: enrichedDescription,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const sonuc = await getProduct(params.slug);

  // Silinmis urun icin "Urun bulunamadi" ekrani HTTP 200 ile donuyordu. Google
  // bunu "soft 404" sayar: adres indekste kalir ve tarama butcesi bosa gider.
  // notFound() gercek 404 dondurur.
  //
  // Veritabanina ulasilamadigi durumda 404 DONULMUYOR: gecici bir arizada tum
  // urunleri indeksten dusurmek, hata sayfasi gostermekten cok daha pahaliya
  // mal olurdu.
  if (sonuc.durum === 'yok') {
    notFound();
  }

  const product = sonuc.durum === 'bulundu' ? sonuc.urun : null;

  const productJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${absoluteUrl(`/urun/${product.slug}`)}#product`,
        name: product.name,
        description: truncate(product.description, 500),
        image: [getProductImage(product.slug, product.imageUrl)],
        sku: product.slug,
        category: product.category.name,
        brand: {
          '@type': 'Brand',
          name: 'İsyurtları',
          description: 'Cezaevi ve hapishane hükümlülerinin el emeğiyle ürettiği doğal ürünler',
        },
        // Fiyati girilmemis urunlerde `offers` hic yazilmiyor.
        //
        // Onceden price alani "0.00" olarak gonderiliyordu; urunlerin 48'inin
        // fiyati henuz girilmedigi icin sitedeki Product isaretlemelerinin
        // cogu bu haldeydi. Google sifir fiyatli bir teklifi gecersiz sayar ve
        // o sayfalarin zengin sonuc hakki duser. Teklifsiz Product ise gecerli
        // bir isaretlemedir; fiyat girilince teklif kendiliginden geri gelir.
        ...(product.price > 0
          ? {
              offers: {
                '@type': 'Offer',
                url: absoluteUrl(`/urun/${product.slug}`),
                priceCurrency: 'TRY',
                price: product.price.toFixed(2),
                availability:
                  product.quantity > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                itemCondition: 'https://schema.org/NewCondition',
                // Organization dugumunun kimligiyle BIREBIR ayni olmali; lib/seo.ts
                // onu `${SITE_URL}/#organization` olarak yaziyor. absoluteUrl('/')
                // sondaki egik cizgiyi dusurdugu icin burada SITE_URL kullaniliyor,
                // yoksa referans hicbir dugume baglanmazdi.
                seller: { '@id': `${SITE_URL}/#organization` },

                /**
                 * Iade kosullari.
                 *
                 * Degerler uydurulmadi; sitenin kendi metninden geliyor
                 * (/teslimat-iade-sartlari): "teslim tarihinden itibaren 14
                 * gun icinde hicbir neden belirtmeksizin iade edebilirsiniz".
                 * lib/iade.ts'teki CAYMA_GUN de ayni sayiyi kullaniyor.
                 *
                 * returnFees BILEREK YAZILMIYOR: iade kargo bedelini kimin
                 * odedigi sayfa metninde net degil. Bilmedigimiz bir sarti
                 * arama motoruna beyan etmektense alani hic yazmamak dogru -
                 * yanlis beyan, musteriye verilmis bir soz gibi degerlendirilir.
                 *
                 * priceValidUntil de yok: fiyatlarin bir bitis tarihi yok ve
                 * uydurma bir tarih yazmak "bu fiyat su tarihe kadar gecerli"
                 * demek olurdu. Google bunu uyari olarak isaretler, hata
                 * olarak degil.
                 */
                hasMerchantReturnPolicy: {
                  '@type': 'MerchantReturnPolicy',
                  applicableCountry: 'TR',
                  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                  merchantReturnDays: 14,
                  returnMethod: 'https://schema.org/ReturnByMail',
                },
              },
            }
          : {}),
        ...(product.reviews.length > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: (
                  product.reviews.reduce((sum, review) => sum + review.rating, 0) /
                  product.reviews.length
                ).toFixed(1),
                reviewCount: product.reviews.length,
              },
            }
          : {}),
      }
    : null;

  // Client bileseni ilk render'da dolu gelsin diye sunucudan cekilen urunu
  // aktariyoruz. Boylece urun adi, aciklamasi ve <h1> sunucu HTML'inde yer
  // aliyor; onceden yalnizca yukleme animasyonu render ediliyordu.
  const baslangicUrun = product
    ? {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        imageUrl: product.imageUrl ?? undefined,
        category: { name: product.category.name, slug: product.category.slug },
      }
    : null;

  /**
   * Benzer urunler: ayni kategoriden, fotografli, once satin alinabilir
   * olanlar. Sunucuda cekiliyor ki baglantilar HTML'de olsun (ic linkleme).
   * Veritabani hatasi sayfayi dusurmesin diye ayri try/catch.
   */
  let benzerUrunler: {
    id: string; name: string; slug: string; price: number; quantity: number;
    imageUrl?: string; category: { name: string; slug: string };
  }[] = [];
  if (product) {
    try {
      const adaylar = await prisma.product.findMany({
        where: { categoryId: product.categoryId, id: { not: product.id }, imageUrl: { not: null } },
        select: {
          id: true, name: true, slug: true, price: true, quantity: true, imageUrl: true, createdAt: true,
          category: { select: { name: true, slug: true } },
        },
        take: 24,
      });
      benzerUrunler = varsayilanSirala(adaylar).slice(0, 4).map((u) => ({
        id: u.id, name: u.name, slug: u.slug, price: u.price, quantity: u.quantity,
        imageUrl: u.imageUrl ?? undefined, category: u.category,
      }));
    } catch (error) {
      console.error('Benzer urunler alinamadi:', error);
    }
  }

  const jsonLd = [
    breadcrumbJsonLd([
      { name: 'Ana Sayfa', url: absoluteUrl('/') },
      {
        name: product?.category.name ?? 'Ürünler',
        url: product ? absoluteUrl(`/${product.category.slug}`) : absoluteUrl('/'),
      },
      {
        name: product?.name ?? 'Ürün',
        url: absoluteUrl(`/urun/${params.slug}`),
      },
    ]),
    ...(productJsonLd ? [productJsonLd] : []),
  ];

  return (
    <>
      <script
        id={`product-structured-data-${params.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient baslangicUrun={baslangicUrun} benzerUrunler={benzerUrunler} />
    </>
  );
}
