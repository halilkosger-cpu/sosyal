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
 * degistirilmedi, yalnizca arka plan temizlendi. Son 98'i 30 Ekim 2026
 * katalog genislemesinin urun fotograflari.
 */
const YEREL = new Set([
  'ahsap-kutular',
  'el-yapimi-dogal-sabun',
  'erkek-parfumu-32-01',
  'erkek-parfumu-32-02',
  'erkek-parfumu-32-03',
  'gul-kolonyasi',
  'kadin-parfumu-32-01',
  'kadin-parfumu-32-02',
  'kadin-parfumu-32-03',
  'lavanta-kolonyasi',
  'sivi-sabun',
  'yuzey-temizleyici',
  'badem',
  'bal-ari-urunleri',
  'biber-receli',
  'biber-salcasi',
  'cekirdek',
  'cilek-receli',
  'domates-salcasi',
  'el-dokumasi-namazlik',
  'el-yapimi-ahsap-kitaplik',
  'el-yapimi-ahsap-lamba',
  'el-yapimi-akvaryum',
  'el-yapimi-bakir-islemeler',
  'el-yapimi-cini-ibik-ve-altlik',
  'el-yapimi-cini-minik-vazolar',
  'el-yapimi-cini-tabak',
  'el-yapimi-cini-vazo',
  'el-yapimi-comlekler',
  'el-yapimi-gumus-kehribar-tesbih',
  'el-yapimi-gumus-taki-seti',
  'el-yapimi-gumus-yuzukler',
  'el-yapimi-kahve-seti',
  'el-yapimi-kaktus',
  'el-yapimi-mumluk-samdan',
  'el-yapimi-oltu-tesbihler',
  'el-yapimi-oyma-pipo',
  'el-yapimi-porselen-cini-cay-seti',
  'el-yapimi-porselen-cini-hediyelikler',
  'el-yapimi-sedef-kaplamali-satranc-seti',
  'elma-agaci-fidani',
  'findik',
  'hasasezmesi',
  'incir-receli',
  'kavala-kurabiyesi',
  'kavurma',
  'kuru-baklagyller',
  'kuru-fasulye-tahillar',
  'peynir',
  'pirinc',
  'polen',
  'recel-cesitleri',
  'sari-uzum',
  'siyah-uzum',
  'siyah-zeytin',
  'tereyag',
  'uzum-pekmezi',
  'yerfistigi',
  'yesil-zeytin',
  'zeytinyagi',
  'zeytinyagi-500ml',
  'bez-canta-setleri',
  'taki-cantasi',
  'takı-cantasi',
  // 30 Ekim 2026 katalog genislemesi: isyurtlari urun fotograflari.
  'ademoda-visko-yastik-kilifi-60x40-cm',
  'adiyaman-narli-cevizli-sucuk-250-gr',
  'advem-cam-temizleyici-500-ml',
  'advem-cam-temizleyici-750-ml',
  'advem-genel-temizleyici-750-ml',
  'advem-gul-kolonyasi-400-ml',
  'advem-isparta-gul-oda-spreyi-400-ml',
  'advem-isparta-gul-sivi-sabun-470-ml',
  'advem-isparta-pembe-sise-urunu',
  'advem-japon-kirazi-cicegi-kolonyasi',
  'advem-kadin-parfumu-kutulu',
  'advem-lavantali-oda-spreyi-400-ml',
  'advem-sivi-camasir-deterjani-5-lt',
  'advem-sivi-el-sabunu-5-lt',
  'advem-vazelin',
  'advem-yag-cozucu-5-lt',
  'advem-yumusatici-5-lt',
  'ahsap-fici-kumbara',
  'ahsap-oyma-kutu',
  'cini-fincan-seti-kirmizi-kutulu',
  'cini-kutulu-set-kirmizi-kadife-kutu-fincan-kase',
  'el-kremi-beyaz-kavanoz',
  'elazig-dut-kurusu-500-gr',
  'elazig-gunkurusu-kayisi-500-gr',
  'elazig-mermer-islemeli-ahsap-kutu',
  'elazig-mermer-kosk-saat-kucuk',
  'elban-adiyaman-besni-sari-kuru-uzum-250-gr',
  'elban-adiyaman-karisik-cerez-400-gr',
  'elban-adiyaman-karisik-cerez-400-gr-paket',
  'elban-adiyaman-osmanli-dibek-kahvesi-200-gr',
  'elban-akhisar-acik-cik-3-no-siyah-zeytin-1000-gr-plastik',
  'elban-akhisar-acik-cik-no1-siyah-zeytin-teneke-1-kg',
  'elban-antep-fistigi-100-gr',
  'elban-bogurtlen-receli-pet-kavanoz-1000-gr',
  'elban-cilek-receli-cam-kavanoz-420-gr',
  'elban-cilek-receli-pet-kavanoz-1000-gr',
  'elban-elazig-islenmis-kuru-kayisi-500-gr',
  'elban-elazig-kuru-uzum-500-gr',
  'elban-espiye-ic-findik-kavrulmus-100-gr',
  'elban-filtre-kahve-250-gr',
  'elban-foca-naturel-sizma-zeytinyagi-5-lt',
  'elban-gemlik-acik-yagli-sele-siyah-zeytin-1-kg-pet',
  'elban-gul-lokumu-antep-fistikli-450-gr',
  'elban-gul-lokumu-findikli-450-gr',
  'elban-gul-receli-cam-kavanoz-420-gr',
  'elban-iskele-tuzlu-leblebi',
  'elban-kahramanmaras-acik-kuru-pasta-sekerli-450-gr',
  'elban-karadut-receli-cam-kavanoz-420-gr',
  'elban-kizilcik-receli-420-gr',
  'elban-nazilli-3-numara-siyah-zeytin-900-gr',
  'elban-osmancik-pirinc-1-kg',
  'elban-osmancik-pirinc-2-kg',
  'elban-salgam-suyu-acili',
  'elban-salihli-corekotu-yagi-100-cc-cam-sise',
  'elban-salihli-kuru-uzum-400-gr',
  'elban-sivas-un-kurabiyesi-200-gr',
  'elban-tam-yagli-beyaz-peynir-1-kg',
  'elban-tam-yagli-kasar-peyniri-500-gr',
  'elban-tarsus-cik-findikli-cezerye-500-gr',
  'elban-tokat-salamura-asma-yapragi-900-gr',
  'elban-turkoglu-acik-isot-250-gr',
  'elban-turkoglu-acik-karabiber-250-gr',
  'elban-turkoglu-acik-kimyon-100-gr',
  'elban-turkoglu-acik-nane-40-gr',
  'elban-turkoglu-acik-pul-biber-500-gr',
  'elban-visne-receli-cam-kavanoz-420-gr',
  'espiye-ic-findik-naturel-cig-1000-gr',
  'espiye-kavrulmus-tuzlu-findik-100-gr',
  'foca-m-yumurta',
  'gaziantep-acik-bakir-islemeli-cira',
  'kahramanmaras-susamli-cubuk-450-gr',
  'kalkandere-sayili-gun-rize-cayi-1000-gr',
  'kutulu-cini-tabak-sari-desenli-kadife-kutu',
  'mermer-taraftar-plaketi-fenerbahce',
  'mina-bebek-oyuncak-bebek-geleneksel-kiyafetli',
  'nigde-elma-sirkesi-500-ml',
  'nigde-elma-suyu-330-ml',
  'odosun-espiye-80-findik-ezmesi-300-gr-cam',
  'odosun-espiye-findik-parcacikli-kakaolu-krema-300-gr',
  'odosun-espiye-findikli-krokan-150-gr',
  'tokat-bez-sucugu-acisiz',
  'toprakkale-barbunya-1-kg',
  'toprakkale-beyaz-leblebi-100-gr',
  'toprakkale-biber-salcasi-1500-gr-pet',
  'toprakkale-findik-ici-100-gr',
  'toprakkale-siyah-dakota-cekirdegi-100-gr',
  'toprakkale-tuzlu-yer-fistigi-100-gr',
  'toprakkale-yesil-mercimek-1-kg',
  'yogurt-4-kg-kovasi',
  'yoresel-kahramanmaras-coregi-450-gr',
  'zenbay-kutahya-25-cm-cini-tabak',
  'zenbay-kutahya-cini-buhurdanlik',
  'zenbay-kutahya-cini-fincan-seti-kutulu',
  'zenbay-kutahya-cini-kandil',
  'zenbay-kutahya-cini-sekerlik',
  'zenbay-kutahya-cini-tabak-mavi-kenarli-15-cm',
  'zenbay-kutahya-kucuk-cini-saksi',
  'zenbay-kutahya-kucuk-cini-saksi-cicek-desenli',
]);

/**
 * Ayni kume, Prisma `where` icinde kullanilabilsin diye dizi olarak.
 * Vitrin gorunurluk kurali bunu okuyor; bkz. lib/urun-gorunurluk.ts.
 */
export const YEREL_GORSELLI_SLUGLAR: string[] = Array.from(YEREL);

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
