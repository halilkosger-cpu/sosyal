'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { IconType } from 'react-icons';
import {
  LuArrowRight, LuSprout, LuShirt, LuAxe, LuGift, LuFlower2, LuPalette,
  LuSparkles, LuArmchair, LuGrid3X3, LuHammer, LuUsers, LuPackage, LuHeart,
  LuHandHeart, LuInfo, LuStore,
} from 'react-icons/lu';
import UrunKarti from '@/components/UrunKarti';
import { IconFood, IconTextile, IconWood, IconWeaving, IconFurniture } from '@/components/Icons';
import { content } from '@/config/content';

/**
 * Ana sayfa - 2026 Eylul tasarimi (maketi birebir izliyor).
 *
 * Duzen: turuncu duyuru seridi, genis urun fotografli hero ve uzerine binen
 * uc istatistik kutusu, sade kategori satiri, kompakt "El Emegi Urunler"
 * vitrini, acik renkli sosyal etki bandi, SEO metni.
 *
 * Hero fotografi (public/hero/) sitedeki gercek urun fotograflarindan
 * (polen, biber receli, zeytinyagi, kuru baklagil, cini tabak) Higgsfield ile
 * uretildi. images.unoptimized acik oldugu icin dosyalar onceden WebP'ye
 * cevrilip kucultuldu: masaustu 2000px ~200 KB, mobil 900px ~135 KB.
 *
 * MAKETTEN BILEREK AYRILAN YERLER
 *  - H1: maketteki paragrafin yerinde, ayni gorunumde; metni SEO icin
 *    degismedi ("işyurtları", "cezaevi ürünleri" aramalari).
 *  - Alt bant metni: maketteki "Satışlarımızın tamamı ... katkı sağlar"
 *    kurumca dogrulanmis bir beyan degil; yerine sitenin SSS'sindeki
 *    dogrulanmis ifade kullanildi.
 *  - Urun kartlari: tukenmis / fiyatsiz urun durumu gizlenmiyor.
 */

interface Category { id: string; name: string; slug: string; }
interface Product  { id: string; name: string; slug: string; price: number; quantity: number; imageUrl?: string; category: { name: string; slug: string }; }
interface CampaignProduct { productId: string; discount: number; product: Product; }
interface Campaign { id: string; name: string; products: CampaignProduct[]; }

/** Kategori satirindaki cizgi ikonlar (slug -> ikon). Eski ve yeni slug'lar. */
const kategoriIkonu: Record<string, IconType> = {
  'gida': LuSprout, 'gida-urunleri': LuSprout,
  'tekstil': LuShirt, 'tekstil-urunleri': LuShirt,
  'ahsap': LuAxe, 'ahsap-urunler': LuAxe,
  'hediyelik': LuGift,
  'peyzaj': LuFlower2, 'peyzaj-cicek': LuFlower2,
  'sanat-zanaat': LuPalette,
  'temizlik': LuSparkles,
  'mobilya-urunleri': LuArmchair,
  'dokuma': LuGrid3X3,
  'demir-metal-urunleri': LuHammer,
};

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
 * Istatistikler. Degerler sitenin mevcut iceriginden (config/content.ts);
 * etiketler makettekine gore kisaltildi. "500+" kurumun urun ve hizmet
 * cesidi - bu sitedeki urun sayisi degil, etiket bu yuzden "Ürün & Hizmet".
 */
const istatistikler = [
  { Icon: LuUsers,   deger: content.home.stats[0]?.value ?? '70.000+', etiket: 'Hükümlü' },
  { Icon: LuPackage, deger: content.home.stats[1]?.value ?? '500+',    etiket: 'Ürün & Hizmet' },
  { Icon: LuHeart,   deger: content.home.stats[2]?.value ?? '%100',    etiket: 'Sosyal Girişim' },
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
      setProducts(Array.isArray(prods) ? prods.slice(0, 8) : []);
      setCampaigns(Array.isArray(camps) ? camps : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [baslangicUrunler]);

  const kampanyaKartlari = campaigns.flatMap((k) =>
    k.products.slice(0, 8).map((cp) => ({
      ...cp.product,
      campaign: { discount: cp.discount, discountedPrice: indirimliFiyat(cp.product.price, cp.discount) },
    }))
  );

  const tumUrunler = `/${categories[0]?.slug ?? 'gida'}`;

  return (
    <div className="min-h-screen bg-white">

      {/* ─── DUYURU ŞERİDİ ───
          Maketteki parlak turuncu (#F26B1D) beyaz yaziyla 3:1 kontrast
          veriyordu (WCAG AA alti); marka turuncusu #CC4E00 4.5:1 veriyor. */}
      <div className="bg-[#CC4E00] text-white">
        <p className="max-w-screen-xl mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm md:text-[15px] font-semibold">
          <span aria-hidden="true">✦</span>
          {content.home.announcements[0]}
          <span aria-hidden="true">✦</span>
        </p>
      </div>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-[#FBF6EF]">
        {/* Masaustu: tam genislikte fotograf; sol taraf bos krem, yazi orada. */}
        <div className="hidden md:block absolute inset-0" aria-hidden="true">
          <Image
            src="/hero/anasayfa-hero.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-[#FBF6EF] via-[#FBF6EF]/85 to-transparent" />
        </div>

        <div className="relative max-w-screen-xl mx-auto px-4 pt-8 pb-5 md:pt-14 md:pb-6 md:min-h-[470px] flex flex-col">
          <div className="max-w-md">
            {/* Slogan gorsel; basligin kendisi asagidaki H1. */}
            <p className="font-serif text-[2.6rem] md:text-[3.6rem] leading-[1.02] font-bold text-[#141B2D] tracking-tight" aria-hidden="true">
              {content.home.hero.title}.
              <br />
              {content.home.hero.titleHighlight}.{' '}
              <span className="text-[#E8620C]">{content.home.hero.titleSuffix}.</span>
            </p>

            <h1 className="mt-4 text-[15px] md:text-base font-normal leading-relaxed text-gray-700">
              Hükümlülerin El Emeğiyle Sosyal Girişim Ürünleri{' '}
              <span className="font-semibold text-gray-900">İsyurtları</span> Cezaevi &amp; Hapishane Online Mağazası
            </h1>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={tumUrunler} className="inline-flex items-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] text-white text-sm font-semibold px-5 py-3 rounded-lg transition-colors">
                Alışverişe Başla <LuArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/hakkimizda" className="inline-flex items-center gap-2 border border-[#CC4E00] text-[#BA4700] hover:bg-orange-50 bg-white/70 text-sm font-semibold px-5 py-3 rounded-lg transition-colors">
                Misyonumuz <LuInfo className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Mobil: urunlerin bulundugu kirpilmis fotograf */}
          <div className="md:hidden relative mt-7 aspect-[4/3] rounded-2xl overflow-hidden">
            <Image src="/hero/anasayfa-hero-mobil.webp" alt="İşyurtlarında üretilen gıda ve el sanatı ürünleri" fill priority sizes="100vw" className="object-cover" />
          </div>

          {/* Istatistikler - masaustunde fotografin alt kismina biniyor */}
          <div className="mt-4 md:mt-auto md:pt-10 md:ml-auto md:w-[62%] grid grid-cols-3 gap-2 md:gap-3">
            {istatistikler.map(({ Icon, deger, etiket }) => (
              <div key={etiket} className="bg-white/95 backdrop-blur rounded-xl shadow-md shadow-black/5 border border-white px-2 py-3 md:px-5 md:py-4 flex flex-col md:flex-row items-center md:gap-4 text-center md:text-left">
                <Icon className="w-7 h-7 md:w-10 md:h-10 text-[#E8620C] shrink-0" strokeWidth={1.75} />
                <div className="mt-1 md:mt-0">
                  <p className="text-lg md:text-[1.75rem] font-extrabold text-[#E8620C] leading-none tracking-tight">{deger}</p>
                  <p className="text-[11px] md:text-sm text-gray-700 mt-1">{etiket}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── KATEGORİLER ───
          Mobilde yana kaydirilan satir; genis ekranda kategori sayisina uyan
          tek satir. Kategoriler veritabanindan geliyor. */}
      <section className="max-w-screen-xl mx-auto px-4 pt-5" aria-label="Kategoriler">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] sm:overflow-visible">
            {categories.map((cat) => {
              const Icon = kategoriIkonu[cat.slug] ?? LuStore;
              return (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="w-28 shrink-0 snap-start sm:w-auto flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-[#FAFAF9] hover:bg-white hover:border-orange-200 hover:shadow-md px-2 py-4 text-center transition-all"
                >
                  <Icon className="w-7 h-7 text-gray-800" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-gray-800 leading-tight">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── KAMPANYALAR (yalnizca aktif kampanya varsa) ─── */}
      {kampanyaKartlari.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 pt-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-4">Kampanyadaki Ürünler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {kampanyaKartlari.slice(0, 8).map((u) => (
              <UrunKarti
                key={u.id}
                urun={u}
                kompakt
                favoriButonu={false}
                gorselYedek={urunYedegi(u.category?.slug)}
                gorselArkaPlani="from-[#F6EFE6] to-[#EFE4D6]"
                gorselYuksekligi="h-36 md:h-40"
                gorselBoyutlari="(max-width: 768px) 50vw, 25vw"
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── EL EMEĞİ ÜRÜNLER ─── */}
      <section className="max-w-screen-xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">El Emeği Ürünler</h2>
          <Link href={tumUrunler} className="inline-flex items-center gap-1.5 text-[#BA4700] hover:text-[#8F3700] text-sm font-semibold">
            Tümünü Gör <LuArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading || products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-60 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {products.filter((p) => p.category).map((product, sira) => (
              <UrunKarti
                key={product.id}
                urun={product}
                kompakt
                favoriButonu={false}
                gorselYedek={urunYedegi(product.category.slug)}
                gorselArkaPlani="from-[#F6EFE6] to-[#EFE4D6]"
                gorselYuksekligi="h-36 md:h-40"
                gorselBoyutlari="(max-width: 768px) 50vw, 25vw"
                gorselOncelikli={sira < 2}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── SOSYAL ETKİ BANDI ─── */}
      <section className="max-w-screen-xl mx-auto px-4 pt-8">
        <div className="rounded-2xl bg-[#FDF1E7] border border-orange-100 px-5 py-5 md:px-8 md:py-6 flex items-center gap-4 md:gap-6">
          <span className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-full bg-[#E8620C] text-white">
            <LuHandHeart className="w-7 h-7 md:w-8 md:h-8" strokeWidth={1.75} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-base md:text-xl font-bold text-gray-900">Her alışveriş meslek eğitimine destek olur.</p>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Ürünler, Adalet Bakanlığı işyurtlarındaki meslek eğitim atölyelerinde hükümlülerin el emeğiyle üretilir.
            </p>
          </div>
          <LuUsers className="hidden md:block w-20 h-20 text-[#E8620C] shrink-0" strokeWidth={1.1} aria-hidden="true" />
        </div>
      </section>

      {/* ─── SEO AÇIKLAMA METNİ ───
          Makette yok; arama motoru sayfanin ne sattigini ve fiyatlarin nasil
          isledigini buradan okuyor. Metin degistirilmedi, gorunum sade. */}
      <section className="max-w-screen-xl mx-auto px-4 pt-10 pb-6">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-3">
          Cezaevi Satış Mağazası Fiyatları Hakkında
        </h2>
        <div className="space-y-3 text-sm leading-7 text-gray-600 max-w-4xl">
          <p>
            İsyurtları, Adalet Bakanlığı işyurtlarındaki meslek eğitim atölyelerinde üretilen
            ürünleri doğrudan alıcıyla buluşturan bir sosyal girişim platformudur. Sitedeki
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
            anki geçerli fiyatlardır. Fiyatı henüz belirlenmemiş ürünlerde tutar yerine "Fiyat
            belirleniyor" ifadesi görürsünüz ve bu ürünler sepete eklenemez. Gönderiler karşı
            ödemeli yapılır: kargo ücreti sipariş toplamına dahil değildir, teslimat sırasında
            kargo firmasına ödenir.
          </p>
          <p>
            Aradığınız ürün o an stokta değilse ürün kartındaki "Ön Talep" bağlantısını
            kullanabilirsiniz; stok geldiğinde size haber veririz. Kategori sayfalarından fiyat
            aralığına ve stok durumuna göre süzerek{' '}
            <strong className="font-semibold text-gray-800">cezaevi ürünleri</strong> arasında
            size uygun olanı bulabilir, siparişinizin durumunu sipariş numaranız ve e-posta
            adresinizle Sipariş Sorgula sayfasından takip edebilirsiniz.
          </p>
        </div>
      </section>

    </div>
  );
}
