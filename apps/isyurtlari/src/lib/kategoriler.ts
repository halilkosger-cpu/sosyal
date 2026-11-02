import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { prisma } from '@isyurtlari/database';
import { hasDatabaseUrl } from './seo';
import { GORSELLI_URUN } from './urun-gorunurluk';
import type { Kategori } from './kategori-gorunum';

/**
 * Kategori listesinin tek kaynagi.
 *
 * Onceden baslik cubugundaki kategoriler layout.tsx icine elle yazilmisti.
 * Bu yuzden admin panelinden eklenen kategori sitede hic gorunmuyor, silinen
 * kategori ise 404 veren olu bag olarak kaliyordu.
 *
 * Sorgu unstable_cache ile sarmalandi: boylece kok layout her sayfada
 * veritabanina gitmek zorunda kalmiyor ve statik uretilen sayfalar statik
 * kalmaya devam ediyor. Admin panelinden kategori eklenip silindiginde
 * kategorileriTazele() cagriliyor, degisiklik aninda yansiyor.
 */
export const KATEGORI_ETIKETI = 'kategoriler';

// Tip ve gorunum yardimcilari kategori-gorunum.ts'te: bu dosya prisma ve
// next/cache iceriyor, istemci bilesenlerinden import edilemez.
export type { Kategori } from './kategori-gorunum';

export const VARSAYILAN_KATEGORILER: Kategori[] = [
  { id: 'kat_gida', name: 'Gıda', slug: 'gida', urunSayisi: 12, imageUrl: null },
  { id: 'kat_tekstil', name: 'Tekstil', slug: 'tekstil', urunSayisi: 8, imageUrl: null },
  { id: 'kat_ahsap', name: 'Ahşap', slug: 'ahsap', urunSayisi: 6, imageUrl: null },
  { id: 'kat_hediyelik', name: 'Hediyelik', slug: 'hediyelik', urunSayisi: 7, imageUrl: null },
  { id: 'kat_temizlik', name: 'Temizlik', slug: 'temizlik', urunSayisi: 5, imageUrl: null },
  { id: 'kat_sanat', name: 'Sanat & Zanaat', slug: 'sanat-zanaat', urunSayisi: 4, imageUrl: null },
  { id: 'kat_peyzaj', name: 'Peyzaj', slug: 'peyzaj', urunSayisi: 3, imageUrl: null },
];

export const kategorileriGetir = unstable_cache(
  async (): Promise<Kategori[]> => {
    if (!hasDatabaseUrl()) return VARSAYILAN_KATEGORILER;

    try {
      const satirlar = await prisma.productCategory.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          // Sayim yalnizca vitrinde gorunen urunleri kapsiyor; bkz.
          // lib/urun-gorunurluk.ts.
          _count: { select: { products: { where: GORSELLI_URUN } } },
        },
        orderBy: { name: 'asc' },
      });

      const sonuc = satirlar
        .filter((s) => s._count.products > 0)
        .map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          imageUrl: s.imageUrl,
          urunSayisi: s._count.products,
        }));

      return sonuc.length > 0 ? sonuc : VARSAYILAN_KATEGORILER;
    } catch (error) {
      console.error('Kategori listesi alinamadi:', error);
      return VARSAYILAN_KATEGORILER;
    }
  },
  ['kategori-listesi'],
  { tags: [KATEGORI_ETIKETI], revalidate: 300 }
);

/**
 * Kategori ya da urun degistiginde cagrilir.
 *
 * Iki ayri onbellegi tazeler:
 *  - Kategori listesi etiketi: baslik cubugu ve kategori kenar cubugu
 *  - /sitemap.xml: derleme aninda uretilen statik dosya. Icerik admin
 *    panelinden ekleniyor ve haftalarca deploy olmayabilir; tazelenmezse
 *    yeni kategori ve urunler bir sonraki deploy'a kadar sitemap'e girmez.
 */
export function icerikTazele() {
  revalidateTag(KATEGORI_ETIKETI);
  revalidatePath('/sitemap.xml');

  /**
   * Kategori sayfalari artik ISR ile saklaniyor (bkz. [categorySlug]/page.tsx,
   * revalidate = 300). Tazelenmezse yonetim panelinden eklenen urun bes
   * dakikaya kadar kategori sayfasinda gorunmezdi. 'page' turu bu rotanin
   * TUM ornekleri icin gecerli - her kategori slug'ini tek tek saymak
   * gerekmiyor.
   */
  revalidatePath('/[categorySlug]', 'page');

  /**
   * Ana sayfa ve urun sayfalari da ISR ile saklaniyor. 'page' turu bir
   * rotanin TUM ornekleri icin gecerli; her urun slug'ini tek tek saymak
   * gerekmiyor.
   *
   * Dikkat: bu islev ISR'nin dogru calismasinin sarti. Fiyat guncelleme ve
   * kampanya uclari onceden bunu HIC cagirmiyordu - force-dynamic oldugu
   * icin fark edilmiyordu, sayfa zaten her istekte yeniden uretiliyordu.
   * ISR'ye gecerken o uclara da eklendi.
   */
  revalidatePath('/');
  revalidatePath('/urun/[slug]', 'page');
}
