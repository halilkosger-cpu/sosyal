import type { Metadata } from 'next';
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

const getProduct = async (slug: string) => {
  if (!hasDatabaseUrl()) return null;

  try {
    return await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          where: { approved: true },
          select: { rating: true },
        },
      },
    });
  } catch (error) {
    console.error('Product metadata error:', error);
    return null;
  }
};

const getProductImage = (imageUrl?: string | null) =>
  imageUrl ? absoluteUrl(imageUrl) : defaultOpenGraphImage;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: 'Ürün Bulunamadı',
      description: 'Aradığınız ürün bulunamadı.',
      alternates: {
        canonical: absoluteUrl(`/urun/${params.slug}`),
      },
    };
  }

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
  const product = await getProduct(params.slug);

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
