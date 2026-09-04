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

/**
 * Kategori kartlarinin renk gecisi.
 *
 * Renkler HomeClient ve kategori sayfasinda slug'a gore elle yazili
 * tablolardan geliyordu; tabloda karsiligi olmayan kategori GRI cikiyordu.
 * "Peyzaj" ve "Sanat & Zanaat" bu yuzden diger bes kartin yaninda soluk
 * duruyordu ve admin panelinden eklenen her yeni kategori de ayni hale
 * dusecekti.
 *
 * Tabloda olmayan kategoriler artik slug'a gore belirlenmis bir renk aliyor:
 * ayni kategori her zaman ayni rengi alir (rastgele degil), gri kalmaz.
 */
const YEDEK_GECISLER = [
  'from-emerald-500 to-teal-400',
  'from-blue-600 to-indigo-400',
  'from-amber-500 to-yellow-400',
  'from-violet-600 to-purple-400',
  'from-rose-500 to-pink-400',
  'from-cyan-500 to-blue-400',
  'from-orange-500 to-amber-400',
  'from-lime-600 to-green-400',
];

export function yedekGecis(slug: string): string {
  let toplam = 0;
  for (let i = 0; i < slug.length; i++) toplam = (toplam * 31 + slug.charCodeAt(i)) % 100000;
  return YEDEK_GECISLER[toplam % YEDEK_GECISLER.length];
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
