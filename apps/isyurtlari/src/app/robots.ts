import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt
 *
 * GUVENLIK: Gizli yollar (admin vb.) buraya YAZILMAZ; robots.txt herkese acik
 * oldugu icin hedef gostermis olur. Bunlar middleware.ts'de X-Robots-Tag
 * noindex header'i ve kimlik dogrulamasi ile korunur.
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
          '/yorum',
        ],
      },
      // Genel Arama Motoru Botları (Google, Bing, Yandex, Yahoo, DuckDuckGo vb.)
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
          '/yorum',
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
