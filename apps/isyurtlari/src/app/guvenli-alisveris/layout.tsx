import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Güvenli Alışveriş — Ödeme ve Teslimat Güvencesi',
  description: 'İşyurtları’nda ödemeleriniz güvenli altyapı ile korunur. Adalet Bakanlığı işyurtları güvencesi, hızlı kargo ve kolay iade koşulları hakkında bilgi alın.',
  alternates: { canonical: '/guvenli-alisveris' },
  openGraph: {
    title: 'Güvenli Alışveriş — Ödeme ve Teslimat Güvencesi',
    description: 'İşyurtları’nda ödemeleriniz güvenli altyapı ile korunur. Adalet Bakanlığı işyurtları güvencesi, hızlı kargo ve kolay iade koşulları hakkında bilgi alın.',
    url: '/guvenli-alisveris',
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
