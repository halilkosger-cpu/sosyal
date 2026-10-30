import type { Metadata, Viewport } from 'next';
import { jsonLdMetni } from '@/lib/json-ld';
import { ViewTransitions } from 'next-view-transitions';
import { KASIM_KAMPANYASI_AKTIF, KASIM_INDIRIM_ORANI } from '@/lib/fiyat';
import HareketSaglayici from '@/components/HareketSaglayici';
import { SITE_URL } from '@/lib/seo';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  CookieConsent,
  KargoTakipModal,
  SenkronKopru,
  MobilKopru,
  AltGezinme,
  KampanyaModal,
  SepetToastBildirimi,
  HediyeDanismaniModal,
  MobilUygulamaBanneri,
  SpotlightArama,
} from '@/components/IstemciKatmanlari';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';

import Olcumler from '@/components/Olcumler';
const SearchSuggest = dynamic(() => import('@/components/SearchSuggest'), { ssr: true });
import { defaultMetadata, organizationJsonLd, paylasimGorseli, websiteJsonLd } from '@/lib/seo';
import { kategorileriGetir } from '@/lib/kategoriler';
import { kisaAd } from '@/lib/kategori-gorunum';
import KategoriIkon from '@/components/KategoriIkon';
import HesapMenusu from '@/components/HesapMenusu';
import MobilKategoriSeridi from '@/components/MobilKategoriSeridi';
import DahiliAnalitikTracker from '@/components/DahiliAnalitikTracker';
import { CartDrawerProvider } from '@/context/CartDrawerContext';
import PushBackLayout from '@/components/PushBackLayout';
import CartDrawer from '@/components/CartDrawer';
import CartTrigger from '@/components/CartTrigger';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin-ext'],
  axes: ['opsz', 'SOFT'],
  display: 'swap',
  variable: '--font-display',
  preload: true,
  fallback: ['Georgia', 'serif'],
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
  title: 'İsyurtları Online Mağaza | Cezaevi & Hapishane Ürünleri',
  // 155 karakteri asmiyor: Google arama sonucunda yaklasik bu uzunlukta
  // kesiyor, oncesi 224 karakterdi ve sonu hic gorunmuyordu.
  // Eskiden "Her satin alma meslek egitimine destek olur" ile bitiyordu.
  // Bu, alisverisin bir egitim programina bagis oldugunu ima ediyor;
  // site bagimsiz bir ticari magaza ve satis gelirinin nereye gittigi
  // konusunda boyle bir soz veremez. Hukumlulerin ucret karsiligi
  // calistigi ve meslek ogrendigi ayri bir olgu, sayfalarda soyleniyor.
  description: 'Adalet Bakanlığı İşyurtları atölyelerinde üretilen gıda, hediyelik, ahşap ve temizlik ürünleri. Hükümlülerin el emeği, bağımsız online mağaza.',
  keywords: [
    'işyurtları online mağaza',
    'cezaevi ürünleri',
    'hapishane ürünleri',
    'hükümlü ürünleri',
    'el yapımı ürünler türkiye',
    'işyurtları zeytinyağı',
    'cezaevinden ürün satın al',
    'işyurtları hediyelik',
    'çini hediyelik ürünler',
    'oltu taşı tesbih',
  ],
  openGraph: {
    ...defaultMetadata.openGraph,
    type: 'website',
    url: SITE_URL,
    title: 'İsyurtları Online Mağaza | Cezaevi & Hapishane Ürünleri',
    // Katalogda satilan kategoriler yaziliyor. Eskiden "tekstil" de
    // vardi ama o kategoride vitrine cikmis tek urun yok.
    description: 'Adalet Bakanlığı İşyurtları atölyelerinde üretilen ürünler: gıda, hediyelik, temizlik ve kozmetik, ahşap, fidan.',
    images: [
      {
        // 1200x630: WhatsApp/X/LinkedIn onizlemesi bu oranı bekliyor.
        // Kare logo buyuk onizlemede kucuk bir ikona duserek geliyordu.
        url: paylasimGorseli,
        width: 1200,
        height: 630,
        alt: 'İsyurtları - Cezaevi Ürünleri Online Mağaza',
      },
    ],
  },
  twitter: {
    ...defaultMetadata.twitter,
    card: 'summary_large_image',
    title: 'İsyurtları | Cezaevi Ürünleri Online Mağaza',
    description: 'Hapishane ve cezaevi hükümlülerinin el emeğiyle ürettiği doğal ürünler.',
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
    <ViewTransitions>
    <html lang="tr" suppressHydrationWarning className={`${fraunces.variable} ${plusJakartaSans.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#FF6000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        {/* Google Analytics betikleri buradaydi; Olcumler bilesenine tasindi
            (body'nin sonunda). Sebep: admin panelinde calismamalari gerekiyor,
            bunun icin de yolu okuyabilen bir istemci bileseni sart. */}

        <script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdMetni(organizationJsonLd),
          }}
        />

        <script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdMetni(websiteJsonLd),
          }}
        />
      </head>
      <body className="bg-gray-100 text-gray-900">
        <HareketSaglayici>
        <CartDrawerProvider>
          <PushBackLayout>
            {/* Akıllı Mobil Uygulama ve PWA Kurulum Bannerı */}
            <MobilUygulamaBanneri />

            {/* ─── TOP BAR ─── */}
            <header className="sticky top-0 z-50 shadow-sm">
          {/* Kampanya Duyuru Bandı */}
          {KASIM_KAMPANYASI_AKTIF && (
          <div className="bg-gradient-to-r from-[#BA4700] via-[#CC4E00] to-[#BA4700] text-white text-[11px] sm:text-xs py-1.5 px-3 text-center font-medium tracking-wide">
            <span className="inline-flex items-center gap-1.5 justify-center flex-wrap">
              <span>🔥</span>
              <span><strong>Büyük Açılış &amp; Efsane Kasım:</strong> Tüm ürünlerde sepette net <strong>%{KASIM_INDIRIM_ORANI} indirim</strong> anında uygulanır!</span>
            </span>
          </div>
          )}

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
                    src="/logo-160.webp"
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

              {/* Kargom Nerede Hızlı Sorgulama */}
              <KargoTakipModal />

              {/* Hesap */}
              <HesapMenusu />

              {/* Cart */}
              <CartTrigger />

            </div>
          </div>

          {/* Category bar - Desktop */}
          <div className="bg-white border-b border-gray-200 hidden md:block">
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
                <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                  <Link
                    href="/hediye-kutusu-yap"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#CC4E00] hover:bg-[#a83f00] text-white shadow-sm hover:shadow transition-all whitespace-nowrap mr-1"
                  >
                    <span>🎁</span> Hediye Kutusu Yap
                  </Link>
                  <Link
                    href="/hakkimizda"
                    className="flex items-center gap-1 px-3 py-3 text-sm text-gray-500 hover:text-[#BA4700] transition-colors whitespace-nowrap"
                  >
                    Hakkımızda
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Category bar - Mobil Thumb-Zone Hikaye Stili */}
          <MobilKategoriSeridi categories={categories} />

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
                <Image src="/logo-160.webp" alt="İsyurtları" width={60} height={60} className="h-[52px] w-auto mb-3" />
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
            <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-500 text-center md:text-left space-y-1">
                <p className="font-semibold text-gray-700">İŞ YRT E-TİCARET GIDA LİMİTED ŞİRKETİ</p>
                <p>© 2026 isyurtlari.com.tr - Tüm hakları saklıdır. 256-Bit SSL ile korunmaktadır.</p>
              </div>
              <div className="flex items-center gap-3">
                <Image src="/iyzico/footer-logo.svg" alt="iyzico ile Güvenli Ödeme" width={180} height={32} className="h-8 w-auto" />
              </div>
            </div>
          </div>
        </footer>
          </PushBackLayout>

          {/* Sağdan Açılan Sepet Çekmecesi */}
          <CartDrawer />

          <CookieConsent />
          <KampanyaModal />
          <Olcumler />
          <DahiliAnalitikTracker />
          {/* Sepet ve favorileri sunucuyla eslestirir; ciziyor bir sey yok. */}
          <SenkronKopru />
          {/* Mobil uygulama yerel koprusu ve cevrimdisi yonetimi */}
          <MobilKopru />
          {/* Mobil alt gezinme. Masaustunde ust baslik zaten hepsini tasiyor. */}
          <AltGezinme />
          {/* Bildirim ve Modüller */}
          <SepetToastBildirimi />
          <HediyeDanismaniModal />
          <SpotlightArama />
        </CartDrawerProvider>
        </HareketSaglayici>
      </body>
    </html>
    </ViewTransitions>
  );
}
