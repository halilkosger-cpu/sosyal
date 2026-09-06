'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import UrunKarti from '@/components/UrunKarti';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LuHouse, LuX } from 'react-icons/lu';
import {
  IconFood,
  IconTextile,
  IconWood,
  IconWeaving,
  IconFurniture,
  IconProductOrigin,
} from '@/components/Icons';
import { kisaAd, yedekGecis, type Kategori } from '@/lib/kategori-gorunum';
import KategoriIkon from '@/components/KategoriIkon';

interface Campaign {
  id: string;
  name: string;
  discount: number;
  discountedPrice: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category: { name: string; slug: string; kdvOrani?: number };
  campaign?: Campaign;
}

const categoryMeta: Record<string, { Icon: React.ElementType; iconColor: string; bg: string; banner: string; purpose: string; impact: string; imgBg: string; seoTitle: string }> = {
  // Eski slug format
  'gida-urunleri':        { Icon: IconFood,      iconColor: '#15803d', bg: 'bg-green-100',  banner: 'from-emerald-600 to-teal-500',   purpose: 'Beslenme & Aşçılık Eğitimi', impact: 'Aşçılık meslek eğitimi', imgBg: 'from-emerald-200 to-green-100', seoTitle: 'İsyurtları Gıda Ürünleri | Cezaevi Sosyal Girişim' },
  'tekstil-urunleri':     { Icon: IconTextile,   iconColor: '#1d4ed8', bg: 'bg-blue-100',   banner: 'from-blue-600 to-indigo-500',    purpose: 'Terzilik Meslek Eğitimi', impact: 'Tekstil üretim becerisi', imgBg: 'from-blue-200 to-indigo-100', seoTitle: 'İsyurtları Tekstil Ürünleri | Hapishane Eğitim Ürünleri' },
  'ahsap-urunler':        { Icon: IconWood,      iconColor: '#b45309', bg: 'bg-amber-100',  banner: 'from-amber-600 to-yellow-500',   purpose: 'Marangozluk Beceri Programı', impact: 'Marangozluk eğitimi', imgBg: 'from-amber-200 to-yellow-100', seoTitle: 'İsyurtları Ahşap Ürünleri | Cezaevi Marangozluk' },
  'dokuma':               { Icon: IconWeaving,   iconColor: '#7e22ce', bg: 'bg-purple-100', banner: 'from-violet-600 to-purple-500',  purpose: 'Dokuma & Sanat Terapisi', impact: 'Dokuma ve sanat terapisi', imgBg: 'from-violet-200 to-purple-100', seoTitle: 'İsyurtları Dokuma Ürünleri | Hapishane El Sanatları' },
  'mobilya-urunleri':     { Icon: IconFurniture, iconColor: '#be123c', bg: 'bg-rose-100',   banner: 'from-rose-600 to-pink-500',      purpose: 'Mobilya Tasarım Eğitimi', impact: 'Mobilya tasarım eğitimi', imgBg: 'from-rose-200 to-pink-100', seoTitle: 'İsyurtları Mobilya Ürünleri | Cezaevi Tasarım' },
  'demir-metal-urunleri': { Icon: IconFurniture, iconColor: '#334155', bg: 'bg-slate-100',  banner: 'from-slate-600 to-gray-500',     purpose: 'Metal İşleri Ustası Programı', impact: 'Metal işleri eğitimi', imgBg: 'from-slate-200 to-gray-100', seoTitle: 'İsyurtları Metal Ürünleri | Hapishane Ustası' },
  // Yeni slug format (seed script'ten)
  'gida':                 { Icon: IconFood,      iconColor: '#15803d', bg: 'bg-green-100',  banner: 'from-emerald-600 to-teal-500',   purpose: 'Beslenme & Aşçılık Eğitimi', impact: 'Aşçılık meslek eğitimi', imgBg: 'from-emerald-200 to-green-100', seoTitle: 'İsyurtları Gıda Ürünleri | Cezaevi Sosyal Girişim' },
  'tekstil':              { Icon: IconTextile,   iconColor: '#1d4ed8', bg: 'bg-blue-100',   banner: 'from-blue-600 to-indigo-500',    purpose: 'Terzilik Meslek Eğitimi', impact: 'Tekstil üretim becerisi', imgBg: 'from-blue-200 to-indigo-100', seoTitle: 'İsyurtları Tekstil Ürünleri | Hapishane Eğitim' },
  'ahsap':                { Icon: IconWood,      iconColor: '#b45309', bg: 'bg-amber-100',  banner: 'from-amber-600 to-yellow-500',   purpose: 'Marangozluk Beceri Programı', impact: 'Marangozluk eğitimi', imgBg: 'from-amber-200 to-yellow-100', seoTitle: 'İsyurtları Ahşap Ürünleri | Cezaevi Marangozluk' },
  'temizlik':             { Icon: IconWeaving,   iconColor: '#0891b2', bg: 'bg-cyan-100',   banner: 'from-cyan-600 to-blue-500',      purpose: 'Temizlik & Kozmetik Eğitimi', impact: 'Kozmetik üretim eğitimi', imgBg: 'from-cyan-200 to-blue-100', seoTitle: 'İsyurtları Temizlik Ürünleri | Hapishane Kozmetik' },
  'hediyelik':            { Icon: IconWeaving,   iconColor: '#dc2626', bg: 'bg-red-100',    banner: 'from-red-600 to-pink-500',      purpose: 'El Sanatları & Tasarım', impact: 'El sanatları becerisi', imgBg: 'from-red-200 to-pink-100', seoTitle: 'İsyurtları Hediyelik Ürünler | Cezaevi El Sanatları' },
  'peyzaj-cicek':         { Icon: IconWood,      iconColor: '#059669', bg: 'bg-green-100',  banner: 'from-green-600 to-emerald-500',  purpose: 'Peyzaj & Çiçek Tasarımı', impact: 'Peyzaj tasarım eğitimi', imgBg: 'from-green-200 to-emerald-100', seoTitle: 'İsyurtları Peyzaj & Çiçek | Hapishane Tasarım' },
  // Veritabanindaki slug 'peyzaj'; tabloda yalnizca 'peyzaj-cicek' vardi ve
  // sayfa bu yuzden gri afisle aciliyordu. 'sanat-zanaat' hic yoktu.
  'peyzaj':               { Icon: IconWood,      iconColor: '#059669', bg: 'bg-green-100',  banner: 'from-green-600 to-emerald-500',  purpose: 'Peyzaj & Çiçek Tasarımı', impact: 'Peyzaj tasarım eğitimi', imgBg: 'from-green-200 to-emerald-100', seoTitle: 'İsyurtları Peyzaj & Çiçek | Hapishane Tasarım' },
  'sanat-zanaat':         { Icon: IconWeaving,   iconColor: '#7e22ce', bg: 'bg-purple-100', banner: 'from-violet-600 to-purple-500',  purpose: 'El Sanatları & Yaratıcı Üretim', impact: 'El sanatları becerisi', imgBg: 'from-violet-200 to-purple-100', seoTitle: 'İsyurtları Sanat & Zanaat | Cezaevi El Sanatları' },
};

type SortOption = 'varsayilan' | 'fiyat-artan' | 'fiyat-azalan' | 'isim' | 'yeni';

interface Fasetler {
  fiyat: { min: number; max: number };
  stok: { var: number; yok: number };
}

interface ListeYaniti {
  urunler: Product[];
  toplam: number;
  sayfa: number;
  sayfaSayisi: number;
  fasetler: Fasetler;
}

interface KategoriSayfasiProps {
  baslangicUrunler?: Product[] | null;
  kategoriler?: Kategori[];
  /**
   * Kategorinin adı ve açıklaması sunucudan geliyor.
   *
   * Önceden ad ilk ürünün kategorisinden okunuyordu
   * (`products[0]?.category.name`). Kategoride hiç ürün yoksa ya da bir
   * süzgeç sonucu boşaltınca sayfanın H1 başlığı "Ürünler" oluyordu -
   * süzgeç değiştirmek sayfanın başlığını değiştiriyordu. Açıklama ise
   * yalnızca <meta> etiketinde kullanılıyor, ziyaretçiye hiç
   * gösterilmiyordu.
   */
  kategoriAdi?: string;
  kategoriAciklamasi?: string | null;
}

/**
 * Süzgeçler adres çubuğundan okunuyor (useSearchParams). Next, bu kancayı
 * kullanan her bileşenin bir Suspense sınırının altında olmasını istiyor;
 * aksi halde derleme "should be wrapped in a suspense boundary" ile
 * duruyor. Sarmalayıcı bu yüzden burada.
 */
export default function CategoryPage(props: KategoriSayfasiProps) {
  return (
    <Suspense fallback={<div className="store-shell min-h-screen" />}>
      <KategoriIcerigi {...props} />
    </Suspense>
  );
}

function KategoriIcerigi({
  baslangicUrunler = null,
  kategoriler = [],
  kategoriAdi,
  kategoriAciklamasi = null,
}: KategoriSayfasiProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const aramaParametreleri = useSearchParams();
  const categorySlug = params.categorySlug as string;

  /**
   * Süzgeçler artık adres çubuğunda.
   *
   * Önceden fiyat aralığı, stok durumu ve sıralama bileşen durumundaydı ve
   * süzme tamamen tarayıcıda yapılıyordu: uç tüm kategoriyi döndürüyor,
   * kategori sayfası gelen diziyi kendi eliyordu. Üç sonucu vardı -
   * filtrelenmiş sayfa paylaşılamıyor, geri tuşu çalışmıyor, arama motoru
   * bu sayfaları hiç görmüyordu. Katalog büyüdükçe de her ziyaret tüm
   * kataloğu indirmek anlamına geliyordu.
   */
  const sort = (aramaParametreleri.get('sirala') || 'varsayilan') as SortOption;
  const stockFilter = aramaParametreleri.get('stok') || 'hepsi';
  const sayfa = Math.max(1, Number(aramaParametreleri.get('sayfa')) || 1);
  const urlMin = aramaParametreleri.get('minFiyat');
  const urlMax = aramaParametreleri.get('maxFiyat');

  const [veri, setVeri] = useState<ListeYaniti | null>(
    baslangicUrunler
      ? {
          urunler: baslangicUrunler,
          toplam: baslangicUrunler.length,
          sayfa: 1,
          sayfaSayisi: 1,
          fasetler: { fiyat: { min: 0, max: 5000 }, stok: { var: 0, yok: 0 } },
        }
      : null
  );
  const [loading, setLoading] = useState(!baslangicUrunler);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const products = veri?.urunler ?? [];
  const sorted = products;

  const fasetMin = veri?.fasetler.fiyat.min ?? 0;
  const fasetMax = veri?.fasetler.fiyat.max ?? 5000;
  const maxPriceAvailable = Math.max(fasetMax, 1);

  /** Kaydırıcılar sürüklenirken akıcı kalsın diye yerel; bırakınca URL'e yazılıyor. */
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);

  useEffect(() => {
    setMinPrice(urlMin !== null ? Number(urlMin) : fasetMin);
    setMaxPrice(urlMax !== null ? Number(urlMax) : fasetMax);
  }, [urlMin, urlMax, fasetMin, fasetMax]);

  /** Adres çubuğundaki bir parametreyi değiştirir; sayfayı başa alır. */
  const parametreDegistir = useCallback(
    (degisiklikler: Record<string, string | null>, sayfayiKoru = false) => {
      const yeniParametreler = new URLSearchParams(aramaParametreleri.toString());
      for (const [ad, deger] of Object.entries(degisiklikler)) {
        if (deger === null || deger === '') yeniParametreler.delete(ad);
        else yeniParametreler.set(ad, deger);
      }
      if (!sayfayiKoru) yeniParametreler.delete('sayfa');
      const sorguDizesi = yeniParametreler.toString();
      router.push(sorguDizesi ? `${pathname}?${sorguDizesi}` : pathname, { scroll: false });
    },
    [aramaParametreleri, pathname, router]
  );

  const fiyatiUygula = () => {
    parametreDegistir({
      minFiyat: minPrice > fasetMin ? String(Math.round(minPrice)) : null,
      maxFiyat: maxPrice < fasetMax ? String(Math.round(maxPrice)) : null,
    });
  };

  const suzgecleriTemizle = () =>
    parametreDegistir({ minFiyat: null, maxFiyat: null, stok: null, sirala: null });

  useEffect(() => {
    let iptal = false;
    setLoading(true);

    const sorgu = new URLSearchParams({ kategori: categorySlug, sirala: sort, sayfa: String(sayfa) });
    if (stockFilter !== 'hepsi') sorgu.set('stok', stockFilter);
    if (urlMin !== null) sorgu.set('minFiyat', urlMin);
    if (urlMax !== null) sorgu.set('maxFiyat', urlMax);

    fetch(`/api/urunler?${sorgu}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (iptal || !data) return;
        setVeri(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!iptal) setLoading(false);
      });

    return () => {
      iptal = true;
    };
  }, [categorySlug, sort, sayfa, stockFilter, urlMin, urlMax]);
  // Not: burada document.title ezilmemeli. generateMetadata ile kurulan
  // baslik JavaScript calisinca siliniyordu; arama motoru ve erisilebilirlik
  // denetimleri bu yuzden basligi bulamiyordu.

  const meta = categoryMeta[categorySlug];
  const Icon = meta?.Icon ?? IconProductOrigin;
  const categoryName = kategoriAdi ?? products[0]?.category.name ?? 'Ürünler';
  /** Kategorinin süzgeçsiz toplam ürün sayısı (afişteki sayı için). */
  const kategoriToplam = (veri?.fasetler.stok.var ?? 0) + (veri?.fasetler.stok.yok ?? 0);

  return (
    <div className="store-shell">

      {/* ─── CATEGORY BANNER ─── */}
      {/* Tabloda karsiligi olmayan kategori gri afisle acilmasin: slug'a gore
          belirlenmis bir renk kullaniliyor. */}
      <div className={`bg-gradient-to-r ${meta?.banner ?? yedekGecis(categorySlug)} text-white`}>
        <div className="max-w-screen-xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <Link href="/" className="hover:text-white flex items-center gap-1 transition-colors">
              <LuHouse size={14} />
              Ana Sayfa
            </Link>
            <span>/</span>
            <span className="text-white font-medium">{kategoriAdi ?? (loading ? '...' : categoryName)}</span>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
              <Icon className="w-24 h-24 object-contain drop-shadow-md" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold">{kategoriAdi ?? (loading ? '...' : categoryName)}</h1>
              <p className="text-white/90 text-sm mt-2 font-medium">
                {meta?.purpose || 'Meslek Eğitim Programı'} • İsyurtları Cezaevi Ürünleri
              </p>
              {/**
                * Buradaki metin şunu yazıyordu:
                *   "{kategoriToplam} cezaevi hükümlüsü tarafından el yapımı"
                * Oysa kategoriToplam ÜRÜN sayısı. Gıda kategorisinde 27 ürün
                * var; sayfa "27 cezaevi hükümlüsü" diyordu. Kaç kişinin
                * çalıştığı sitede hiçbir yerde tutulmuyor - uydurulamaz.
                * Elimizdeki gerçek sayı ürün sayısı; yazan da o.
                */}
              <p className="text-white/70 text-sm mt-1">
                {loading ? '' : `${kategoriToplam} ürün`}
              </p>
            </div>
          </div>

          {/**
            * Kategori tanıtımı.
            *
            * Burada iki ayrı blok vardı: afişin içinde bir "Mission Message",
            * ürün ızgarasının hemen üstünde de bir "Sosyal etki" kutusu. İkisi
            * de aynı cümleyi kuruyordu (cezaevi hükümlülerinin meslek
            * eğitimi, rehabilitasyon, topluma yeniden kazanım) ve ikisi de
            * HER kategoride kelimesi kelimesine aynıydı. Ziyaretçi aynı metni
            * iki kez okuyor, arama motoru da sekiz kategori sayfasında
            * birbirinin kopyası içerik görüyordu.
            *
            * Tek blok kaldı ve önce kategorinin KENDİ açıklaması yazılıyor -
            * yönetim panelinden girilen, kategoriye özgü metin. Açıklama
            * girilmemişse eğitim programına göre değişen kısa bir cümle
            * yedekte duruyor.
            */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white text-sm leading-relaxed">
              {kategoriAciklamasi ? (
                kategoriAciklamasi
              ) : (
                <>
                  <span className="font-semibold">Bu kategorideki her satın alma:</span>{' '}
                  {meta?.purpose
                    ? `${meta.purpose} programındaki hükümlülerin`
                    : 'Meslek eğitimi alan hükümlülerin'}{' '}
                  emeğine karşılık olur ve topluma yeniden kazanılmalarına katkı sağlar.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">

        {/* Buradaki "Sosyal etki" kutusu afiştekiyle aynı metni tekrarlıyordu;
            afişteki tek blokta birleştirildi. Bkz. yukarıdaki açıklama. */}

        {/* ─── MAIN LAYOUT: FILTERS + PRODUCTS ─── */}
        <div className="flex gap-6">

          {/* ─── FILTER PANEL (Desktop + Mobile) ─── */}
          <div className={`
            ${mobileFiltersOpen ? 'fixed inset-0 z-50 bg-black/50' : 'hidden md:block'}
            md:relative md:bg-transparent md:z-auto
          `}>
            <div className={`
              ${mobileFiltersOpen ? 'fixed top-0 left-0 right-0 bottom-0 bg-white overflow-y-auto' : ''}
              md:relative md:bg-white md:h-auto md:overflow-visible
              md:w-64 flex-shrink-0 rounded-xl border border-gray-200 p-6
            `}>
              {/* Close button (mobile only) */}
              {mobileFiltersOpen && (
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="absolute top-4 right-4 md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <LuX size={20} />
                </button>
              )}

              {/* ─── KATEGORILER ─── */}
              {kategoriler.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Kategoriler</h3>
                  <nav className="space-y-1" aria-label="Kategoriler">
                    {kategoriler.map((k) => {
                      const secili = k.slug === categorySlug;
                      return (
                        <Link
                          key={k.slug}
                          href={`/${k.slug}`}
                          aria-current={secili ? 'page' : undefined}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                            secili
                              ? 'bg-orange-50 font-bold text-[#BA4700]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#BA4700]'
                          }`}
                        >
                          <KategoriIkon
                            slug={k.slug}
                            imageUrl={k.imageUrl}
                            className="h-6 w-6 flex-shrink-0"
                          />
                          <span className="min-w-0 flex-1 truncate">{kisaAd(k.name)}</span>
                          <span
                            className={`flex-shrink-0 text-xs font-semibold ${
                              secili ? 'text-[#BA4700]' : 'text-gray-400'
                            }`}
                          >
                            {k.urunSayisi}
                          </span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 mb-6">Filtrele</h3>

              {/* ─── PRICE FILTER ─── */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Fiyat Aralığı</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-600 block mb-2">
                      Min: <span className="font-bold text-gray-900">₺{minPrice.toFixed(0)}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={maxPriceAvailable}
                      value={minPrice}
                      onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                      onPointerUp={fiyatiUygula}
                      onKeyUp={fiyatiUygula}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6000]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-2">
                      Max: <span className="font-bold text-gray-900">₺{maxPrice.toFixed(0)}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={maxPriceAvailable}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                      onPointerUp={fiyatiUygula}
                      onKeyUp={fiyatiUygula}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6000]"
                    />
                  </div>
                </div>
              </div>

              {/* ─── STOCK FILTER ─── */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Stok Durumu</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="stock"
                      value="hepsi"
                      checked={stockFilter === 'hepsi'}
                      onChange={() => parametreDegistir({ stok: null })}
                      className="w-4 h-4 text-[#BA4700] cursor-pointer accent-[#FF6000]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Tümü</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="stock"
                      value="var"
                      checked={stockFilter === 'var'}
                      onChange={() => parametreDegistir({ stok: 'var' })}
                      className="w-4 h-4 text-[#BA4700] cursor-pointer accent-[#FF6000]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Stokta Var</span>
                    <span className="ml-auto text-xs text-gray-400">{veri?.fasetler.stok.var ?? 0}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="stock"
                      value="yok"
                      checked={stockFilter === 'yok'}
                      onChange={() => parametreDegistir({ stok: 'yok' })}
                      className="w-4 h-4 text-[#BA4700] cursor-pointer accent-[#FF6000]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Tükendi</span>
                    <span className="ml-auto text-xs text-gray-400">{veri?.fasetler.stok.yok ?? 0}</span>
                  </label>
                </div>
              </div>

              {/* Reset filters button */}
              <button
                onClick={suzgecleriTemizle}
                className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>

          {/* ─── PRODUCTS SECTION ─── */}
          <div className="flex-1">
            {/* ─── MOBILE FILTER BUTTON + SORT BAR ─── */}
            <div className="flex items-center justify-between gap-3 mb-5 bg-white rounded-xl border border-gray-200 px-4 py-3">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="md:hidden flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtrele
              </button>

              <p className="text-sm text-gray-500 font-medium hidden md:block flex-1">
                {loading ? '' : <><span className="text-gray-900 font-bold">{veri?.toplam ?? 0}</span> ürün</>}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden sm:inline">Sırala:</span>
                <select
                  value={sort}
                  onChange={(e) => parametreDegistir({ sirala: e.target.value === 'varsayilan' ? null : e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-[#FF6000] cursor-pointer"
                >
                  <option value="varsayilan">Varsayılan</option>
                  <option value="fiyat-artan">Fiyat: Düşükten Yükseğe</option>
                  <option value="fiyat-azalan">Fiyat: Yüksekten Düşüğe</option>
                  <option value="isim">İsim: A-Z</option>
                  <option value="yeni">En yeniler</option>
                </select>
              </div>
            </div>

            {/* ─── LOADING ─── */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`bg-gradient-to-br ${meta?.imgBg ?? 'from-orange-100 to-amber-100'} rounded-xl h-72 animate-pulse`} />
                ))}
              </div>
            )}

            {/* ─── EMPTY ─── */}
            {!loading && products.length === 0 && kategoriToplam === 0 && (
              <div className="bg-white rounded-2xl p-16 text-center col-span-full">
                <Icon className="w-24 h-24 object-contain mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Bu kategoride henüz ürün bulunmamaktadır</h3>
                <p className="text-gray-400 mb-2">Sosyal Girişim'in eğitim programları devam etmektedir.</p>
                <p className="text-gray-400 mb-6">Yakında bu kategoride el yapımı ürünler eklenecek.</p>
                <Link href="/" className="bg-[#CC4E00] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#A63F00] transition-colors">
                  Diğer Kategorileri Keşfet
                </Link>
              </div>
            )}

            {/* ─── NO RESULTS WITH FILTERS ─── */}
            {!loading && products.length === 0 && kategoriToplam > 0 && (
              <div className="bg-white rounded-2xl p-12 text-center col-span-full">
                <span className="text-5xl block mb-4">🔍</span>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Filtrelerinizi eşleşen ürün bulunamadı</h3>
                <p className="text-gray-400 mb-6">Lütfen filtrelerinizi ayarlayıp yeniden deneyin.</p>
                <button
                  onClick={suzgecleriTemizle}
                  className="text-[#BA4700] font-medium hover:text-[#8F3700] transition-colors"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}

            {/* ─── PRODUCT GRID ─── */}
            {!loading && sorted.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((product) => (
              <UrunKarti
                key={product.id}
                urun={product}
                gorselYedek={<Icon className="w-24 h-24 object-contain" />}
                gorselArkaPlani={meta?.imgBg ?? 'from-orange-100 to-amber-100'}
                gorselYuksekligi="h-48"
                gorselBoyutlari="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                aciklamaGoster
                etkiRozeti={meta?.impact || 'Eğitim desteği'}
                favoriButonu
                sepetButonu
              />
              ))}
              </div>
            )}

            {/* ─── SAYFALAMA ─── */}
            {!loading && (veri?.sayfaSayisi ?? 0) > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => parametreDegistir({ sayfa: String(sayfa - 1) }, true)}
                  disabled={sayfa <= 1}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Önceki
                </button>
                <span className="text-sm text-gray-600">
                  Sayfa {veri?.sayfa} / {veri?.sayfaSayisi}
                </span>
                <button
                  onClick={() => parametreDegistir({ sayfa: String(sayfa + 1) }, true)}
                  disabled={sayfa >= (veri?.sayfaSayisi ?? 1)}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Sonraki
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}
