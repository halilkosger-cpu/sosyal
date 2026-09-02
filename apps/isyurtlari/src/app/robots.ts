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
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/_next',
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
      // Icerik kazima yapan SEO araclari: tarama butcesini bosa harciyorlar
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
