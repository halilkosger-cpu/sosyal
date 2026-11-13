const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  transpilePackages: ['@isyurtlari/database'],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['@isyurtlari/database', 'react-icons', 'framer-motion'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  compress: true,

  // Mobile optimization
  productionBrowserSourceMaps: false,

  // Not: burada "optimizeImages: true" duruyordu. Next boyle bir secenek
  // tanimiyor ve her derlemede "Unrecognized key(s) in object:
  // 'optimizeImages'" uyarisi veriyordu; hicbir etkisi yoktu. Gorsel
  // ayarlari asagidaki images bloğunda.

  async redirects() {
    return [
      // Bot taramalari: bu adresler sitede hic yok. CDN'de statik 404'e
      // yonlendirilir; fonksiyon cagrisi ve ISR yazimi uretmez.
      {
        source: '/:path(.*\\.(?:php|asp|aspx|jsp|cgi|env|sql|bak|ini|zip|tar|gz|git))',
        destination: '/404',
        permanent: false,
      },
      { source: '/wp-:rest(.*)', destination: '/404', permanent: false },
      { source: '/.git/:rest(.*)', destination: '/404', permanent: false },
      { source: '/phpmyadmin:rest(.*)', destination: '/404', permanent: false },
      { source: '/guven:x-aliveri', destination: '/guvenli-alisveris', permanent: true },
      { source: '/mobilya', destination: '/ahsap', permanent: true },
      { source: '/urun/lokum', destination: '/gida', permanent: true },
      { source: '/urun/susam-yagi', destination: '/gida', permanent: true },
      { source: '/urun/burdur-cezerye', destination: '/gida', permanent: true },
      { source: '/urun/tarsus-cezerye', destination: '/gida', permanent: true },
      { source: '/urun/baklava', destination: '/gida', permanent: true },
      { source: '/urun/gul-serbeti', destination: '/gida', permanent: true },
      { source: '/urun/yumurta', destination: '/gida', permanent: true },
      { source: '/urun/lavaanta-kolonyasi', destination: '/urun/lavanta-kolonyasi', permanent: true },
      { source: '/urun/pamuklu-tshirt', destination: '/tekstil', permanent: true },
      { source: '/urun/el-dokuma-ortusu', destination: '/tekstil', permanent: true },
      { source: '/urun/oya-dantel', destination: '/tekstil', permanent: true },
      { source: '/urun/tiras-losyonu', destination: '/temizlik', permanent: true },
      { source: '/urun/seramik-set', destination: '/hediyelik', permanent: true },
      { source: '/urun/ahsap-tahtalar', destination: '/ahsap', permanent: true },
    ];
  },

  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }

    /**
     * Statik dosyalar (public/) Vercel'de varsayilan olarak `max-age=0` ile
     * geliyor: tarayici her sayfada "degisti mi?" diye yeniden soruyor ve her
     * soru bir Edge Request sayiliyor (PageSpeed/Vercel verisi: sayfa basina ~40
     * istek; ikonlar ve manifest her sayfa gosteriminde isteniyordu).
     * Dosya adlari icerik karmasi tasimiyor, bu yuzden uzun sureli "immutable"
     * yerine 1 gun: degisen dosya en gec 1-2 gunde yenilenir.
     * service-worker.js bilerek DISARIDA: her zaman guncel olmali.
     */
    const STATIK_ONBELLEK = [
      { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=86400' },
    ];

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
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            // 28 Eki 2026: 12 sayfa (cerez onayli, GA dahil) gercek Chrome'da tarandi, ihlal yok -> zorunlu.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com https://*.iyzipay.com https://*.iyzico.com",
              "style-src 'self' 'unsafe-inline' https://*.iyzipay.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://vitals.vercel-insights.com https://*.iyzipay.com",
              "frame-src https://*.iyzipay.com https://*.iyzico.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self' https://*.iyzipay.com",
              "object-src 'none'",
              'upgrade-insecure-requests',
              'report-uri /api/csp-rapor',
            ].join('; '),
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), usb=(), bluetooth=(), serial=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()',
          },
          {
            // Iyzico 3D Secure acilir pencereleri icin allow-popups; diger pencerelerle baglanti kopar.
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
      // Kisiye ozel ve islem sayfalari: robots.txt'te listelemeden noindex ile gizlenir.
      {
        source: '/:yol(hesabim|adreslerim|siparislerim|iadelerim|checkout|sepet|favoriler|order-confirmation|yorum|giris|kayit|sifre-sifirla|eposta-dogrula|ara)/:alt*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      // Kanonik olmayan alan adlari (vercel.app onizlemeleri vb.) indekslenmesin.
      {
        source: '/:path*',
        has: [{ type: 'host', value: '(?!isyurtlari\\.com\\.tr$).*' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      // Admin ve tüm alt klasörleri: Arama motorları ve botlar için ÇOK GİZLİ (noindex, nofollow, noarchive, nosnippet)
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/api/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
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
            value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
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
      // Genel `max-age=0` kuralindan SONRA gelmeli: ayni anahtarda sonraki kural gecerli.
      ...[
        '/kategori-ikon/:path*',
        '/hero/:path*',
        '/hikaye/:path*',
        '/images/:path*',
        '/kategori/:path*',
        '/kampanya/:path*',
        '/iyzico/:path*',
        '/urun/:dosya(.+\\.(?:webp|jpg|jpeg|png|avif))',
        '/manifest.json',
        '/logo.png',
        '/logo.jpg',
        '/logo.webp',
        '/logo-160.webp',
        '/og-gorsel.jpg',
        '/mastercard.png',
        '/visa.png',
        '/logo_band_colored@1X.png',
        '/logo_band_white@1X.png',
      ].map((source) => ({ source, headers: STATIK_ONBELLEK })),
    ];
  },

  images: {
    unoptimized: true, // DEĞİŞİKLİK BURADA: Vercel limitlerini durdurmak için eklendi
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'isyurtlari.com.tr',
      },
      {
        protocol: 'https',
        hostname: '*.isyurtlari.com.tr',
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