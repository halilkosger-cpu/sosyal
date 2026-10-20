import { NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { SITE_URL } from '@/lib/seo';
import { GORSELLI_URUN } from '@/lib/urun-gorunurluk';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 saat önbellek

function xmlEscape(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        ...GORSELLI_URUN,
        price: { gt: 0 }, // Google Merchant fiyatsız ürün kabul etmez
      },
      include: {
        category: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const itemsXml = products
      .map((p) => {
        const link = `${SITE_URL}/urun/${p.slug}`;
        const title = xmlEscape(p.name);
        const description = xmlEscape(
          p.description ||
            `${p.name} - Adalet Bakanlığı İşyurtları atölyelerinde hükümlülerin el emeğiyle üretilen doğal ve kaliteli ürün.`
        );
        const categoryName = xmlEscape(p.category?.name || 'Genel');
        const price = `${Number(p.price).toFixed(2)} TRY`;
        const availability = p.quantity > 0 ? 'in_stock' : 'out_of_stock';
        const imageUrl = xmlEscape(p.imageUrl || `${SITE_URL}/logo.jpg`);

        return `    <item>
      <g:id>${p.id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>İşyurtları</g:brand>
      <g:product_type>${categoryName}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>İsyurtları Online Mağaza</title>
    <link>${SITE_URL}</link>
    <description>Adalet Bakanlığı İşyurtları atölyelerinde üretilen el emeği ve doğal ürünler kataloğu</description>
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Google Merchant feed generation error:', error);
    return new NextResponse('Error generating feed', { status: 500 });
  }
}
