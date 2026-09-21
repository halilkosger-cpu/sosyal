'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UrunKarti from '@/components/UrunKarti';
import {
  IconFood, IconTextile, IconWood, IconWeaving, IconFurniture,
  IconSuccess, IconWeekSpecial, IconTransfer, IconFastShipping,
  IconSocialContribution, IconEasyReturn, IconMinistryJustice,
  IconOrderTracking, IconVocationalTraining, IconProductOrigin,
} from '@/components/Icons';
import { content } from '@/config/content';
import { yedekGecis } from '@/lib/kategori-gorunum';

/**
 * Ana sayfa - 2026 Eylul yeniden tasarimi.
 *
 * Duzen: acik renkli hero (slogan + SEO basligi + gercek urun gorselleri),
 * istatistik kutulari, guvence seridi, kategori kutulari, kampanyalar,
 * "El Emegi Urunler" vitrini, sosyal etki bandi, SEO metni.
 *
 * Arka plan videosu kaldirildi: sayfanin en buyuk boyamasi (LCP) artik
 * sunucuda secilen bir urun gorseli; mobilde megabaytlarca video inmiyor.
 *
 * H1 METNI DEGISTIRILMEDI. Site "işyurtları", "cezaevi ürünleri" gibi
 * aramalarda bu baslikla siralaniyor; slogan gorsel olarak one cikiyor ama
 * baslik etiketi degil.
 *
 * Guvence seridindeki her madde sitenin gercek isleyisine dayaniyor
 * (14 gun cayma hakki, siparis takibi, Turkiye geneline gonderim, kamu
 * kurumu). Dogrulanamayan bir teslim suresi ya da odeme guvencesi
 * YAZILMAMALI - taahhut tuketici mevzuatinda baglayici.
 */

interface Category { id: string; name: string; slug: string; }
interface Product  { id: string; name: string; slug: string; price: number; quantity: number; imageUrl?: string; category: { name: string; slug: string }; }
interface CampaignProduct { productId: string; discount: number; product: Product; }
interface Campaign { id: string; name: string; products: CampaignProduct[]; }

const categoryConfig: Record<string, { Icon: React.ElementType; gradient: string; purpose: string }> = {
  // Eski slug format (uyumluluk için)
  'gida-urunleri':        { Icon: IconFood,      gradient: 'from-emerald-500 to-teal-400',  purpose: 'Beslenme & Aşçılık Eğitimi' },
  'tekstil-urunleri':     { Icon: IconTextile,   gradient: 'from-blue-600 to-indigo-400',   purpose: 'Terzilik Meslek Eğitimi' },
  'ahsap-urunler':        { Icon: IconWood,      gradient: 'from-amber-500 to-yellow-400',  purpose: 'Marangozluk Beceri Programı' },
  'dokuma':               { Icon: IconWeaving,   gradient: 'from-violet-600 to-purple-400', purpose: 'Dokuma & Sanat Terapisi' },
  'mobilya-urunleri':     { Icon: IconFurniture, gradient: 'from-rose-500 to-pink-400',     purpose: 'Mobilya Tasarım Eğitimi' },
  'demir-metal-urunleri': { Icon: IconFurniture, gradient: 'from-slate-600 to-slate-400',   purpose: 'Metal İşleri Ustası Programı' },
  // Yeni slug format (seed script'ten)
  'gida':                 { Icon: IconFood,      gradient: 'from-emerald-500 to-teal-400',  purpose: 'Beslenme & Aşçılık Eğitimi' },
  'tekstil':              { Icon: IconTextile,   gradient: 'from-blue-600 to-indigo-400',   purpose: 'Terzilik Meslek Eğitimi' },
  'ahsap':                { Icon: IconWood,      gradient: 'from-amber-500 to-yellow-400',  purpose: 'Marangozluk Beceri Programı' },
  'temizlik':             { Icon: IconWeaving,   gradient: 'from-cyan-500 to-blue-400',     purpose: 'Temizlik & Kozmetik Eğitimi' },
  'hediyelik':            { Icon: IconWeaving,   gradient: 'from-rose-500 to-pink-400',     purpose: 'El Sanatları & Tasarım' },
  'peyzaj':               { Icon: IconWood,      gradient: 'from-green-500 to-emerald-400', purpose: 'Peyzaj & Çiçek Tasarımı' },
  'peyzaj-cicek':         { Icon: IconWood,      gradient: 'from-green-500 to-emerald-400', purpose: 'Peyzaj & Çiçek Tasarımı' },
  'sanat-zanaat':         { Icon: IconWeaving,   gradient: 'from-violet-600 to-purple-400', purpose: 'El Sanatları & Yaratıcı Üretim' },
};

const announcements = content.home.announcements;
const statIkonlari = [IconVocationalTraining, IconProductOrigin, IconSocialContribution];

const guvenceler = [
  { Icon: IconFastShipping,    baslik: 'Türkiye Geneline Gönderim', aciklama: 'Kargo ücreti teslimatta ödenir' },
  { Icon: IconEasyReturn,      baslik: '14 Gün Cayma Hakkı',        aciklama: 'Teslimden itibaren iade imkânı' },
  { Icon: IconOrderTracking,   baslik: 'Sipariş Takibi',            aciklama: 'Kargo takip numarasıyla izleyin' },
  { Icon: IconMinistryJustice, baslik: 'Kamu Kurumu Güvencesi',     aciklama: 'Adalet Bakanlığı İşyurtları Kurumu' },
];

/** Gorseli olmayan urunde kutu emojisi yerine kategorinin ikonu. */
const urunYedegi = (slug?: string) => {
  const Icon = (slug && categoryConfig[slug]?.Icon) || IconFurniture;
  return <Icon className="w-24 h-24 object-contain opacity-90" />;
};

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
  const [ticker,     setTicker]     = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTicker((t) => (t + 1) % announcements.length), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Veri sunucudan hazir geldiyse uc istegi tekrar yapmaya gerek yok
    if (baslangicUrunler) return;
    Promise.all([
      fetch('/api/categories').then((r) => r.json()).catch(() => []),
      fetch('/api/products').then((r) => r.json()).catch(() => []),
      fetch('/api/campaigns/active').then((r) => r.json()).catch(() => []),
    ]).then(([cats, prods, camps]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods.slice(0, 8) : []);
      setCampaigns(Array.isArray(camps) ? camps : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [baslangicUrunler]);

  // Hero kolaji: vitrindeki gorselli ilk uc urun. Liste zaten "once satin
  // alinabilir" sirali geldigi icin burada stoktaki urunler one cikiyor.
  const kolaj = products.filter((p) => p.imageUrl).slice(0, 3);

  const kampanyaKartlari = campaigns.flatMap((k) =>
    k.products.slice(0, 8).map((cp) => ({
      ...cp.product,
      campaign: { discount: cp.discount, discountedPrice: indirimliFiyat(cp.product.price, cp.discount) },
    }))
  );

  const [sloganA, sloganB, sloganC] = [
    content.home.hero.title,
    content.home.hero.titleHighlight,
    content.home.hero.titleSuffix,
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F2]">

      {/* ─── DUYURU ŞERİDİ ─── */}
      <div className="bg-[#0F2040] text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center justify-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" aria-hidden="true" />
          <p className="min-h-5 text-center text-[13px] md:text-sm font-medium tracking-[0.01em] transition-all duration-500">
            {announcements[ticker]}
          </p>
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8F1] via-[#FBF4EC] to-[#F3EBE1]">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#FF7A1A]/10 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-24 w-[420px] h-[420px] rounded-full bg-[#0F2040]/5 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-screen-xl mx-auto px-4 pt-12 pb-24 md:pt-16 md:pb-28 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 bg-white border border-orange-100 text-[#8B3A00] text-xs font-semibold pl-1.5 pr-4 py-1.5 rounded-full mb-6 shadow-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50">
                <IconSuccess className="w-5 h-5 object-contain" />
              </span>
              {content.home.hero.badge}
            </div>

            {/* Slogan gorsel vurgu; baslik etiketi degil (SEO icin H1 asagida). */}
            <p className="font-serif text-[2.9rem] leading-[1.02] md:text-[4.6rem] font-bold text-[#0F2040] tracking-tight mb-5" aria-hidden="true">
              {sloganA}.{' '}<span className="text-[#CC4E00]">{sloganB}.</span>
              <br />
              {sloganC}.
            </p>

            <h1 className="text-lg md:text-[1.35rem] font-semibold text-[#0F2040]/90 leading-snug mb-4 max-w-xl">
              {/* <br /> gorsel bir satir sonu; bosluk arama motorunun kelimeleri
                  bitisik okumasini onluyor. */}
              Hükümlülerin El Emeğiyle Sosyal Girişim Ürünleri{' '}<br className="hidden md:block" />
              <span className="text-[#BA4700]">İsyurtları</span> Cezaevi &amp; Hapishane Online Mağazası
            </h1>

            <p className="text-gray-600 text-[15px] md:text-base mb-8 max-w-xl leading-7">
              {content.home.hero.subtitle} Cezaevi ve hapishane hükümlülerinin meslek eğitim programlarında ürettiği ürünleri Türkiye geneline kargo ile teslim ediyoruz.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/gida" className="group bg-[#CC4E00] hover:bg-[#A63F00] text-white font-semibold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-900/15 flex items-center gap-3 text-sm">
                <span>{content.home.hero.ctaPrimary}</span>
                <IconTransfer className="w-5 h-5 object-contain bg-white rounded-md p-0.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/hakkimizda" className="bg-white hover:bg-gray-50 text-[#0F2040] font-semibold px-6 py-3.5 rounded-xl transition-colors border border-gray-200 text-sm">
                {content.home.hero.ctaSecondary}
              </Link>
            </div>
          </div>

          {/* Gercek urun gorsellerinden kolaj */}
          <div className="relative">
            {kolaj.length >= 3 ? (
              <div className="grid grid-cols-5 grid-rows-2 gap-3 h-[340px] md:h-[440px]">
                {kolaj.map((u, i) => (
                  <Link
                    key={u.id}
                    href={`/urun/${u.slug}`}
                    className={`group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/5 ${i === 0 ? 'col-span-3 row-span-2' : 'col-span-2'}`}
                  >
                    <Image
                      src={u.imageUrl!}
                      alt={u.name}
                      fill
                      priority={i === 0}
                      sizes={i === 0 ? '(max-width: 1024px) 60vw, 30vw' : '(max-width: 1024px) 40vw, 20vw'}
                      quality={75}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute left-3 bottom-3 right-3 bg-white/90 backdrop-blur text-[#0F2040] text-xs font-semibold px-3 py-1.5 rounded-lg truncate">
                      {u.name}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="relative h-[340px] md:h-[440px] rounded-3xl overflow-hidden shadow-xl shadow-black/5">
                <Image src="/video/hero-poster.jpg" alt="İşyurtları atölyelerinde üretim" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              </div>
            )}

            <div className="hidden md:flex absolute -left-6 -bottom-6 items-center gap-3 bg-white rounded-2xl shadow-xl shadow-black/10 px-4 py-3 max-w-[260px]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <IconSocialContribution className="w-7 h-7 object-contain" />
              </span>
              <p className="text-xs font-semibold text-[#0F2040] leading-snug">{announcements[0]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── İSTATİSTİKLER (hero'nun uzerine tasan kutular) ─── */}
      <section className="relative max-w-screen-xl mx-auto px-4 -mt-14 z-10">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {content.home.impactCards.map(({ value, title, description }, i) => {
            const Ikon = statIkonlari[i] ?? IconSuccess;
            return (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-black/5 px-2.5 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-4">
                <span className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <Ikon className="w-8 h-8 object-contain" />
                </span>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-extrabold text-[#0F2040] tracking-tight leading-none">
                    {value}{' '}
                    <span className="block mt-1 text-[11px] sm:text-sm font-bold text-[#BA4700] tracking-normal leading-tight">{title}</span>
                  </p>
                  <p className="hidden sm:block text-gray-500 text-xs mt-1.5 truncate">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── GÜVENCE ŞERİDİ ─── */}
      <section className="max-w-screen-xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {guvenceler.map(({ Icon, baslik, aciklama }) => (
            <div key={baslik} className="flex items-center gap-3 rounded-2xl bg-white/60 border border-gray-200/70 px-4 py-3">
              <Icon className="w-9 h-9 shrink-0 object-contain" />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#0F2040] leading-tight">{baslik}</p>
                <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{aciklama}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── KATEGORİLER ─── */}
      <section className="max-w-screen-xl mx-auto px-4 pt-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[#8B3A00] text-[11px] font-bold uppercase tracking-widest mb-1.5">Meslek Eğitim Programları</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0F2040] tracking-tight">Kategorilere Göz Atın</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-gray-200 animate-pulse" />)}
          </div>
        ) : (
          // Mobilde yatay kaydirma (7 kategori alt alta ekrani dolduruyordu),
          // genis ekranda kategori sayisina uyan tek satirlik izgara.
          <div className="flex gap-3 overflow-x-auto snap-x -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(128px,1fr))] sm:overflow-visible">
            {categories.map((cat) => {
              const cfg = categoryConfig[cat.slug];
              const Icon = cfg?.Icon ?? IconFurniture;
              return (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="w-36 shrink-0 snap-start sm:w-auto group bg-white rounded-2xl border border-gray-200/80 p-4 flex flex-col items-center text-center hover:border-orange-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cfg?.gradient ?? yedekGecis(cat.slug)} flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                    <Icon className="w-14 h-14 object-contain drop-shadow-sm" />
                  </span>
                  <p className="text-sm font-bold text-[#0F2040] leading-tight">{cat.name}</p>
                  {cfg?.purpose && <p className="text-[11px] text-gray-500 leading-tight mt-1">{cfg.purpose}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── KAMPANYALAR ─── */}
      {kampanyaKartlari.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 pt-14">
          <div className="rounded-3xl bg-gradient-to-r from-[#FFF1E6] to-[#FFE7D4] border border-orange-100 p-5 md:p-7">
            <div className="flex items-center gap-2 mb-1.5">
              <IconWeekSpecial className="w-5 h-5 object-contain" />
              <p className="text-[#8B3A00] text-[11px] font-bold uppercase tracking-widest">Bu Hafta Özel</p>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0F2040] tracking-tight mb-5">Kampanyadaki Ürünler</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
              {kampanyaKartlari.map((u) => (
                <div key={u.id} className="w-[46vw] sm:w-56 shrink-0 snap-start flex">
                  <UrunKarti
                    urun={u}
                    favoriButonu={false}
                    genisSepet
                    gorselYuksekligi="h-44"
                    gorselBoyutlari="(max-width: 640px) 46vw, 224px"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── EL EMEĞİ ÜRÜNLER ─── */}
      <section className="max-w-screen-xl mx-auto px-4 pt-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[#8B3A00] text-[11px] font-bold uppercase tracking-widest mb-1.5">{content.home.productsHeading.subtitle}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0F2040] tracking-tight">{content.home.productsHeading.title}</h2>
          </div>
          <Link href={`/${categories[0]?.slug ?? 'gida'}`} className="hidden sm:flex shrink-0 items-center gap-1.5 text-[#BA4700] hover:text-[#8F3700] text-sm font-semibold transition-colors">
            Ürünleri Keşfet <IconTransfer className="w-4 h-4" />
          </Link>
        </div>

        {loading || products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-gray-200 rounded-2xl h-80 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {products.filter((p) => p.category).map((product, sira) => (
              <UrunKarti
                key={product.id}
                urun={product}
                kategoriGoster
                favoriButonu={false}
                genisSepet
                gorselYedek={urunYedegi(product.category.slug)}
                gorselYuksekligi="h-44 md:h-56"
                gorselBoyutlari="(max-width: 768px) 50vw, 25vw"
                gorselOncelikli={sira < 2}
              />
            ))}
          </div>
        )}

        <div className="sm:hidden mt-5 text-center">
          <Link href={`/${categories[0]?.slug ?? 'gida'}`} className="inline-flex items-center gap-1.5 text-[#BA4700] text-sm font-semibold">
            Ürünleri Keşfet <IconTransfer className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── SOSYAL ETKİ BANDI ─── */}
      <section className="max-w-screen-xl mx-auto px-4 pt-14">
        <div className="relative overflow-hidden rounded-3xl bg-[#0F2040] px-6 py-10 md:px-12 md:py-12">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#CC4E00]/20 blur-2xl pointer-events-none" aria-hidden="true" />
          <div className="relative grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr] gap-8 items-center">
            <div>
              <p className="text-orange-300 text-[11px] font-bold uppercase tracking-widest mb-3">Sosyal Etki</p>
              <p className="font-serif text-white text-2xl md:text-[2rem] font-bold leading-tight">
                {announcements[0]}
              </p>
              <Link href="/hakkimizda" className="inline-flex items-center gap-2 mt-6 bg-white text-[#0F2040] text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-colors">
                Hikâyemiz <IconTransfer className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { Icon: IconSocialContribution, ...content.home.socialImpact[0] },
                { Icon: IconSuccess,            ...content.home.socialImpact[1] },
                { Icon: IconFastShipping,       ...content.home.socialImpact[2] },
              ].map(({ Icon, title, description }) => (
                <div key={title} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex sm:block items-center gap-3">
                  <span className="flex shrink-0 w-12 h-12 bg-white rounded-xl items-center justify-center sm:mb-3">
                    <Icon className="w-8 h-8 object-contain" />
                  </span>
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-white/65 text-xs mt-1 leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SEO AÇIKLAMA METNİ ───
          Arama motoru sayfanin ne sattigini ve fiyatlarin nasil isledigini
          metinden okuyabilsin. Metin degistirilmedi. */}
      <section className="max-w-screen-xl mx-auto px-4 pt-14 pb-14">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-10">
          <h3 className="text-xl md:text-2xl font-bold text-[#0F2040] tracking-tight mb-4">
            Cezaevi Satış Mağazası Fiyatları Hakkında
          </h3>

          <div className="space-y-4 text-[15px] leading-7 text-gray-700 max-w-4xl">
            <p>
              İsyurtları, Adalet Bakanlığı işyurtlarındaki meslek eğitim atölyelerinde üretilen
              ürünleri doğrudan alıcıyla buluşturan bir sosyal girişim platformudur. Sitedeki
              <strong className="font-semibold text-gray-900"> işyurtları online satış</strong>{' '}
              kataloğunda gıda, tekstil, ahşap, hediyelik, temizlik ve el sanatları kategorileri
              yer alır. Her ürün, bir hükümlünün meslek eğitimi sürecinde ortaya çıkar; satın
              aldığınız parça hem elinizde bir ürün hem de birinin yeniden başlamasına verilmiş
              bir destektir.
            </p>

            <p>
              Ürün sayfalarında gördüğünüz tutarlar KDV dahildir ve mağaza yönetim panelinden
              değiştirildiği anda sitede yayına girer; yani karşınızdaki{' '}
              <strong className="font-semibold text-gray-900">güncel fiyat listesi</strong>, o
              anki geçerli fiyatlardır. Fiyatı henüz belirlenmemiş ürünlerde tutar yerine "Fiyat
              belirleniyor" ifadesi görürsünüz ve bu ürünler sepete eklenemez. Gönderiler karşı
              ödemeli yapılır: kargo ücreti sipariş toplamına dahil değildir, teslimat sırasında
              kargo firmasına ödenir.
            </p>

            <p>
              Aradığınız ürün o an stokta değilse ürün kartındaki "Ön Talep Ver" bağlantısını
              kullanabilirsiniz; stok geldiğinde size haber veririz. Kategori sayfalarından fiyat
              aralığına ve stok durumuna göre süzerek{' '}
              <strong className="font-semibold text-gray-900">cezaevi ürünleri</strong> arasında
              size uygun olanı bulabilir, siparişinizin durumunu sipariş numaranız ve e-posta
              adresinizle Sipariş Sorgula sayfasından takip edebilirsiniz.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
