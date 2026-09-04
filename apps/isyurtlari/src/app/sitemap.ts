import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { prisma } from '@isyurtlari/database';

/**
 * Sitemap her istekte veritabanindan uretilir.
 *
 * Varsayilan davranis derleme aninda bir kez uretip statik servis etmekti; bu
 * yuzden admin panelinden eklenen kategori ve urunler bir sonraki deploy'a
 * kadar sitemap'e girmiyordu. Icerik siteye deploy olmadan eklendigi icin bu
 * kabul edilemez.
 *
 * Once daha ucuz iki yol denendi, ikisi de calismadi:
 *  - `export const revalidate`: uretilen sitemap.xml.meta dosyasina hicbir
 *    revalidate degeri yazilmiyor, rota statik kalmaya devam ediyor.
 *  - `revalidatePath('/sitemap.xml')`: tam statik uretilen rotanin prerender
 *    kaydi olmadigi icin tazeleme bir sey yapmiyor (olculdu: damga degismedi).
 *
 * Maliyet dusuk: yanit CDN'de bir saat onbellekleniyor (next.config.js), yani
 * pratikte bolge basina saatte iki sorgu.
 */
export const dynamic = 'force-dynamic';

const hasDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  return url?.startsWith('postgresql://') || url?.startsWith('postgres://');
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/hakkimizda`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/bize-ulasin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/guvenli-alisveris`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/kvkk`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/gizlilik-sozlesmesi`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/mesafeli-satis-sozlesmesi`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/teslimat-iade-sartlari`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  if (!hasDatabaseUrl()) {
    return staticPages;
  }

  try {
    // Kategori sayfaları
    const categories = await prisma.productCategory.findMany({
      select: { slug: true, createdAt: true },
    });

    const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/${cat.slug}`,
      lastModified: cat.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Ürün detay sayfaları
    const products = await prisma.product.findMany({
      select: { slug: true, updatedAt: true, quantity: true },
      orderBy: { updatedAt: 'desc' },
    });

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/urun/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: product.quantity > 0 ? 0.7 : 0.5,
    }));

    return [...staticPages, ...categoryPages, ...productPages];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return staticPages;
  }
}
