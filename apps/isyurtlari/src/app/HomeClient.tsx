'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuArrowRight, LuInfo, LuHammer, LuGraduationCap, LuRotateCcw } from 'react-icons/lu';
import UrunKarti from '@/components/UrunKarti';
import KategoriIkon from '@/components/KategoriIkon';
import { IconFood, IconTextile, IconWood, IconWeaving, IconFurniture } from '@/components/Icons';
import { content } from '@/config/content';

/**
 * Ana sayfa - 2026 Eylul, editoryel duzen.
 *
 * ─── DUZEN ────────────────────────────────────────────────────────────
 *
 * Turuncu duyuru seridi / krem hero (solda buyuk baslik, sagda uc urunun
 * ust uste binen kumesi) / lacivert guven bandi / kategori satiri /
 * kampanyalar / sakin urun izgarasi / SEO metni.
 *
 * ─── NEDEN DEGISTI ────────────────────────────────────────────────────
 *
 * Onceki hero tam genislikte tek bir fotografti ve uzerine uc beyaz
 * istatistik kutusu biniyordu. Iki sorunu vardi:
 *
 *  1) Fotograf Higgsfield ile uretilmis bir sahneydi; sattigimiz urunler
 *     degildi. Artik hero'daki uc gorsel katalogdaki GERCEK urunlerin
 *     fotograflari (bakir sahan, cini tabak, uzum pekmezi) ve her biri
 *     public/urun/ altindaki boyutlandirilmis WebP.
 *  2) Istatistik kutularindaki rakamlar ("70.000+ hukumlu", "500+ urun")
 *     bu sitenin dogrulayabilecegi sayilar degildi. Yerlerine yalnizca
 *     dogrulanabilir uc madde tasiyan lacivert bant geldi: uretim yeri,
 *     ucret ve meslek, 14 gun cayma hakki.
 *
 * ─── KORUNAN SEYLER ───────────────────────────────────────────────────
 *
 *  - H1 aynen duruyor: "işyurtları", "cezaevi ürünleri" aramalarinin
 *    hedefi o cumle.
 *  - Sayfanin altindaki SEO metni ve kampanya bolumu degismedi.
 *  - Urun kartlari tukenmis / fiyatsiz durumu gizlemiyor.
 */

interface Category { id: string; name: string; slug: string; }
interface Product  { id: string; name: string; slug: string; price: number; quantity: number; imageUrl?: string; category: { name: string; slug: string }; }
interface CampaignProduct { productId: string; discount: number; product: Product; }
interface Campaign { id: string; name: string; products: CampaignProduct[]; }

/** Gorseli olmayan urunde kutu emojisi yerine kategorinin ikonu. */
const urunYedekIkonu: Record<string, React.ElementType> = {
  'gida': IconFood, 'gida-urunleri': IconFood,
  'tekstil': IconTextile, 'tekstil-urunleri': IconTextile,
  'ahsap': IconWood, 'ahsap-urunler': IconWood, 'peyzaj': IconWood,
  'hediyelik': IconWeaving, 'sanat-zanaat': IconWeaving, 'temizlik': IconWeaving, 'dokuma': IconWeaving,
};
const urunYedegi = (slug?: string) => {
  const Icon = (slug && urunYedekIkonu[slug]) || IconFurniture;
  return <Icon className="w-20 h-20 object-contain opacity-90" />;
};

/**
 * Hero'daki urun kumesi. Katalogdaki gercek urunlerin boyutlandirilmis
 * surumleri (bkz. lib/urun-gorsel.ts). Dosyalar public/urun/ altinda
 * durdugu icin urun veritabanindan kalksa bile hero bozulmuyor.
 */
const HERO_KUMESI = [
  { dosya: 'el-yapimi-bakir-islemeler', alt: 'El yapımı bakır sahan', sinif: 'w-[62%] left-0 top-[4%]' },
  { dosya: 'el-yapimi-cini-tabak',      alt: 'El yapımı çini tabak',  sinif: 'w-[48%] right-[2%] top-0' },
  { dosya: 'uzum-pekmezi',              alt: 'Yaş üzüm pekmezi',      sinif: 'w-[40%] right-[12%] bottom-0' },
];

/**
 * Guven bandi. Her madde dogrulanabilir: ilk ikisi uretimin kendisi,
 * ucuncusu Mesafeli Sozlesmeler Yonetmeligi'nden gelen yasal hak.
 * Kanit isteyen hicbir iddia (garanti, kalite, saglik) yok.
 */
const GUVEN = [
  { Icon: LuHammer,        baslik: 'Atölyede üretiliyor', alt: 'Ürünler Adalet Bakanlığı İşyurtları Genel Müdürlüğü atölyelerinde üretiliyor.' },
  { Icon: LuGraduationCap, baslik: 'Ücret ve meslek',     alt: 'Atölyelerde çalışan hükümlüler ücret karşılığı çalışıyor ve bir meslek öğreniyor.' },
  { Icon: LuRotateCcw,     baslik: '14 gün cayma hakkı',  alt: 'Teslim tarihinden itibaren 14 gün içinde cayma hakkınız var.' },
];

const indirimliFiyat = (fiyat: number, indirim: number) =>
  Math.round(fiyat * (1 - indirim / 100) * 100) / 100;

interface BaslangicVeri {
  baslangicKategoriler?: Category[] | null;
  baslangicUrunler?: Product[] | null;
  baslangicKampanyalar?: Campaign[] | null;
}

export default function HomeClient({
  baslangicKategoriler = null,
  baslangicUrunler = null,
  baslangicKampanyalar = null,
}: BaslangicVeri) {
  const [categories, setCategories] = useState<Category[]>(baslangicKategoriler ?? []);
  const [products,   setProducts]   = useState<Product[]>(baslangicUrunler ?? []);
  const [campaigns,  setCampaigns]  = useState<Campaign[]>(baslangicKampanyalar ?? []);
  const [loading,    setLoading]    = useState(!baslangicUrunler);

  useEffect(() => {
    // Veri sunucudan hazir geldiyse uc istegi tekrar yapmaya gerek yok
    if (baslangicUrunler) return;
    Promise.all([
      fetch('/api/categories').then((r) => r.json()).catch(() => []),
      fetch('/api/products').then((r) => r.json()).catch(() => []),
      fetch('/api/campaigns/active').then((r) => r.json()).catch(() => []),
    ]).then(([cats, prods, camps]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods.filter((p: Product) => p.imageUrl).slice(0, 8) : []);
      setCampaigns(Array.isArray(camps) ? camps : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [baslangicUrunler]);

  const kampanyaKartlari = campaigns.flatMap((k) =>
    k.products.filter((cp) => cp.product.imageUrl).slice(0, 8).map((cp) => ({
      ...cp.product,
      campaign: { discount: cp.discount, discountedPrice: indirimliFiyat(cp.product.price, cp.discount) },
    }))
  );

  const tumUrunler = `/${categories[0]?.slug ?? 'gida'}`;

  return (
    <div className="min-h-screen bg-white">

      {/* ─── DUYURU ŞERİDİ ───
          Marka turuncusu #CC4E00 beyaz yaziyla 4.5:1 kontrast veriyor. */}
      <div className="bg-[#CC4E00] text-white">
        <p className="max-w-screen-xl mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm md:text-[15px] font-semibold">
          <span aria-hidden="true">✦</span>
          {content.home.announcements[0]}
          <span aria-hidden="true">✦</span>
        </p>
      </div>

      {/* ─── HERO ─── */}
      <section className="bg-gradient-to-br from-[#F6EADB] via-[#EFE0CD] to-[#E7D4BD] border-b border-[#E3D5C2]">
        <div className="max-w-screen-xl mx-auto px-4 py-10 md:py-16 grid gap-10 md:gap-12 md:grid-cols-[1.05fr_.95fr] md:items-center">

          <div>
            <p className="flex items-center gap-3 text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-[#A63F00] mb-4">
              El emeği · Tek elden
              <span className="h-px flex-1 max-w-[90px] bg-current opacity-35" aria-hidden="true" />
            </p>

            {/* Slogan gorsel; basligin kendisi asagidaki H1. */}
            <p className="font-serif text-[2.5rem] md:text-[3.8rem] leading-[1.02] font-bold text-[#141B2D] tracking-tight" aria-hidden="true">
              {content.home.hero.title}.
              <br />
              {content.home.hero.titleHighlight}.{' '}
              <span className="text-[#CC4E00]">{content.home.hero.titleSuffix}.</span>
            </p>

            <h1 className="mt-5 text-[15px] md:text-base font-normal leading-relaxed text-gray-700 max-w-lg">
              Hükümlülerin El Emeğiyle Üretilen Ürünler{' '}
              <span className="font-semibold text-gray-900">İsyurtları</span> Cezaevi &amp; Hapishane Online Mağazası
            </h1>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={tumUrunler} className="inline-flex items-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] text-white text-sm font-semibold px-5 py-3 rounded-lg transition-colors">
                Ürünleri keşfet <LuArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/hakkimizda" className="inline-flex items-center gap-2 border border-[#141B2D]/25 text-[#141B2D] hover:bg-white/60 text-sm font-semibold px-5 py-3 rounded-lg transition-colors">
                Nasıl üretiliyor <LuInfo className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Urun kumesi: uc gercek urun, ust uste binen yerlesim. */}
          <div className="relative aspect-[1/0.92] max-w-[460px] w-full mx-auto md:mx-0 md:max-w-none">
            {HERO_KUMESI.map(({ dosya, alt, sinif }, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={dosya}
                src={`/urun/${dosya}-800.webp`}
                srcSet={`/urun/${dosya}-400.webp 400w, /urun/${dosya}-800.webp 800w`}
                sizes="(max-width: 768px) 50vw, 25vw"
                alt={alt}
                width={800}
                height={800}
                className={`absolute rounded-sm shadow-[0_18px_44px_-18px_rgba(20,27,45,0.42)] ${sinif}`}
                decoding="async"
                fetchPriority={i === 0 ? 'high' : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── GÜVEN BANDI ───
          Uc madde de dogrulanabilir; kanit isteyen iddia yok. */}
      <section className="bg-[#0F2040] text-[#EDE6DA]">
        <div className="max-w-screen-xl mx-auto px-4 py-6 grid gap-6 sm:grid-cols-3">
          {GUVEN.map(({ Icon, baslik, alt }) => (
            <div key={baslik} className="flex items-start gap-3">
              <Icon className="w-5 h-5 shrink-0 mt-0.5 text-[#F0955A]" strokeWidth={1.75} aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-white leading-tight">{baslik}</h2>
                <p className="text-[13px] text-[#B9C0CE] leading-snug mt-1">{alt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── KATEGORİLER ───
          Mobilde yana kaydirilan satir; genis ekranda tek satir. */}
      <section className="max-w-screen-xl mx-auto px-4 pt-10" aria-label="Kategoriler">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] sm:overflow-visible">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className="group w-32 shrink-0 snap-start sm:w-auto flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200/80 bg-gradient-to-b from-[#FFFBF6] to-[#F7EFE5] hover:border-orange-200 hover:shadow-lg hover:-translate-y-0.5 px-2 pt-3 pb-4 text-center transition-all duration-200"
              >
                <KategoriIkon
                  slug={cat.slug}
                  className="w-16 h-16 md:w-20 md:h-20 drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                />
                <span className="text-sm font-semibold text-gray-800 leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── KAMPANYALAR (yalnizca aktif kampanya varsa) ─── */}
      {kampanyaKartlari.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 pt-12">
          <h2 className="font-serif text-2xl md:text-[1.9rem] font-semibold text-gray-900 tracking-tight mb-5">Kampanyadaki Ürünler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
            {kampanyaKartlari.slice(0, 8).map((u) => (
              <UrunKarti
                key={u.id}
                urun={u}
                kompakt
                favoriButonu={false}
                gorselYedek={urunYedegi(u.category?.slug)}
                gorselArkaPlani="from-white to-[#F7F2EA]"
                gorselYuksekligi="aspect-square"
                gorselBoyutlari="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 300px"
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── EL EMEĞİ ÜRÜNLER ───
          Kare kadraj ve genis satir araligi: kartlar birbirine
          yapismiyor, fotograflar ayni oranda duruyor. */}
      <section className="max-w-screen-xl mx-auto px-4 pt-12">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
          <h2 className="font-serif text-2xl md:text-[1.9rem] font-semibold text-gray-900 tracking-tight">El emeği ürünler</h2>
          <Link href={tumUrunler} className="inline-flex items-center gap-1.5 text-[#BA4700] hover:text-[#8F3700] text-sm font-semibold">
            Tümünü gör <LuArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading || products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
            {products.filter((p) => p.category).map((product, sira) => (
              <UrunKarti
                key={product.id}
                urun={product}
                kompakt
                favoriButonu={false}
                gorselYedek={urunYedegi(product.category.slug)}
                gorselArkaPlani="from-white to-[#F7F2EA]"
                gorselYuksekligi="aspect-square"
                gorselBoyutlari="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 300px"
                gorselOncelikli={sira < 4}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── SEO AÇIKLAMA METNİ ───
          Arama motoru sayfanin ne sattigini ve fiyatlarin nasil islediğini
          buradan okuyor. Metin degistirilmedi, gorunum sadelestirildi. */}
      <section className="mt-14 bg-[#FAFAF9] border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="font-serif text-xl font-semibold text-gray-900 tracking-tight mb-4">
            Cezaevi Satış Mağazası Fiyatları Hakkında
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-gray-600">
            <p>
              İsyurtları, Adalet Bakanlığı işyurtlarındaki meslek eğitim atölyelerinde üretilen
              ürünleri doğrudan alıcıyla buluşturan bir online satış platformudur. Sitedeki
              <strong className="font-semibold text-gray-800"> işyurtları online satış</strong>{' '}
              kataloğunda gıda, tekstil, ahşap, hediyelik, temizlik ve el sanatları kategorileri
              yer alır. Her ürün, bir hükümlünün meslek eğitimi sürecinde ortaya çıkar; satın
              aldığınız parça hem elinizde bir ürün hem de birinin yeniden başlamasına verilmiş
              bir destektir.
            </p>
            <p>
              Ürün sayfalarında gördüğünüz tutarlar KDV dahildir ve mağaza yönetim panelinden
              değiştirildiği anda sitede yayına girer; yani karşınızdaki{' '}
              <strong className="font-semibold text-gray-800">güncel fiyat listesi</strong>, o
              anki geçerli fiyatlardır. Fiyatı henüz belirlenmemiş ürünlerde tutar yerine &quot;Fiyat
              belirleniyor&quot; ifadesi görürsünüz ve bu ürünler sepete eklenemez. Gönderiler karşı
              ödemeli yapılır: kargo ücreti sipariş toplamına dahil değildir, teslimat sırasında
              kargo firmasına ödenir.
            </p>
            <p>
              Aradığınız ürün o an stokta değilse ürün kartındaki &quot;Ön Talep&quot; bağlantısını
              kullanabilirsiniz; stok geldiğinde size haber veririz. Kategori sayfalarından fiyat
              aralığına ve stok durumuna göre süzerek{' '}
              <strong className="font-semibold text-gray-800">cezaevi ürünleri</strong> arasında
              size uygun olanı bulabilir, siparişinizin durumunu sipariş numaranız ve e-posta
              adresinizle Sipariş Sorgula sayfasından takip edebilirsiniz.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
