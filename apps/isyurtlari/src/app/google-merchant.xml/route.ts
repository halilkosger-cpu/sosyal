import { NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { SITE_URL } from '@/lib/seo';
import { GORSELLI_URUN } from '@/lib/urun-gorunurluk';
import { urunGorseli } from '@/lib/urun-gorsel';
import { KASIM_KAMPANYASI_AKTIF, KASIM_INDIRIM_ORANI } from '@/lib/fiyat';

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
        const normalFiyat = Number(p.price);
        const price = `${normalFiyat.toFixed(2)} TRY`;

        // sale_price bilerek yok: indirim sepette uygulaniyor, urun sayfasi tam fiyati gosteriyor.
        // Google sayfa ile feed fiyati uyusmazsa urunu reddediyor; indirim Merchant Center Promosyonlar'dan tanitiliyor.
        const customLabelXml =
          KASIM_KAMPANYASI_AKTIF && KASIM_INDIRIM_ORANI > 0
            ? `\n      <g:custom_label_0>Efsane Kasim %10 Indirim</g:custom_label_0>`
            : '';

        const availability = p.quantity > 0 ? 'in_stock' : 'out_of_stock';
        
        const yerelGorsel = urunGorseli(p.slug, p.imageUrl);
        let tamGorselUrl = `${SITE_URL}/logo.jpg`;
        if (yerelGorsel) {
          tamGorselUrl = yerelGorsel.startsWith('http') ? yerelGorsel : `${SITE_URL}${yerelGorsel}`;
        }
        const imageUrl = xmlEscape(tamGorselUrl);

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
      <g:product_type>${categoryName}</g:product_type>${customLabelXml}
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
