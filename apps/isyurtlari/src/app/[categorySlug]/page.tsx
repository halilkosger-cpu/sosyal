import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@isyurtlari/database';
import CategoryPageClient from './CategoryPageClient';
import { kategorileriGetir } from '@/lib/kategoriler';
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

const kategoriyiSorgula = (slug: string) =>
  prisma.productCategory.findUnique({
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

/**
 * Kategoriyi getirir. `yok` yalnizca sorgu basarili olup kayit bulunamadigini
 * belirtir; veritabanina hic ulasilamadiysa `erisilemedi` doner.
 *
 * Bu rota [categorySlug] oldugu icin sitedeki TUM ust seviye adresleri
 * yakaliyor. Ayrim yapilmasaydi gecici bir baglanti hatasi butun kategori
 * sayfalarina 404 verdirirdi.
 */
type KategoriSonucu =
  | { durum: 'bulundu'; kategori: NonNullable<Awaited<ReturnType<typeof kategoriyiSorgula>>> }
  | { durum: 'yok' }
  | { durum: 'erisilemedi' };

const getCategory = async (slug: string): Promise<KategoriSonucu> => {
  if (!hasDatabaseUrl()) return { durum: 'erisilemedi' };

  try {
    const kategori = await kategoriyiSorgula(slug);
    return kategori ? { durum: 'bulundu', kategori } : { durum: 'yok' };
  } catch (error) {
    console.error('Category query error:', error);
    return { durum: 'erisilemedi' };
  }
};

// Baslik yalnizca kategori adindan olusunca cok kisa kaliyordu ("Gıda
// Urunleri" = 13 karakter) ve arama sonucunda hicbir ayirt edici bilgi
// tasimiyordu. Kok layout zaten " | isyurtlari.com.tr" ekliyor, o yuzden
// marka adini burada tekrarlamiyoruz.
/**
 * Kategorideki urunleri sunucuda ceker. Onceden CategoryPageClient bunlari
 * useEffect icinde API'den aliyordu; sonuc olarak sunucu HTML'inde tek bir
 * urun adi bile bulunmuyordu, yalnizca iskelet animasyonu vardi.
 */
const getCategoryProducts = async (slug: string) => {
  if (!hasDatabaseUrl()) return null;

  try {
    const now = new Date();
    const urunler = await prisma.product.findMany({
      where: { category: { slug } },
      include: {
        category: { select: { name: true, slug: true } },
        campaigns: {
          where: { campaign: { active: true, startDate: { lte: now }, endDate: { gte: now } } },
          include: { campaign: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return urunler.map((u) => {
      // Not: indirim orani Campaign'de degil CampaignProduct uzerinde.
      const kp = u.campaigns[0];
      return {
        id: u.id,
        name: u.name,
        slug: u.slug,
        description: u.description,
        price: u.price,
        quantity: u.quantity,
        imageUrl: u.imageUrl ?? undefined,
        category: { name: u.category.name, slug: u.category.slug },
        ...(kp
          ? {
              campaign: {
                id: kp.campaign.id,
                name: kp.campaign.name,
                discount: kp.discount,
                discountedPrice: Math.round(u.price * (1 - kp.discount / 100) * 100) / 100,
              },
            }
          : {}),
      };
    });
  } catch (error) {
    console.error('Category products error:', error);
    return null;
  }
};

const getCategoryTitle = (categoryName: string) => {
  const taban = categoryName.toLocaleLowerCase('tr-TR').endsWith(' ürünleri')
    ? categoryName
    : `${categoryName} Ürünleri`;
  return `${taban} — Cezaevi El Emeği, Doğal ve El Yapımı`;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const sonuc = await getCategory(params.categorySlug);

  if (sonuc.durum !== 'bulundu') {
    // Olmayan kategori 404 donuyor; kendine isaret eden canonical uretmemeli.
    return {
      title: 'Kategori Bulunamadı',
      description: 'Aradığınız kategori bulunamadı.',
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    };
  }

  const category = sonuc.kategori;
  const categoryName = category.name;
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
  const [sonuc, urunler, kategoriler] = await Promise.all([
    getCategory(params.categorySlug),
    getCategoryProducts(params.categorySlug),
    kategorileriGetir(),
  ]);

  /**
   * Bu rota sitedeki tum ust seviye adresleri yakaliyor. Olmayan bir kategori
   * icin bos sayfa HTTP 200 ile donuyordu: /rastgele-bir-sey, /.env, eski her
   * bag "Ürünler Ürünleri" baslikli ayni bos sayfayi 200 ile veriyordu.
   *
   * Bu, sinirsiz sayida adres uretebilen bir soft 404'tu. Google bunlari
   * indeksleyebilir, hepsi ayni baslikla yinelenen icerik olurdu ve tarama
   * butcesi bosa giderdi.
   *
   * Veritabanina ulasilamadigi durumda 404 DONULMUYOR - gecici bir arizada
   * butun kategorileri indeksten dusurmek cok daha pahaliya mal olurdu.
   */
  if (sonuc.durum === 'yok') {
    notFound();
  }

  const category = sonuc.durum === 'bulundu' ? sonuc.kategori : null;
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
      <CategoryPageClient baslangicUrunler={urunler} kategoriler={kategoriler} />
    </>
  );
}
