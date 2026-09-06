/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@isyurtlari/database'],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['@isyurtlari/database'],
  },

  compress: true,

  // Mobile optimization
  productionBrowserSourceMaps: false,
  optimizeFonts: true,

  // Not: burada "optimizeImages: true" duruyordu. Next boyle bir secenek
  // tanimiyor ve her derlemede "Unrecognized key(s) in object:
  // 'optimizeImages'" uyarisi veriyordu; hicbir etkisi yoktu. Gorsel
  // ayarlari asagidaki images bloğunda.

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },

      // Sayfalar: onceki onbellek davranisi aynen korunuyor.
      // API'ler bilerek disarida birakildi: '/:path*' hepsini kapsadigi icin
      // /api/admin/* ve /api/user/* cevaplari da 1 saat `public` onbellege
      // aliniyordu -> admin paneli bayat veri gosteriyor, ayrica musteri
      // bilgisi tasiyan cevaplar paylasimli onbelleklere acik kaliyordu.
      //
      // sitemap.xml de disarida: artik her istekte uretiliyor ve Next kendi
      // Cache-Control basligini koyuyor. Buradaki kural da eklenince yanitta
      // iki farkli max-age yan yana geliyordu ("max-age=3600, ..., max-age=0")
      // ve hangisinin gecerli oldugu belirsiz kaliyordu.
      //
      // /video ve ikon klasoru de disarida: asagida kendi uzun onbellek
      // kurallari var, ikisi birden uygulansa yine iki max-age yan yana gelirdi.
      //
      // _next/ de disarida ve bu ONEMLI. Buradaki desen onu kapsiyordu, yani
      // /_next/static/chunks/*.js dosyalari da "1 saat sakla" basligiyla
      // gidiyordu. Iki sonucu vardi:
      //
      //  1) Gelistirmede kirik sayfa. Kod degisince Next yeni parca adlariyla
      //     yeni bir modul grafigi uretiyor, ama tarayici eski webpack.js'i
      //     onbellekten servis etmeye devam ediyor; eski calisma zamani yeni
      //     parcadaki modulu bulamayinca sayfa
      //     "TypeError: Cannot read properties of undefined (reading 'call')"
      //     ile duruyordu. .next klasorunu silmek ise yaramiyor - bayat dosya
      //     diskte degil, tarayicida.
      //
      //  2) Canlida gereksiz indirme. _next/static dosyalarinin adi icerige
      //     gore uretiliyor, yani icerik degisince ad da degisiyor. Next bu
      //     yuzden onlara bir yil + immutable veriyor; buradaki kural o
      //     basligin yanina ikinci bir Cache-Control ekleyip omru bir saate
      //     dusuruyordu.
      {
        source: '/((?!api/|_next/|sitemap\\.xml|video/|sosyal_giris_isyurtlari_icons/).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      // API cevaplari asla onbellege alinmamali
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate',
          },
        ],
      },
      // Hero videosu ve kategori ikonlari: iceriklerine gore adlandirilmadiklari
      // icin /_next/static gibi bir yil onbelleklenemiyorlar, ama sayfa kurali
      // (1 saat) onlar icin cok kisaydi. Geri gelen ziyaretci 724 KB'lik videoyu
      // ve 27 ikonu her saat yeniden indiriyordu.
      //
      // 30 gun veriliyor, `immutable` bilerek konmuyor: dosya adi degismeden
      // icerik degistirilirse zorlamali yenileme ile guncelleme alinabilsin.
      {
        source: '/video/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000',
          },
        ],
      },
      {
        source: '/sosyal_giris_isyurtlari_icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000',
          },
        ],
      },
      // Aggressive caching for static assets
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images aggressively
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache fonts
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  images: {
    unoptimized: true, // DEĞİŞİKLİK BURADA: Vercel limitlerini durdurmak için eklendi
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig