import type { ElementType } from 'react';
import { IconFood, IconTextile, IconWood, IconWeaving, IconFurniture } from '@/components/Icons';

/** Gorseli olmayan urunde kutu emojisi yerine kategorinin ikonu. */
const urunYedekIkonu: Record<string, ElementType> = {
  'gida': IconFood, 'gida-urunleri': IconFood,
  'tekstil': IconTextile, 'tekstil-urunleri': IconTextile,
  'ahsap': IconWood, 'ahsap-urunler': IconWood, 'peyzaj': IconWood,
  'hediyelik': IconWeaving, 'sanat-zanaat': IconWeaving, 'temizlik': IconWeaving, 'dokuma': IconWeaving,
};
export const urunYedegi = (slug?: string) => {
  const Icon = (slug && urunYedekIkonu[slug]) || IconFurniture;
  return <Icon className="w-20 h-20 object-contain opacity-90" />;
};
