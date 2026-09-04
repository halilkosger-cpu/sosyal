import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@isyurtlari/database';
import ProductDetailClient from './ProductDetailClient';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  defaultOpenGraphImage,
  hasDatabaseUrl,
  truncate,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';

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

const getProductImage = (imageUrl?: string | null) =>
  imageUrl ? absoluteUrl(imageUrl) : defaultOpenGraphImage;

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
  const image = getProductImage(product.imageUrl);
  const description = truncate(product.description);
  const enrichedDescription = `${description} - Cezaevi hükümlüsü tarafından el yapımı, doğal ürün. İsyurtları sosyal girişim.`;
  const enrichedTitle = `${product.name} | İsyurtları - Cezaevi Ürünü`;

  return {
    title: enrichedTitle,
    description: enrichedDescription,
    keywords: [
      product.name,
      'işyurtları',
      'cezaevi ürünü',
      'hapishane ürünü',
      'el yapımı',
      'doğal ürün',
      'sosyal girişim',
      'rehabilitasyon destekli',
      product.category.name.toLowerCase(),
    ],
    alternates: {
      canonical,
    },
    openGraph: {
      title: enrichedTitle,
      description: enrichedDescription,
      url: canonical,
      type: 'website',
      locale: 'tr_TR',
      images: [{ url: image, width: 1200, height: 630, alt: `${product.name} - Cezaevi Sosyal Girişim Ürünü` }],
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
        image: [getProductImage(product.imageUrl)],
        sku: product.slug,
        category: product.category.name,
        brand: {
          '@type': 'Brand',
          name: 'İsyurtları - Cezaevi Sosyal Girişim',
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
      <ProductDetailClient baslangicUrun={baslangicUrun} />
    </>
  );
}
