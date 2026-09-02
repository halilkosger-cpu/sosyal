import type { Metadata } from 'next';
import { prisma } from '@isyurtlari/database';
import CategoryPageClient from './CategoryPageClient';
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  defaultOpenGraphImage,
  hasDatabaseUrl,
  truncate,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';

type CategoryPageProps = {
  params: {
    categorySlug: string;
  };
};

const getCategory = async (slug: string) => {
  if (!hasDatabaseUrl()) return null;

  try {
    return await prisma.productCategory.findUnique({
      where: { slug },
      select: {
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        products: {
          select: { id: true },
        },
      },
    });
  } catch (error) {
    console.error('Category metadata error:', error);
    return null;
  }
};

// Baslik yalnizca kategori adindan olusunca cok kisa kaliyordu ("Gıda
// Urunleri" = 13 karakter) ve arama sonucunda hicbir ayirt edici bilgi
// tasimiyordu. Kok layout zaten " | isyurtlari.com.tr" ekliyor, o yuzden
// marka adini burada tekrarlamiyoruz.
const getCategoryTitle = (categoryName: string) => {
  const taban = categoryName.toLocaleLowerCase('tr-TR').endsWith(' ürünleri')
    ? categoryName
    : `${categoryName} Ürünleri`;
  return `${taban} — Cezaevi El Emeği, Doğal ve El Yapımı`;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategory(params.categorySlug);
  const categoryName = category?.name ?? 'Ürünler';
  const title = getCategoryTitle(categoryName);
  const description = truncate(
    category?.description ||
      `${categoryName} kategorisindeki el emeği ürünleri keşfedin. Her alışveriş sosyal fayda ve meslek eğitimine destek olur.`
  );
  const canonical = absoluteUrl(`/${params.categorySlug}`);
  const image = category?.imageUrl ? absoluteUrl(category.imageUrl) : defaultOpenGraphImage;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonical,
      type: 'website',
      locale: 'tr_TR',
      images: [{ url: image, width: 1200, height: 630, alt: categoryName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategory(params.categorySlug);
  const categoryName = category?.name ?? 'Ürünler';
  const title = getCategoryTitle(categoryName);
  const canonical = absoluteUrl(`/${params.categorySlug}`);
  const jsonLd = [
    breadcrumbJsonLd([
      { name: 'Ana Sayfa', url: absoluteUrl('/') },
      { name: categoryName, url: canonical },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${canonical}#collection`,
      name: title,
      url: canonical,
      inLanguage: 'tr-TR',
      description:
        category?.description ||
        `${categoryName} kategorisindeki el emeği sosyal girişim ürünleri.`,
      numberOfItems: category?.products.length,
    },
  ];

  return (
    <>
      <script
        id={`category-structured-data-${params.categorySlug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryPageClient />
    </>
  );
}
