/**
 * Urun gorsellerinin yerel, boyutlandirilmis surumleri.
 *
 * ─── NEDEN ────────────────────────────────────────────────────────────
 *
 * Urun gorselleri Vercel Blob'da tek boyutta duruyordu ve
 * next.config.js'te `images.unoptimized: true` acik (Vercel kotasi icin).
 * Ikisi birlikte sunu yapiyordu: telefondan giren ziyaretci de, 150x150
 * pikselde gorunen bir urun karti icin 1000 piksel genisliginde ~100 KB'lik
 * JPEG indiriyordu. Ne AVIF/WebP pazarligi vardi ne de srcset.
 *
 * Cozum calisma zamaninda degil, onceden: her urunun 400 / 800 / 1024
 * piksel WebP surumu uretilip public/urun/ altina konuyor. Olculen sonuc:
 * 400 piksel surum ortalama 15 KB, 800 piksel 47 KB. Yani mobil izgarada
 * indirilen bayt yaklasik yediye bolunuyor ve Next'in goruntu
 * optimizasyonuna (dolayisiyla kotaya) hic dokunulmuyor.
 *
 * ─── NEDEN VERITABANI DEGISMIYOR ──────────────────────────────────────
 *
 * Product.imageUrl'e dokunulmuyor. Sebebi kategori ikonlariyla ayni
 * (bkz. lib/kategori-gorunum.ts): eslesme kodda durursa gorsel eklemek ya
 * da geri almak bir deploy meselesi olur, veri tasima isi olmaz. Listede
 * olmayan urun eskisi gibi imageUrl ile calismaya devam eder.
 */

/**
 * Yerel surumu uretilmis urunler.
 *
 * Listenin ilk 49'u Higgs'te yeniden sahnelenen urun fotograflari.
 * Sonraki 12'si Adalet Bakanligi Isyurtlari'nin resmi urun galerisinden
 * alinip ayni krem zemine tasinan gercek urun fotograflari; etiketler
 * degistirilmedi, yalnizca arka plan temizlendi.
 */
const YEREL = new Set(); // Tüm ürünler imageUrl'le cevap verir, YEREL boş

/**
 * Ayni kume, Prisma `where` icinde kullanilabilsin diye dizi olarak.
 * Vitrin gorunurluk kurali bunu okuyor; bkz. lib/urun-gorunurluk.ts.
 */
export const YEREL_GORSELLI_SLUGLAR: string[] = Array.from(YEREL) as string[];

/** Uretilen genislikler. Kaynak 1024 piksel; buyutme yapilmiyor. */
export const GORSEL_BOYUTLARI = [400, 800, 1024] as const;

/** Kartlarda ve galeride kullanilacak varsayilan kaynak. */
export function urunGorseli(slug: string, imageUrl?: string | null): string | undefined {
  if (YEREL.has(slug)) return `/urun/${slug}-800.webp`;
  return imageUrl ?? undefined;
}

/**
 * srcset dizgesi. Yerel surumu olmayan urun icin undefined doner; o zaman
 * <img> yalnizca src ile calisir, davranis degismez.
 */
export function urunSrcSet(slug: string, imageUrl?: string | null): string | undefined {
  if (YEREL.has(slug)) return GORSEL_BOYUTLARI.map((g) => `/urun/${slug}-${g}.webp ${g}w`).join(', ');
  return yuklenenSrcSet(imageUrl);
}

/** Admin yuklemesinde uretilen <ad>-400/800/1024.webp ailesi. */
const YUKLENEN_DESEN = /-1024\.webp$/;

export function yuklenenSrcSet(imageUrl?: string | null): string | undefined {
  if (!imageUrl || !YUKLENEN_DESEN.test(imageUrl)) return undefined;
  const taban = imageUrl.replace(YUKLENEN_DESEN, '');
  return GORSEL_BOYUTLARI.map((g) => `${taban}-${g}.webp ${g}w`).join(', ');
}

/** Yerel surumu var mi? */
export const yerelGorselVar = (slug: string) => YEREL.has(slug);
