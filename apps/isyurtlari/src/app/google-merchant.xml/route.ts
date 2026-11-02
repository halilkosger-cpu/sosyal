import { NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { SITE_URL } from '@/lib/seo';
import { GORSELLI_URUN } from '@/lib/urun-gorunurluk';
import { urunGorseli, yerelGorselVar } from '@/lib/urun-gorsel';
import { KASIM_KAMPANYASI_AKTIF, KASIM_INDIRIM_ORANI } from '@/lib/fiyat';
import { markaBul, FEED_OZELLESTIRMELERI } from '@/lib/marka';

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

// Kategori slug'ına göre Google Taksonomi ID eşleme
function googleKategoriId(slug?: string | null): number {
  switch (slug) {
    case 'gida':
      return 422; // Gıda, İçecek ve Tütün
    case 'temizlik':
      return 587; // Ev Temizlik Malzemeleri
    case 'hediyelik':
      return 632; // Ev ve Bahçe > Dekor
    case 'tekstil':
      return 1604; // Giyim ve Aksesuar
    case 'ahsap':
      return 632; // Ev ve Bahçe > Dekor
    default:
      return 422;
  }
}

// Zengin açıklama oluşturucu (Google ince/kopya içerik uyarısını önler)
function aciklamaOlustur(name: string, description?: string | null, catSlug?: string | null): string {
  if (description && description.trim().length > 30 && description.trim() !== name.trim()) {
    return description.trim();
  }

  switch (catSlug) {
    case 'gida':
      return `${name} - Adalet Bakanlığı İşyurtları atölye ve tarım işletmelerinde hükümlülerin el emeğiyle üretilmiş, katkısız ve taze gıda ürünü. Hijyenik koşullarda özenle paketlenmiştir.`;
    case 'temizlik':
      return `${name} - Adalet Bakanlığı İşyurtları bünyesinde üretilen, yüksek temizleme gücüne ve ferahlatıcı etkiye sahip kaliteli temizlik ve bakım ürünü.`;
    case 'hediyelik':
      return `${name} - İşyurtları bünyesindeki hükümlülerin usta ellerinde şekillenen, geleneksel motiflerle tek tek elde işlenmiş özel el sanatı hediyelik ürün.`;
    case 'tekstil':
      return `${name} - Adalet Bakanlığı İşyurtları tekstil atölyelerinde kaliteli malzeme ve özenli dikişle üretilen el emeği tekstil ürünü.`;
    case 'ahsap':
      return `${name} - İşyurtları ahşap ve marangozluk atölyelerinde usta işçilikle üretilmiş doğal ve dayanıklı el emeği ahşap ürün.`;
    default:
      return `${name} - Adalet Bakanlığı İşyurtları atölyelerinde hükümlülerin el emeğiyle özenle üretilen doğal ve kaliteli ürün.`;
  }
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
        const ozellestirme = FEED_OZELLESTIRMELERI[p.slug];
        const rawTitle = ozellestirme?.baslik || p.name;
        const title = xmlEscape(rawTitle);
        const brand = xmlEscape(ozellestirme?.marka || markaBul(rawTitle));
        const googleCat = googleKategoriId(p.category?.slug);
        const description = xmlEscape(aciklamaOlustur(rawTitle, p.description, p.category?.slug));
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

        // 404 hatasını önle: Gerçek görsel varsa onu ver, yoksa kategori/mağaza logosuna düş
        let tamGorselUrl = `${SITE_URL}/logo.jpg`;
        if (p.imageUrl?.startsWith('http')) {
          tamGorselUrl = p.imageUrl;
        } else if (yerelGorselVar(p.slug)) {
          tamGorselUrl = `${SITE_URL}${urunGorseli(p.slug)}`;
        } else if (p.imageUrl) {
          tamGorselUrl = `${SITE_URL}${p.imageUrl}`;
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
      <g:brand>${brand}</g:brand>
      <g:google_product_category>${googleCat}</g:google_product_category>
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
