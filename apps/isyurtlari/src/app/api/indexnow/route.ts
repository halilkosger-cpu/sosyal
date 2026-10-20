import { NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { SITE_URL } from '@/lib/seo';
import { GORSELLI_URUN } from '@/lib/urun-gorunurluk';

export const dynamic = 'force-dynamic';

const INDEXNOW_KEY = 'c133a8b46e3940188bb3e97017df8ef5';

export async function POST() {
  try {
    const [categories, products] = await Promise.all([
      prisma.productCategory.findMany({
        where: { products: { some: GORSELLI_URUN } },
        select: { slug: true },
      }),
      prisma.product.findMany({
        where: GORSELLI_URUN,
        select: { slug: true },
      }),
    ]);

    const urlList = [
      SITE_URL,
      `${SITE_URL}/hakkimizda`,
      `${SITE_URL}/bize-ulasin`,
      `${SITE_URL}/guvenli-alisveris`,
      ...categories.map((c) => `${SITE_URL}/${c.slug}`),
      ...products.map((p) => `${SITE_URL}/urun/${p.slug}`),
    ];

    // IndexNow API'ye gönder (Bing, Yahoo, Yandex, Naver)
    const payload = {
      host: 'isyurtlari.com.tr',
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: true,
      statusCode: res.status,
      submittedUrls: urlList.length,
      message: `${urlList.length} adet sayfa IndexNow (Bing, Yahoo, Yandex) servisine anında indeksleme için iletildi.`,
    });
  } catch (error: any) {
    console.error('IndexNow submission error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'IndexNow iletim hatası' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
