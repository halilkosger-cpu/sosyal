import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt
 *
 * Onceden public/robots.txt de vardi ve bu route'u eziyordu (ortama gore
 * hangisinin servis edildigi degisiyordu). O dosya silindi; kurallari buraya
 * tasindi ki tek bir kaynak olsun ve adres SITE_URL ile hep tutarli kalsin.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Yapay Zeka Arama Motorları (ChatGPT, Perplexity, Claude, Gemini, Copilot)
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'Google-Extended',
          'GoogleOther',
          'Bingbot',
          'YandexBot',
        ],
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/admin/*',
          '/api/admin',
          '/api/admin/*',
          '/api',
          '/api/*',
          '/_next',
          '/_next/*',
          '/hesabim',
          '/siparislerim',
          '/checkout',
          '/sepet',
          '/favoriler',
          '/order-confirmation',
        ],
      },
      // Genel Arama Motoru Botları (Google, Bing, Yandex, Yahoo, DuckDuckGo vb.)
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/admin/*',
          '/api/admin',
          '/api/admin/*',
          '/api',
          '/api/*',
          '/_next',
          '/_next/*',
          // Kisiye ozel ve islem sayfalari: indekslenmemeli
          '/hesabim',
          '/siparislerim',
          '/checkout',
          '/sepet',
          '/favoriler',
          '/order-confirmation',
          // Filtre/siralama varyantlari ayni icerigi tekrar uretiyor
          '/*?*sort=',
          '/*?*filter=',
          '/ara?',
        ],
      },
      // Icerik kazima ve sunucu yukunu somuren SEO araclari
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
