import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { prisma } from '@isyurtlari/database';
import { hasDatabaseUrl } from './seo';
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

export const kategorileriGetir = unstable_cache(
  async (): Promise<Kategori[]> => {
    if (!hasDatabaseUrl()) return [];

    try {
      const satirlar = await prisma.productCategory.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          _count: { select: { products: true } },
        },
        orderBy: { name: 'asc' },
      });

      return satirlar.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        imageUrl: s.imageUrl,
        urunSayisi: s._count.products,
      }));
    } catch (error) {
      // Veritabani erisilemezse baslik cubugu bos kalsin; sayfa yine acilsin.
      console.error('Kategori listesi alinamadi:', error);
      return [];
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
