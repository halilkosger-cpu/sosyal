import { prisma } from '@isyurtlari/database';
import HomeClient from './HomeClient';
import { hasDatabaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

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
    <HomeClient
      baslangicKategoriler={kategoriler}
      baslangicUrunler={urunler}
      baslangicKampanyalar={kampanyalar}
    />
  );
}
