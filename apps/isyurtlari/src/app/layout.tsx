import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/seo';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';

import Olcumler from '@/components/Olcumler';
import CartBadge from '@/components/CartBadge';
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
const SearchSuggest = dynamic(() => import('@/components/SearchSuggest'), { ssr: true });
import { IconCart } from '@/components/Icons';
import { defaultMetadata, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { kategorileriGetir } from '@/lib/kategoriler';
import { kisaAd } from '@/lib/kategori-gorunum';
import KategoriIkon from '@/components/KategoriIkon';
import HesapMenusu from '@/components/HesapMenusu';
const SenkronKopru = dynamic(() => import('@/components/SenkronKopru'), { ssr: false });
const AltGezinme = dynamic(() => import('@/components/AltGezinme'), { ssr: false });
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin-ext'],
  weight: ['700'],
  display: 'swap',
  variable: '--font-space-grotesk',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin-ext'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  ...defaultMetadata,
  title: 'İsyurtları Online Mağaza | Cezaevi & Hapishane Ürünleri | Sosyal Girişim',
  // 155 karakteri asmiyor: Google arama sonucunda yaklasik bu uzunlukta
  // kesiyor, oncesi 224 karakterdi ve sonu hic gorunmuyordu.
  description: 'Cezaevi ve hapishane hükümlülerinin el emeğiyle ürettiği doğal gıda, tekstil ve ahşap ürünleri. Her satın alma meslek eğitimine destek olur.',
  keywords: [
    'işyurtları online mağaza',
    'cezaevi ürünleri',
    'hapishane ürünleri',
    'hükümlü ürünleri',
    'cezaevi sosyal girişim',
    'işyurtları sosyal girişim',
    'el yapımı ürünler türkiye',
    'doğal gıda ürünleri',
    'rehabilitasyon ürünleri',
    'reintegrasyon projesi',
    'hapishane eğitim programı',
    'cezaevinden ürün satın al',
    'sosyal sorumluluk',
    'hükümlü destekle',
    'türkiye sosyal girişim',
    'çıkış sonrası istihdam',
  ],
  openGraph: {
    ...defaultMetadata.openGraph,
    type: 'website',
    url: SITE_URL,
    title: 'İsyurtları Online Mağaza | Cezaevi & Hapishane Ürünleri',
    description: 'Cezaevi ve hapishane hükümlülerinin el emeğiyle ürettiği doğal ürünler. Gıda, tekstil, ahşap ve el sanatları. Rehabilitasyon destekli sosyal girişim.',
    images: [
      {
        url: `${SITE_URL}/logo.jpg`,
        width: 1024,
        height: 1024,
        alt: 'İsyurtları - Cezaevi Sosyal Girişim Online Mağaza',
      },
    ],
  },
  twitter: {
    ...defaultMetadata.twitter,
    card: 'summary_large_image',
    title: 'İsyurtları | Cezaevi Ürünleri Online Mağaza',
    description: 'Hapishane ve cezaevi hükümlülerinin el emeğiyle ürettiği doğal ürünler. Sosyal girişim destekli satın alma.',
  },
};

// Elle yazilan <meta name="viewport"> ile Next'in urettigi cakisiyordu;
// sayfada iki tane viewport etiketi olusuyordu. Dogru yol bu export.
// maximum-scale=5 korunuyor: kullanicinin yakinlastirabilmesi erisilebilirlik
// gereginden.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#FF6000',
};

// Kategori listesi artik veritabanindan geliyor. Burada elle yazili duran
// bes kategori vardi; admin panelinden eklenen kategoriler sitede hic
// gorunmuyor, "dokuma" ve "mobilya" ise veritabaninda karsiligi olmadigi icin
// 404 veren olu bag olarak duruyordu.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await kategorileriGetir();

  return (
    <html lang="tr" suppressHydrationWarning className={`${spaceGrotesk.variable} ${plusJakartaSans.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#FF6000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://mclmi5w9lcfqj48x.public.blob.vercel-storage.com" />
        {/* Google Analytics betikleri buradaydi; Olcumler bilesenine tasindi
            (body'nin sonunda). Sebep: admin panelinde calismamalari gerekiyor,
            bunun icin de yolu okuyabilen bir istemci bileseni sart. */}

        <script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        <script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </head>
      <body className="bg-gray-100 text-gray-900">

        {/* ─── TOP BAR ─── */}
        <header className="sticky top-0 z-50 shadow-sm">

          {/* Main nav row - 2026 Eylul tasarimi: beyaz baslik */}
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center gap-3 md:gap-8">

              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  {/* logo.jpg 1024x1024 kare ve 54 KB idi; width/height ise
                      160x60 yaziliydi. Tarayici once 160x60 yer ayirip sonra
                      CSS ile 60x60'a cektigi icin duzen kaymasi oluyordu.
                      images.unoptimized acik oldugundan (Vercel donusum kotasi)
                      dosya oldugu gibi servis ediliyor - bu yuzden onceden
                      kucultulmus WebP kullaniliyor: 54 KB -> 12.5 KB.
                      logo.jpg og:image icin oldugu gibi duruyor. */}
                  <Image
                    src="/logo.webp"
                    alt="İsyurtları"
                    width={60}
                    height={60}
                    className="object-contain h-[60px] w-auto"
                    priority
                  />
                </div>
              </Link>

              {/* Search bar */}
              <SearchSuggest />

              {/* Hesap. Buradaki kullanici simgesi daha once cezaevinden.com'a
                  gidiyordu ve sitede musteri hesabi yoktu; artik gercek giris
                  ve hesap menusu. Sosyal platform baglantisi alt bilgide. */}
              <HesapMenusu />

              {/* Cart */}
              <Link
                href="/sepet"
                className="relative flex items-center gap-2 text-gray-800 hover:text-[#CC4E00] transition-colors flex-shrink-0"
              >
                <div className="relative">
                  <IconCart className="w-6 h-6" />
                  <CartBadge />
                </div>
                <span className="hidden sm:inline text-sm font-medium">Sepetim</span>
              </Link>

            </div>
          </div>

          {/* Category bar */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-screen-xl mx-auto px-4">
              <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${cat.slug}`}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-[#BA4700] hover:bg-orange-50 border-b-2 border-transparent hover:border-[#FF6000] transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <KategoriIkon slug={cat.slug} imageUrl={cat.imageUrl} className="w-8 h-8" />
                    {kisaAd(cat.name)}
                  </Link>
                ))}
                <div className="ml-auto flex-shrink-0">
                  <Link
                    href="/hakkimizda"
                    className="flex items-center gap-1 px-4 py-3 text-sm text-gray-500 hover:text-[#BA4700] transition-colors whitespace-nowrap"
                  >
                    Hakkımızda
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </header>

        {/* Main Content */}
        <main className="min-h-screen bg-gray-100">
          {children}
        </main>

        {/* ─── FOOTER ───
            2026 Eylul tasarimi: acik zemin, dort sutun.

            Kaldirilanlar ve sebepleri:
             - Visa / Mastercard / iyzico logolari: kartla odeme su an kapali;
               logolar olmayan bir odeme yolunu vaat ediyordu. Kart odemesi
               acildiginda geri eklenmeli.
             - Sosyal medya dugmeleri: hepsi href="#" idi, hicbir hesaba
               gitmiyordu. Gercek hesap adresleri girildiginde eklenebilir. */}
        <footer className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-screen-xl mx-auto px-4 pt-10 pb-24 md:pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="col-span-2 md:col-span-1">
                <Image src="/logo.webp" alt="İsyurtları" width={60} height={60} className="h-[52px] w-auto mb-3" />
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                  Adalet Bakanlığı işyurtlarındaki meslek eğitim atölyelerinde hükümlülerin el emeğiyle
                  üretilen ürünlerin online satış mağazası.
                </p>
                <a href="mailto:info@isyurtlari.com.tr" className="inline-block mt-3 text-sm font-semibold text-[#BA4700] hover:text-[#8F3700]">
                  info@isyurtlari.com.tr
                </a>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Alışveriş</h3>
                {/* Kategoriler veritabanindan: panelden eklenen/silinen
                    kategori burada da hemen guncellenir. */}
                <ul className="space-y-2">
                  {categories.slice(0, 6).map((cat) => (
                    <li key={cat.slug}>
                      <Link href={`/${cat.slug}`} className="text-sm text-gray-600 hover:text-[#BA4700] transition-colors">
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Kurumsal</h3>
                <ul className="space-y-2">
                  <li><Link href="/hakkimizda" className="text-sm text-gray-600 hover:text-[#BA4700] transition-colors">Hakkımızda</Link></li>
                  <li><Link href="/guvenli-alisveris" className="text-sm text-gray-600 hover:text-[#BA4700] transition-colors">Güvenli Alışveriş</Link></li>
                  <li><Link href="/kvkk" className="text-sm text-gray-600 hover:text-[#BA4700] transition-colors">KVKK</Link></li>
                  <li><Link href="/mesafeli-satis-sozlesmesi" className="text-sm text-gray-600 hover:text-[#BA4700] transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
                  <li>
                    <a href="https://cezaevinden.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-[#BA4700] transition-colors">
                      Platform: cezaevinden.com
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Destek</h3>
                <ul className="space-y-2">
                  <li><Link href="/bize-ulasin" className="text-sm text-gray-600 hover:text-[#BA4700] transition-colors">Bize Ulaşın</Link></li>
                  <li><Link href="/teslimat-iade-sartlari" className="text-sm text-gray-600 hover:text-[#BA4700] transition-colors">Teslimat &amp; İade</Link></li>
                  <li><Link href="/siparislerim" className="text-sm text-gray-600 hover:text-[#BA4700] transition-colors">Siparişlerim</Link></li>
                  <li><Link href="/gizlilik-sozlesmesi" className="text-sm text-gray-600 hover:text-[#BA4700] transition-colors">Gizlilik Sözleşmesi</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-100 mt-8 pt-5 text-center">
              <p className="text-xs text-gray-500">© 2026 isyurtlari.com.tr - Tüm hakları saklıdır.</p>
            </div>
          </div>
        </footer>

        <CookieConsent />
        <Olcumler />
        {/* Sepet ve favorileri sunucuyla eslestirir; ciziyor bir sey yok. */}
        <SenkronKopru />
        {/* Mobil alt gezinme. Masaustunde ust baslik zaten hepsini tasiyor. */}
        <AltGezinme />
      </body>
    </html>
  );
}
