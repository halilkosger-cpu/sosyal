import { NextResponse } from 'next/server';
import { sitemapGirdileri } from '@/lib/sitemap-veri';

export const dynamic = 'force-dynamic';

/**
 * sitemap.xml
 *
 * Metadata rotasi (app/sitemap.ts) yanit basligini Vercel'de eziyor ve her
 * bot taramasi bir fonksiyon cagrisi harciyordu. Route handler basligi
 * kendisi koydugu icin CDN bir saat onbellekliyor (google-merchant.xml ile ayni).
 * Icerik hala veritabanindan uretiliyor; yeni urun en gec bir saat sonra girer.
 */
function xmlKacir(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const girdiler = await sitemapGirdileri();
    const govde = girdiler
      .map((g) => {
        const son = g.lastModified ? new Date(g.lastModified).toISOString() : null;
        return `  <url>
    <loc>${xmlKacir(g.url)}</loc>${son ? `\n    <lastmod>${son}</lastmod>` : ''}${g.changeFrequency ? `\n    <changefreq>${g.changeFrequency}</changefreq>` : ''}${typeof g.priority === 'number' ? `\n    <priority>${g.priority}</priority>` : ''}
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${govde}
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (hata) {
    console.error('Sitemap uretim hatasi:', hata);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
