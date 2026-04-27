import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import Image from 'next/image';
import CartBadge from '@/components/CartBadge';
import { LuUtensils, LuShirt, LuTreePine, LuScissors, LuSofa, LuWrench } from 'react-icons/lu';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://isyurtlari.com.tr'),
  title: 'isyurtlari.com.tr | Adalet Bakanlığı İşyurtları Online Mağaza',
  description: 'İşyurtları online satış mağazası. Adalet Bakanlığı hükümlülerinin el emeğiyle üretilen doğal ve katkısız ürünler. Sosyal girişim, rehabilitasyon ve yeniden entegrasyon projesi.',
  keywords: [
    'işyurtları online mağaza',
    'işyurtları ürün satış',
    'adalet bakanlığı ürün satışı',
    'hükümlü ürünleri',
    'rehabilitasyon ürünleri',
    'sosyal girişim ürünleri',
    'el yapımı ürünler türkiye',
    'doğal katkısız gıda',
    'adalet bakanlığı',
    'hükümlü destekle',
    'sosyal sorumluluk',
    'rehabilitasyon projesi',
  ],
  openGraph: {
    title: 'Her Satın Alma Bir İkinci Şans Demek',
    description: 'Adalet Bakanlığı Sosyal Girişimi - Hükümlülerin rehabilitasyonunu destekle',
    type: 'website',
    locale: 'tr_TR',
    url: 'https://isyurtlari.com.tr',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'isyurtlari.com.tr | Adalet Bakanlığı Sosyal Girişimi',
    description: 'Hükümlülerin el emeğiyle üretilen ürünler. Her satın alma, bir kişinin yeniden başlamasına yardım eder.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

const categories = [
  { name: 'Gıda',    slug: 'gida',        Icon: LuUtensils  },
  { name: 'Tekstil', slug: 'tekstil',      Icon: LuShirt     },
  { name: 'Ahşap',   slug: 'ahsap',         Icon: LuTreePine  },
  { name: 'Dokuma',  slug: 'dokuma',                Icon: LuScissors  },
  { name: 'Mobilya', slug: 'mobilya',      Icon: LuSofa      },
  { name: 'Metal',   slug: 'metal',  Icon: LuWrench    },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <Script
          id="gtag-consent-init"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}

              // Analytics enabled - banner sonra eklenecek
              gtag('consent', 'default', {
                'analytics_storage': 'granted',
                'ad_storage': 'denied'
              });
            `,
          }}
        />

        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-KTWVN830XT" />

        <Script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-KTWVN830XT');
            `,
          }}
        />

        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              '@id': 'https://isyurtlari.com.tr/#business',
              name: 'Adalet Bakanlığı İşyurtları Online Mağaza',
              url: 'https://isyurtlari.com.tr',
              description:
                'Hükümlülerin el emeğiyle üretilen ürün satış mağazası. Adalet Bakanlığı Sosyal Girişimi.',
              image: 'https://isyurtlari.com.tr/logo.png',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Adalet Bakanlığı',
                addressLocality: 'Ankara',
                addressRegion: 'Ankara',
                postalCode: '06100',
                addressCountry: 'TR',
              },
              sameAs: [
                'https://www.instagram.com/isyurtlari',
                'https://www.facebook.com/isyurtlari',
              ],
              contact: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                email: 'info@isyurtlari.com.tr',
              },
            }),
          }}
        />

        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Adalet Bakanlığı İşyurtları',
              url: 'https://isyurtlari.com.tr',
              logo: 'https://isyurtlari.com.tr/logo.png',
              description:
                'Hükümlülerin rehabilitasyonu ve yeniden entegrasyon için sosyal girişim projesi',
              sameAs: [
                'https://www.instagram.com/isyurtlari',
                'https://www.facebook.com/isyurtlari',
              ],
            }),
          }}
        />
      </head>
      <body className="bg-gray-100 text-gray-900">

        {/* ─── TOP BAR ─── */}
        <header className="sticky top-0 z-50 shadow-md">

          {/* Main nav row */}
          <div className="bg-[#FF6000]">
            <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-4">

              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                <div className="bg-white rounded-lg px-3 py-1 flex items-center gap-2">
                  <Image src="/logo.jpg" alt="İsyurtları" width={200} height={72} className="object-contain h-[72px] w-auto" priority />
                </div>
              </Link>

              {/* Search bar */}
              <form action="/ara" method="GET" className="flex-1 flex">
                <input
                  name="q"
                  type="text"
                  placeholder="Ürün, kategori veya marka ara..."
                  className="flex-1 px-4 py-2.5 text-sm rounded-l-lg border-0 outline-none bg-white text-gray-800 placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="bg-[#CC4E00] hover:bg-[#B34400] text-white px-5 py-2.5 rounded-r-lg font-medium text-sm transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

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
                <span className="text-xs font-medium">Platform</span>
              </Link>

              {/* Cart */}
              <Link
                href="/sepet"
                className="relative flex flex-col items-center text-white hover:text-orange-100 transition-colors flex-shrink-0"
              >
                <div className="relative">
                  <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <CartBadge />
                </div>
                <span className="text-xs font-medium">Sepetim</span>
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
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-[#FF6000] hover:bg-orange-50 border-b-2 border-transparent hover:border-[#FF6000] transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <cat.Icon size={16} />
                    {cat.name}
                  </Link>
                ))}
                <div className="ml-auto flex-shrink-0">
                  <Link
                    href="/hakkimizda"
                    className="flex items-center gap-1 px-4 py-3 text-sm text-gray-500 hover:text-[#FF6000] transition-colors whitespace-nowrap"
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
                  { icon: '🚚', title: 'Hızlı Kargo', sub: 'Türkiye geneli teslimat' },
                  { icon: '🔒', title: 'Güvenli Ödeme', sub: 'SSL ile şifreli işlem' },
                  { icon: '↩️', title: 'Kolay İade', sub: '14 gün iade hakkı' },
                  { icon: '❤️', title: 'Sosyal Katkı', sub: 'Her alışveriş fark yaratır' },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
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
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-gray-300">Kurumsal</h3>
                <ul className="space-y-2">
                  <li><Link href="/hakkimizda" className="text-gray-400 hover:text-white text-sm transition">Hakkımızda</Link></li>
                  <li><Link href="/guvenlı-aliveri" className="text-gray-400 hover:text-white text-sm transition">Güvenli Alışveriş</Link></li>
                  <li><Link href="/kvkk" className="text-gray-400 hover:text-white text-sm transition">KVKK</Link></li>
                  <li><Link href="/mesafeli-satis-sozlesmesi" className="text-gray-400 hover:text-white text-sm transition">Mesafeli Satış Sözleşmesi</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-gray-300">Kategoriler</h3>
                <ul className="space-y-2">
                  <li><Link href="/gida" className="text-gray-400 hover:text-white text-sm transition">Gıda Ürünleri</Link></li>
                  <li><Link href="/tekstil" className="text-gray-400 hover:text-white text-sm transition">Tekstil</Link></li>
                  <li><Link href="/mobilya" className="text-gray-400 hover:text-white text-sm transition">Mobilya</Link></li>
                  <li><Link href="/ahsap" className="text-gray-400 hover:text-white text-sm transition">Ahşap Ürünler</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-gray-300">Yardım</h3>
                <ul className="space-y-2">
                  <li><Link href="/bize-ulasin" className="text-gray-400 hover:text-white text-sm transition">Bize Ulaşın</Link></li>
                  <li><Link href="/teslimat-iade-sartlari" className="text-gray-400 hover:text-white text-sm transition">Teslimat & İade</Link></li>
                  <li><Link href="/gizlilik-sozlesmesi" className="text-gray-400 hover:text-white text-sm transition">Gizlilik Sözleşmesi</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-gray-300">İletişim</h3>
                <p className="text-gray-400 text-sm font-semibold mb-1">E-posta:</p>
                <a href="mailto:info@isyurtlari.com.tr" className="text-gray-400 text-sm mb-3 hover:text-[#FF6000] transition-colors">info@isyurtlari.com.tr</a>
                <div className="flex gap-3 mt-4">
                  {['Twitter', 'Instagram', 'Facebook'].map((s) => (
                    <a key={s} href="#" className="w-8 h-8 bg-gray-700 hover:bg-[#FF6000] rounded-full flex items-center justify-center text-xs transition-colors">
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
              <Image src="/logo_band_white@1X.png" alt="Payment Methods - Visa, Mastercard, iyzico" width={280} height={40} className="h-8 w-auto" />
            </div>
          </div>
        </footer>

        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Organization',
              name: 'isyurtlari.com.tr',
              alternateName: 'Adalet Bakanlığı İşyurtları',
              url: 'https://isyurtlari.com.tr',
              logo: 'https://isyurtlari.com.tr/logo.jpg',
              description: 'Adalet Bakanlığı Sosyal Girişimi - Hükümlülerin el emeğiyle üretilen ürünler',
              sameAs: [
                'https://twitter.com/isyurtlari',
                'https://instagram.com/isyurtlari',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Service',
                email: 'info@isyurtlari.com.tr',
              },
            }),
          }}
        />

      </body>
    </html>
  );
}
