import { prisma } from '@isyurtlari/database';
import { GORSELLI_URUN } from '@/lib/urun-gorunurluk';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const hasDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  return url?.startsWith('postgresql://') || url?.startsWith('postgres://');
};

export async function GET() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json([]);
  }

  try {
    /**
     * Gosterilecek urunu kalmayan kategori dondurulmuyor.
     *
     * Bu uc ana sayfadaki kategori satirini besliyor. Suzulmediginde
     * baslik cubugu uc kategori, ana sayfa yedi kategori gosteriyordu ve
     * dorduyle bos sayfaya gidiliyordu. Ayni kural lib/kategoriler.ts ve
     * sitemap'te de uygulaniyor; bkz. lib/urun-gorunurluk.ts.
     */
    const categories = await prisma.productCategory.findMany({
      where: { products: { some: GORSELLI_URUN } },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Kategoriler yüklenirken hata:', error);
    return NextResponse.json(
      { error: 'Kategoriler yüklenemedi' },
      { status: 500 }
    );
  }
}
