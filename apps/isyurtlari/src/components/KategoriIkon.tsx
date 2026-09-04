import { kategoriIkonu } from '@/lib/kategori-gorunum';

/**
 * Kategori ikonu.
 *
 * Once admin panelinden yuklenen ikona bakar; yoksa slug'a gore yerlesik
 * esleme tablosuna duser. Boylece yeni eklenen bir kategori ikon yuklenene
 * kadar notr bir gorselle cikar, ikon yuklenince kendiliginden degisir.
 *
 * Hook kullanmadigi icin hem sunucu hem istemci bilesenlerinden cagrilabiliyor.
 */
export default function KategoriIkon({
  slug,
  imageUrl,
  className = 'w-6 h-6',
}: {
  slug: string;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    // next/image kullanilmiyor: images.unoptimized acik oldugu icin bir fayda
    // saglamiyor, SVG ikonlarda ise ek olcu kisitlari getiriyor.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className={`${className} object-contain`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  const Yerlesik = kategoriIkonu(slug);
  return <Yerlesik className={className} />;
}
