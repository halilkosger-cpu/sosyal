import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/.next'],
    },
    sitemap: 'https://isyurtlari.com.tr/sitemap.xml',
    host: 'https://isyurtlari.com.tr',
  }
}
