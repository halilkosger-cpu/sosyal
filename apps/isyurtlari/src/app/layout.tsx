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
import { IconCart, IconFastShipping, IconEasyReturn, IconSocialContribution, IconSecurePayment } from '@/components/Icons';
import { defaultMetadata, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { kategorileriGetir } from '@/lib/kategoriler';
import { kisaAd } from '@/lib/kategori-gorunum';
import KategoriIkon from '@/components/KategoriIkon';
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
        <header className="sticky top-0 z-50 shadow-md">

          {/* Main nav row */}
          <div className="bg-[#CC4E00]">
            <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-2 md:gap-4">

              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                <div className="bg-white rounded-lg px-3 py-1 flex items-center gap-2">
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

              {/* Account */}
              <Link
                href="https://cezaevinden.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex flex-col items-center text-white hover:text-orange-100 transition-colors flex-shrink-0"
              >
                <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-semibold">Platform</span>
              </Link>

              {/* Cart */}
              <Link
                href="/sepet"
                className="relative flex flex-col items-center text-white hover:text-orange-100 transition-colors flex-shrink-0"
              >
                <div className="relative">
                  <IconCart className="w-6 h-6 mb-0.5 brightness-0 invert" />
                  <CartBadge />
                </div>
                <span className="text-xs font-semibold">Sepetim</span>
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
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-[#CC4E00] hover:bg-orange-50 border-b-2 border-transparent hover:border-[#FF6000] transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <KategoriIkon slug={cat.slug} imageUrl={cat.imageUrl} className="w-7 h-7" />
                    {kisaAd(cat.name)}
                  </Link>
                ))}
                <div className="ml-auto flex-shrink-0">
                  <Link
                    href="/hakkimizda"
                    className="flex items-center gap-1 px-4 py-3 text-sm text-gray-500 hover:text-[#CC4E00] transition-colors whitespace-nowrap"
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

        {/* ─── FOOTER ─── */}
        <footer className="bg-[#0A1628] text-white mt-8">

          {/* Trust bar */}
          <div className="bg-[#0D1B30]">
            <div className="max-w-screen-xl mx-auto px-4 py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { Icon: IconFastShipping,       title: 'Hızlı Kargo', sub: 'Türkiye geneli teslimat' },
                  { Icon: IconSecurePayment,      title: 'Güvenli Ödeme', sub: 'SSL ile şifreli işlem' },
                  { Icon: IconEasyReturn,         title: 'Kolay İade', sub: '14 gün iade hakkı' },
                  { Icon: IconSocialContribution, title: 'Sosyal Katkı', sub: 'Her alışveriş fark yaratır' },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <item.Icon className="w-9 h-9 object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="max-w-screen-xl mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div>
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-white font-bold">Kurumsal</h3>
                <ul className="space-y-2">
                  <li><Link href="/hakkimizda" className="text-gray-300 hover:text-white text-sm transition font-medium">Hakkımızda</Link></li>
                  <li><Link href="/guvenli-alisveris" className="text-gray-300 hover:text-white text-sm transition font-medium">Güvenli Alışveriş</Link></li>
                  <li><Link href="/kvkk" className="text-gray-300 hover:text-white text-sm transition font-medium">KVKK</Link></li>
                  <li><Link href="/mesafeli-satis-sozlesmesi" className="text-gray-300 hover:text-white text-sm transition font-medium">Mesafeli Satış Sözleşmesi</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-white">Kategoriler</h3>
                <ul className="space-y-2">
                  <li><Link href="/gida" className="text-gray-300 hover:text-white text-sm transition font-medium">Gıda Ürünleri</Link></li>
                  <li><Link href="/tekstil" className="text-gray-300 hover:text-white text-sm transition font-medium">Tekstil</Link></li>
                  <li><Link href="/mobilya" className="text-gray-300 hover:text-white text-sm transition font-medium">Mobilya</Link></li>
                  <li><Link href="/ahsap" className="text-gray-300 hover:text-white text-sm transition font-medium">Ahşap Ürünler</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-white">Yardım</h3>
                <ul className="space-y-2">
                  <li><Link href="/bize-ulasin" className="text-gray-300 hover:text-white text-sm transition font-medium">Bize Ulaşın</Link></li>
                  <li><Link href="/teslimat-iade-sartlari" className="text-gray-300 hover:text-white text-sm transition font-medium">Teslimat & İade</Link></li>
                  <li><Link href="/gizlilik-sozlesmesi" className="text-gray-300 hover:text-white text-sm transition font-medium">Gizlilik Sözleşmesi</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-white">İletişim</h3>
                <p className="text-gray-300 text-sm font-bold mb-1">E-posta:</p>
                <a href="mailto:info@isyurtlari.com.tr" className="text-gray-300 text-sm mb-3 font-medium hover:text-[#CC4E00] transition-colors">info@isyurtlari.com.tr</a>
                <div className="flex gap-3 mt-4">
                  {['Twitter', 'Instagram', 'Facebook'].map((s) => (
                    <a key={s} href="#" aria-label={s} className="w-8 h-8 bg-gray-700 hover:bg-[#CC4E00] rounded-full flex items-center justify-center text-xs font-semibold text-white transition-colors">
                      {s[0]}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-blue-900/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-400 text-sm">
                © 2026 isyurtlari.com.tr - Tüm hakları saklıdır.
              </p>
              <Image src="/logo_band_white@1X.png" alt="Payment Methods - Visa, Mastercard, iyzico" width={280} height={40} className="h-8 w-auto" sizes="(max-width: 640px) 200px, 280px" />
            </div>
          </div>
        </footer>

        <CookieConsent />
        <Olcumler />
      </body>
    </html>
  );
}
