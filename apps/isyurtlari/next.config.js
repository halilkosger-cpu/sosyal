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

  // Image optimization for mobile
  optimizeImages: true,

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
      {
        source: '/((?!api/).*)',
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