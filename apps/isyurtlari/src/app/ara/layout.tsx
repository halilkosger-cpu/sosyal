import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ürün Arama | İşyurtları Online Mağaza',
  description: 'İşyurtları online mağazasında ürün ara. Hükümlülerin el emeğiyle üretilen ürünlerde arama yapın.',
  keywords: 'işyurtları arama, ürün ara, işyurtları ürünleri',
  robots: 'noindex',
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
