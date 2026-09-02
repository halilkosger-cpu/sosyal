import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bize Ulaşın — İletişim ve Destek',
  description: 'İşyurtları ürünleri, siparişleriniz ve iş birliği talepleriniz için bize ulaşın. Hafta içi 09:00-18:00 arası destek ekibimiz yanınızda.',
  alternates: { canonical: '/bize-ulasin' },
  openGraph: {
    title: 'Bize Ulaşın — İletişim ve Destek',
    description: 'İşyurtları ürünleri, siparişleriniz ve iş birliği talepleriniz için bize ulaşın. Hafta içi 09:00-18:00 arası destek ekibimiz yanınızda.',
    url: '/bize-ulasin',
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
