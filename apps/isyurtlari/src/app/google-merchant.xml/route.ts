import { NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { SITE_URL } from '@/lib/seo';
import { GORSELLI_URUN } from '@/lib/urun-gorunurluk';
import { urunGorseli, yerelGorselVar } from '@/lib/urun-gorsel';
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

// Ürün başlığından bilinen markayı tespit et
function markaBul(ad: string): string {
  const markalar = [
    'AK-CE',
    'Elban',
    'ADVEM',
    'Zenbay',
    'Toprakkale',
    'Odosun',
    'ADEMODA',
    'Espiye',
    'Niğde',
    'Kalkandere',
    'Tokat',
    'Adıyaman',
    'Elazığ',
    'Gaziantep',
  ];
  for (const m of markalar) {
    if (new RegExp(`(^|[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ])${m}([^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]|$)`, 'i').test(ad)) {
      return m;
    }
  }
  return 'İşyurtları';
}

interface FeedOzellestirme {
  baslik?: string;
  marka?: string;
}

// Jenerik veya eski ürünlerin Google Merchant için optimize edilmiş başlık ve markaları
const FEED_OZELLESTIRMELERI: Record<string, FeedOzellestirme> = {
  // Gıda
  'kavurma': {
    baslik: 'Elban Geleneksel Vakumlu Dana Kavurma 250 gr',
    marka: 'Elban',
  },
  'yesil-zeytin': {
    baslik: 'AK-CE Doğal Salamura Yeşil Zeytin 1000 gr',
    marka: 'AK-CE',
  },
  'siyah-zeytin': {
    baslik: 'AK-CE Doğal Gemlik Siyah Zeytin 1000 gr',
    marka: 'AK-CE',
  },
  'peynir': {
    baslik: 'Elban Tam Yağlı Beyaz Peynir 1000 gr',
    marka: 'Elban',
  },
  'tereyag': {
    baslik: 'Elban Geleneksel Köy Tereyağı 1000 gr',
    marka: 'Elban',
  },
  'cilek-receli': {
    baslik: 'Elban Geleneksel Çilek Reçeli 1000 gr',
    marka: 'Elban',
  },
  'zeytinyagi': {
    baslik: 'Elban Soğuk Sıkım Naturel Sızma Zeytinyağı 1 lt',
    marka: 'Elban',
  },
  'bal-ari-urunleri': {
    baslik: 'Elban Doğal Yayla Süzme Çiçek Balı 850 gr',
    marka: 'Elban',
  },
  'polen': {
    baslik: 'Elban Doğal Arı Poleni 250 gr',
    marka: 'Elban',
  },
  'domates-salcasi': {
    baslik: 'Elban Geleneksel Ev Tipi Domates Salçası 1000 gr',
    marka: 'Elban',
  },
  'biber-salcasi': {
    baslik: 'Elban Doğal Acı Biber Salçası 1000 gr',
    marka: 'Elban',
  },
  'biber-receli': {
    baslik: 'Elban Geleneksel Tatlı Biber Reçeli 420 gr',
    marka: 'Elban',
  },
  'incir-receli': {
    baslik: 'Elban Geleneksel İncir Reçeli 420 gr',
    marka: 'Elban',
  },
  'recel-cesitleri': {
    baslik: "Elban Karışık Geleneksel Reçel Paketi 3'lü",
    marka: 'Elban',
  },
  'kavala-kurabiyesi': {
    baslik: 'Elban Bademli Kavala Kurabiyesi 350 gr',
    marka: 'Elban',
  },
  'findik': {
    baslik: 'Espiye Doğal İç Fındık Kavrulmuş 250 gr',
    marka: 'Espiye',
  },
  'sari-uzum': {
    baslik: 'Elban Besni Sarı Kuru Üzüm 500 gr',
    marka: 'Elban',
  },
  'siyah-uzum': {
    baslik: 'Elban Doğal Siyah Kuru Çekirdeksiz Üzüm 500 gr',
    marka: 'Elban',
  },
  'pirinc': {
    baslik: 'Elban Baldo Pirinç 1 kg',
    marka: 'Elban',
  },
  'cekirdek': {
    baslik: 'Toprakkale Çifte Kavrulmuş Siyah Ayçekirdeği 250 gr',
    marka: 'Toprakkale',
  },
  'yogurt-4-kg-kovasi': {
    baslik: 'Foça Doğal Tava Yoğurdu 4 kg (Kova)',
    marka: 'İşyurtları',
  },
  'kahramanmaras-susamli-cubuk-450-gr': {
    baslik: 'Elban Kahramanmaraş Susamlı Tuzlu Çubuk 450 gr',
    marka: 'Elban',
  },
  'yoresel-kahramanmaras-coregi-450-gr': {
    baslik: 'Elban Yöresel Kahramanmaraş Çöreği 450 gr',
    marka: 'Elban',
  },
  'elazig-dut-kurusu-500-gr': {
    baslik: 'Elazığ Doğal Beyaz Dut Kurusu 500 gr',
    marka: 'Elazığ',
  },
  'elazig-gunkurusu-kayisi-500-gr': {
    baslik: 'Elazığ Doğal Günkurusu Kayısı 500 gr',
    marka: 'Elazığ',
  },

  // Temizlik & Kozmetik
  'el-kremi-beyaz-kavanoz': {
    baslik: 'ADVEM Doğal Gliserinli Nemlendirici El Kremi 150 ml',
    marka: 'ADVEM',
  },

  // Tekstil
  'el-dokumasi-namazlik': {
    baslik: 'ADEMODA İpek Dokulu Saçaklı El Dokuması Namazlık',
    marka: 'ADEMODA',
  },

  // Ahşap
  'ahsap-fici-kumbara': {
    baslik: 'İşyurtları El Yapımı Doğal Ahşap Fıçı Kumbara',
    marka: 'İşyurtları',
  },
  'ahsap-oyma-kutu': {
    baslik: 'İşyurtları Usta İşi El Oyması Ahşap Mücevher Kutusu',
    marka: 'İşyurtları',
  },

  // Hediyelik & El Sanatları
  'el-yapimi-porselen-cini-cay-seti': {
    baslik: 'Zenbay Kütahya El Yapımı Çini Porselen Çay Seti 6 Kişilik',
    marka: 'Zenbay',
  },
  'el-yapimi-cini-tabak': {
    baslik: 'Zenbay Kütahya Kadife Kutulu El Yapımı Çini Tabak 80 cm',
    marka: 'Zenbay',
  },
  'elazig-mermer-kosk-saat-kucuk': {
    baslik: 'Elazığ El Yapımı Doğal Mermer Köşk Masa Saati (Küçük Boy)',
    marka: 'Elazığ',
  },
  'elazig-mermer-islemeli-ahsap-kutu': {
    baslik: 'Elazığ Mermer İşlemeli Doğal Ahşap Kutu',
    marka: 'Elazığ',
  },
  'kutulu-cini-tabak-sari-desenli-kadife-kutu': {
    baslik: 'Zenbay Kütahya Kadife Kutulu Sarı Desenli Çini Tabak',
    marka: 'Zenbay',
  },
  'mermer-taraftar-plaketi-fenerbahce': {
    baslik: 'Elazığ Doğal Mermer Masa Üstü Taraftar Plaketi (Fenerbahçe)',
    marka: 'Elazığ',
  },
  'mina-bebek-oyuncak-bebek-geleneksel-kiyafetli': {
    baslik: 'ADEMODA El Yapımı Geleneksel Kıyafetli Mina Bez Bebek',
    marka: 'ADEMODA',
  },
  'cini-fincan-seti-kirmizi-kutulu': {
    baslik: 'Zenbay Kütahya Kadife Kutulu El Sanatı Çini Kahve Fincan Seti',
    marka: 'Zenbay',
  },
  'cini-kutulu-set-kirmizi-kadife-kutu-fincan-kase': {
    baslik: 'Zenbay Kütahya Kırmızı Kadife Kutulu Çini Fincan ve Kase Takımı',
    marka: 'Zenbay',
  },
};

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
