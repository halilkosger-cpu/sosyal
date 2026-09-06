import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const now = new Date();
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        // Galeri ve özellikler. Boş olabilirler; ürün sayfası ikisini de
        // yoksa hiç çizmiyor.
        images: { orderBy: [{ sira: 'asc' }, { createdAt: 'asc' }] },
        attributes: { orderBy: [{ sira: 'asc' }, { ad: 'asc' }] },
        campaigns: {
          where: {
            campaign: { active: true, startDate: { lte: now }, endDate: { gte: now } },
          },
          include: { campaign: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    /**
     * Puan yalnızca ONAYLI yorumlardan.
     *
     * Ürün sayfası daha önce puanı istemcide, gelen yorum listesinden
     * hesaplıyordu; sunucudan gelen ortalama artık tek kaynak. Yorumu
     * olmayan üründe alan null dönüyor - kart da sayfa da o zaman puan
     * göstermiyor.
     */
    const puan = await prisma.review.aggregate({
      where: { productId: product.id, approved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const kampanya = product.campaigns[0];

    /**
     * Galeri: ana görsel her zaman başta.
     *
     * Product.imageUrl kart listelerinin, arama önerilerinin ve sipariş
     * e-postalarının okuduğu alan; galeri onun yerine geçmiyor, üstüne
     * ekliyor. Ana görsel galeriye ayrıca girilmişse iki kez çıkmasın diye
     * adresine göre teklenıyor.
     */
    const galeri = [
      ...(product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : []),
      ...product.images.map((g) => ({ url: g.url, alt: g.alt || product.name })),
    ].filter((g, i, hepsi) => hepsi.findIndex((x) => x.url === g.url) === i);

    return NextResponse.json({
      ...product,
      images: undefined,
      campaigns: undefined,
      galeri,
      ozellikler: product.attributes.map((o) => ({ ad: o.ad, deger: o.deger })),
      attributes: undefined,
      puan: puan._count._all > 0 ? Math.round((puan._avg.rating ?? 0) * 10) / 10 : null,
      yorumSayisi: puan._count._all,
      campaign: kampanya
        ? {
            id: kampanya.campaign.id,
            name: kampanya.campaign.name,
            discount: kampanya.discount,
            discountedPrice: Math.round(product.price * (1 - kampanya.discount / 100) * 100) / 100,
          }
        : null,
    });
  } catch (error) {
    console.error('Ürün yüklenirken hata:', error);
    return NextResponse.json({ error: 'Ürün yüklenemedi' }, { status: 500 });
  }
}
