import type { ElementType } from 'react';
import {
  IconFood,
  IconTextile,
  IconWood,
  IconWeaving,
  IconFurniture,
  IconProductOrigin,
} from '@/components/Icons';

/**
 * Kategori slug'i -> ikon eslemesi.
 *
 * Ikon setinde kategoriye ozel yalnizca bes gorsel var (gida, tekstil, ahsap,
 * dokuma, mobilya). Listede olmayan her kategori - admin panelinden yeni
 * eklenenler dahil - notr IconProductOrigin ile gosteriliyor; boylece yeni
 * kategori ikon eksik diye gizlenmiyor, kirik da gorunmuyor.
 */
const IKONLAR: Record<string, ElementType> = {
  gida: IconFood,
  'gida-urunleri': IconFood,
  tekstil: IconTextile,
  'tekstil-urunleri': IconTextile,
  ahsap: IconWood,
  'ahsap-urunler': IconWood,
  'ahsap-urunleri': IconWood,
  dokuma: IconWeaving,
  'sanat-zanaat': IconWeaving,
  hediyelik: IconWeaving,
  mobilya: IconFurniture,
  'mobilya-urunleri': IconFurniture,
  'demir-metal-urunleri': IconFurniture,
  temizlik: IconProductOrigin,
};

export function kategoriIkonu(slug: string): ElementType {
  return IKONLAR[slug] ?? IconProductOrigin;
}

export type Kategori = {
  id: string;
  name: string;
  slug: string;
  urunSayisi: number;
  /** Admin panelinden yuklenen ikon. Yoksa yerlesik esleme kullanilir. */
  imageUrl: string | null;
};

/**
 * Baslik cubugu dar ekranlarda zaten yatay kayiyor, ama kategori sayisi
 * arttikca cubuk kullanilamaz hale geliyor. Uzun adlari kisaltiyoruz:
 * "Gida Urunleri" -> "Gida", "Temizlik ve Kozmetik" -> "Temizlik".
 *
 * Bu dosya istemci bilesenlerinden de import ediliyor; bu yuzden burada
 * veritabani veya sunucuya ozel hicbir sey bulunmamali.
 */
export function kisaAd(ad: string): string {
  return ad
    .replace(/\s+ürünleri$/i, '')
    .replace(/\s+ve\s+.*$/i, '')
    .trim();
}
