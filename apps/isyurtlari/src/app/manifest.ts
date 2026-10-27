import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'İsyurtları Online Mağaza',
    short_name: 'İsyurtları',
    description: 'Adalet Bakanlığı İşyurtları Kurumu el emeği ve doğal ürünler online satış mağazası.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#CC4E00',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
