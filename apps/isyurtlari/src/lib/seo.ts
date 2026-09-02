import type { Metadata } from 'next';

// Kanonik adres www'SUZ surumdur. Sebep: Google'in indeksi ve siralamasi
// bu adreste; Search Console mulku de www'suz. Site su an www'dan servis
// edilip apex'ten 307 (GECICI) yonlendirme yapiyor - geciciligi nedeniyle
// Google kaynak adresi indekste tutuyor. Yonlendirme yonu Vercel'de
// tersine cevrilmeli: www -> apex, 308 (kalici).
export const SITE_URL = 'https://isyurtlari.com.tr';
export const SITE_NAME = 'isyurtlari.com.tr';
export const SITE_TITLE = 'Sosyal Girişim İşyurtları Online Mağaza';
export const SITE_DESCRIPTION =
  'İşyurtları online satış mağazası. Hükümlülerin el emeğiyle üretilen doğal ürünler ve sosyal girişim alışveriş deneyimi.';

export const hasDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  return url?.startsWith('postgresql://') || url?.startsWith('postgres://');
};

export const absoluteUrl = (path = '/') => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const truncate = (value: string, maxLength = 155) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}…`;
};

export const defaultOpenGraphImage = absoluteUrl('/logo.jpg');

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_TITLE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_TITLE}`,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: 'tr_TR',
    url: SITE_URL,
    images: [
      {
        url: defaultOpenGraphImage,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | Sosyal Girişim`,
    description: SITE_DESCRIPTION,
    images: [defaultOpenGraphImage],
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
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Sosyal Girişim İşyurtları',
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: defaultOpenGraphImage,
  description: SITE_DESCRIPTION,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'info@isyurtlari.com.tr',
    availableLanguage: 'Turkish',
  },
  sameAs: [
    'https://www.instagram.com/isyurtlari',
    'https://www.facebook.com/isyurtlari',
  ],
};

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'tr-TR',
  publisher: {
    '@id': `${SITE_URL}/#organization`,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/ara?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export const breadcrumbJsonLd = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
