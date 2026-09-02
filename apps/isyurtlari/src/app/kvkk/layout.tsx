import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: 'İşyurtları olarak kişisel verilerinizi nasıl işlediğimizi, hangi amaçlarla kullandığımızı ve haklarınızı açıklayan KVKK aydınlatma metni.',
  alternates: { canonical: '/kvkk' },
  openGraph: {
    title: 'KVKK Aydınlatma Metni',
    description: 'İşyurtları olarak kişisel verilerinizi nasıl işlediğimizi, hangi amaçlarla kullandığımızı ve haklarınızı açıklayan KVKK aydınlatma metni.',
    url: '/kvkk',
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
