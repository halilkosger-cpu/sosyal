'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconFood, IconTextile, IconWood, IconWeaving, IconFurniture,
  IconSuccess, IconWeekSpecial,
  IconTransfer, IconFastShipping, IconSocialContribution,
} from '@/components/Icons';
import { content } from '@/config/content';

interface Category { id: string; name: string; slug: string; }
interface Product  { id: string; name: string; slug: string; price: number; quantity: number; imageUrl?: string; category: { name: string; slug: string }; }
interface CampaignProduct { productId: string; discount: number; product: Product; }
interface Campaign { id: string; name: string; products: CampaignProduct[]; }

const categoryConfig: Record<string, { Icon: React.ElementType; gradient: string; purpose: string }> = {
  // Eski slug format (uyumluluk için)
  'gida-urunleri':        { Icon: IconFood,     gradient: 'from-emerald-500 to-teal-400',   purpose: 'Beslenme & Aşçılık Eğitimi' },
  'tekstil-urunleri':     { Icon: IconTextile,  gradient: 'from-blue-600 to-indigo-400',    purpose: 'Derzillik Meslek Eğitimi' },
  'ahsap-urunler':        { Icon: IconWood,     gradient: 'from-amber-500 to-yellow-400',   purpose: 'Marangozluk Beceri Programı' },
  'dokuma':               { Icon: IconWeaving,  gradient: 'from-violet-600 to-purple-400',  purpose: 'Dokuma & Sanat Terapisi' },
  'mobilya-urunleri':     { Icon: IconFurniture, gradient: 'from-rose-500 to-pink-400',      purpose: 'Furniture Tasarım Eğitimi' },
  'demir-metal-urunleri': { Icon: IconFurniture, gradient: 'from-slate-600 to-slate-400',    purpose: 'Metal İşleri Ustası Programı' },
  // Yeni slug format (seed script'ten)
  'gida':                 { Icon: IconFood,     gradient: 'from-emerald-500 to-teal-400',   purpose: 'Beslenme & Aşçılık Eğitimi' },
  'tekstil':              { Icon: IconTextile,  gradient: 'from-blue-600 to-indigo-400',    purpose: 'Derzillik Meslek Eğitimi' },
  'ahsap':                { Icon: IconWood,     gradient: 'from-amber-500 to-yellow-400',   purpose: 'Marangozluk Beceri Programı' },
  'temizlik':             { Icon: IconWeaving,  gradient: 'from-cyan-500 to-blue-400',      purpose: 'Temizlik & Kozmetik Eğitimi' },
  'hediyelik':            { Icon: IconWeaving,  gradient: 'from-rose-500 to-pink-400',      purpose: 'El Sanatları & Tasarım' },
  'peyzaj-cicek':         { Icon: IconWood,     gradient: 'from-green-500 to-emerald-400',  purpose: 'Peyzaj & Çiçek Tasarımı' },
};

const productEmojis: Record<string, string> = {
  'badem':'🌰','biber-receli':'🫙','biber-salcasi':'🌶️','domates-salcasi':'🍅',
  'findik':'🥜','incir-receli':'🍓','kuru-baklagil':'🫘','pirinc':'🍚',
  'tereyag':'🧈','yesil-zeytin':'🫒','zeytinyag':'🫒','peynir':'🧀',
  'havlu-beyaz':'🛁','havlu-renkli':'🛁','ahsap-sandalye':'🪑','ahsap-masa':'🪑',
};

const announcements = content.home.announcements;

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [campaigns,  setCampaigns]  = useState<Campaign[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [ticker,     setTicker]     = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTicker((t) => (t + 1) % announcements.length), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F7]">

      {/* ─── ANNOUNCEMENT BAR ─── */}
      <div className="bg-[#0A1628] text-white border-b border-white/10 overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center justify-center md:justify-between gap-4">
          <div className="hidden md:flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6000]" />
            Sosyal etki
          </div>
          <p className="min-h-5 text-center text-sm md:text-[15px] font-medium tracking-[0.01em] text-white transition-all duration-500">
            {announcements[ticker]}
          </p>
          <div className="hidden md:flex items-center gap-1.5" aria-hidden="true">
            {announcements.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === ticker ? 'w-6 bg-[#FF6000]' : 'w-1.5 bg-white/30'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-[#0F2040]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwaDQydjQySDE4YzAtOS45NCA4LjA2LTE4IDE4LTE4eiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6000] opacity-[0.07] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="relative max-w-screen-xl mx-auto px-4 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div className="font-[var(--font-inter)]">
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/15 text-orange-100 text-xs font-semibold px-4 py-2.5 rounded-full mb-7 tracking-normal shadow-lg shadow-black/10">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                <IconSuccess className="w-6 h-6 object-contain" />
              </span>
              <span>{content.home.hero.badge}</span>
            </div>
            <h1 className="font-[var(--font-inter)] text-[2.45rem] md:text-[4rem] font-bold text-white leading-[1.05] mb-6 tracking-normal">
              {content.home.hero.title}<br />
              <span className="font-bold text-[#FF7A1A]">{content.home.hero.titleHighlight}</span> {content.home.hero.titleSuffix}
            </h1>
            <p className="text-white/75 text-[17px] md:text-[19px] mb-9 max-w-2xl leading-8 font-normal">
              {content.home.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 mb-12">
              <Link href="/gida" className="bg-[#FF6000] hover:bg-[#e55500] text-white font-bold px-7 py-3.5 rounded-xl transition-all hover:scale-[1.03] shadow-lg shadow-orange-900/25 flex items-center gap-3 text-sm">
                <span>{content.home.hero.ctaPrimary}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95">
                  <IconTransfer className="w-6 h-6 object-contain" />
                </span>
              </Link>
              <Link href="/hakkimizda" className="bg-white/8 hover:bg-white/15 text-white font-bold px-7 py-3.5 rounded-xl transition-all border border-white/15 text-sm">
                {content.home.hero.ctaSecondary}
              </Link>
            </div>
            <div className="flex gap-10 pt-8 border-t border-white/10">
              {content.home.stats.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-[#FF7A1A] tracking-normal">{value}</p>
                  <p className="text-white/75 text-xs mt-0.5 font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — category preview grid */}
          <div className="hidden md:grid grid-cols-2 gap-3">
            {(loading || categories.length === 0 ? [
              { slug: 'gida',     name: 'Gıda Ürünleri'  },
              { slug: 'tekstil',  name: 'Tekstil'         },
              { slug: 'hediyelik',     name: 'Hediyelik'  },
              { slug: 'ahsap',     name: 'Ahşap Ürünler'  },
            ] : categories.slice(0, 4)).map((cat) => {
              const cfg = categoryConfig[cat.slug];
              const Icon = cfg?.Icon ?? IconFurniture;
              return (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  className={`group bg-gradient-to-br ${cfg?.gradient ?? 'from-gray-600 to-gray-500'} rounded-2xl p-5 h-44 flex flex-col justify-between hover:scale-[1.03] transition-all duration-200 shadow-lg`}
                >
                  <div className="w-20 h-20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-16 h-16 object-contain drop-shadow-sm" />
                  </div>
                  <p className="text-white font-semibold text-sm">{cat.name}</p>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── ACTIVE CAMPAIGNS (CAROUSEL STYLE) ─── */}
      {campaigns.length > 0 && (
        <section className="bg-gradient-to-r from-[#FF6000]/5 to-[#0F2040]/5 border-y border-[#FF6000]/20">
          <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <IconWeekSpecial className="w-5 h-5 object-contain" />
                <p className="text-[#CC4E00] text-[11px] font-bold uppercase tracking-widest">Bu Hafta Özel</p>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Kampanyadaki Ürünler</h2>
            </div>

            {/* Campaigns Carousel */}
            <div className="w-screen -mx-4 overflow-hidden">
              <div className="flex gap-0 animate-scroll px-4 pb-4">
                {/* Original campaigns */}
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="flex-shrink-0 w-[70vw] md:w-[350px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{campaign.name}</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      <div className="flex gap-4 w-max">
                        {campaign.products.slice(0, 8).map(cp => {
                        const discountedPrice = cp.product.price * (1 - cp.discount / 100);
                        return (
                          <Link
                            key={cp.productId}
                            href={`/urun/${cp.product.slug}`}
                            className="group bg-white rounded-xl border-2 border-[#FF6000] hover:shadow-lg transition-all overflow-hidden flex-shrink-0 w-40"
                          >
                            <div className="relative h-36 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center overflow-hidden">
                              {cp.product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cp.product.imageUrl} alt={cp.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" decoding="async" />
                              ) : (
                                <span className="text-4xl">{productEmojis[cp.product.slug] || '📦'}</span>
                              )}
                              <div className="absolute top-2 right-2 bg-[#FF6000] text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                                -%{cp.discount}
                              </div>
                            </div>
                            <div className="p-2.5">
                              <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1.5">{cp.product.name}</h4>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-xs text-gray-600 line-through font-medium">₺{cp.product.price.toFixed(2)}</p>
                                <p className="text-base font-bold text-[#FF6000]">₺{discountedPrice.toFixed(2)}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {campaigns.map(campaign => (
                  <div key={campaign.id + '-clone'} className="flex-shrink-0 w-[70vw] md:w-[350px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{campaign.name}</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      <div className="flex gap-4 w-max">
                        {campaign.products.slice(0, 8).map(cp => {
                        const discountedPrice = cp.product.price * (1 - cp.discount / 100);
                        return (
                          <Link
                            key={cp.productId + '-clone'}
                            href={`/urun/${cp.product.slug}`}
                            className="group bg-white rounded-xl border-2 border-[#FF6000] hover:shadow-lg transition-all overflow-hidden flex-shrink-0 w-40"
                          >
                            <div className="relative h-36 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center overflow-hidden">
                              {cp.product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cp.product.imageUrl} alt={cp.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" decoding="async" />
                              ) : (
                                <span className="text-4xl">{productEmojis[cp.product.slug] || '📦'}</span>
                              )}
                              <div className="absolute top-2 right-2 bg-[#FF6000] text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                                -%{cp.discount}
                              </div>
                            </div>
                            <div className="p-2.5">
                              <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1.5">{cp.product.name}</h4>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-xs text-gray-600 line-through font-medium">₺{cp.product.price.toFixed(2)}</p>
                                <p className="text-base font-bold text-[#FF6000]">₺{discountedPrice.toFixed(2)}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── CATEGORIES ─── */}
      <section className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[#CC4E00] text-[11px] font-bold uppercase tracking-widest mb-1">Meslek Eğitim Programları</p>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Hangi Alanda Destek Olmak İstiyorsunuz?</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-200 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {categories.map((cat) => {
              const cfg = categoryConfig[cat.slug];
              const Icon = cfg?.Icon ?? IconFurniture;
              return (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg?.gradient ?? 'from-gray-500 to-gray-400'} p-4 flex flex-col items-center justify-center text-center min-h-[11rem] hover:scale-[1.04] hover:shadow-xl transition-all duration-200 shadow-md`}
                  title={cfg?.purpose}
                >
                  <div className="w-20 h-20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Icon className="w-16 h-16 object-contain drop-shadow-sm" />
                  </div>
                  <p className="text-white text-xs font-semibold leading-tight mb-1">{cat.name}</p>
                  <p className="text-white/70 text-[10px] leading-tight">{cfg?.purpose}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── CAMPAIGN BANNERS ─── */}
      <section className="max-w-screen-xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/gida" className="group col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F2040] to-[#1e4a90] p-8 flex items-center justify-between min-h-44 hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF6000]/10 rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="relative z-10">
              <span className="bg-[#FF6000] text-gray-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3">Öne Çıkan</span>
              <h3 className="text-white text-3xl font-bold mb-1 tracking-tight">Gıda Ürünleri</h3>
              <p className="text-gray-400 text-sm mb-5">Doğal, taze, güvenilir</p>
              <span className="inline-flex items-center gap-2 bg-white text-gray-900 text-xs font-semibold px-4 py-2.5 rounded-lg group-hover:bg-[#FF6000] group-hover:text-white transition-colors">
                İncele <IconTransfer className="w-4 h-4" />
              </span>
            </div>
            <IconFood className="w-40 h-40 object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link href="/tekstil" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 p-7 flex flex-col justify-between min-h-44 hover:shadow-xl transition-all">
            <div>
              <h3 className="text-white text-2xl font-bold mb-1 tracking-tight">Tekstil</h3>
              <p className="text-white/60 text-sm">El yapımı kumaşlar</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-3 py-2 rounded-lg group-hover:bg-white/25 transition-colors">
                Görüntüle <IconTransfer className="w-3 h-3" />
              </span>
              <IconTextile className="w-24 h-24 object-contain opacity-95" />
            </div>
          </Link>
        </div>
      </section>

      {/* ─── IMPACT STATISTICS ─── */}
      <section className="max-w-screen-xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {content.home.impactCards.map((card, idx) => {
            const gradients = [
              'from-emerald-500 to-teal-600',
              'from-blue-500 to-indigo-600',
              'from-orange-500 to-red-600',
            ];
            return (
              <div key={idx} className={`bg-gradient-to-br ${gradients[idx]} rounded-2xl p-8 text-white`}>
                <p className="text-5xl font-bold mb-2">{card.value}</p>
                <p className="text-base font-semibold mb-1">{card.title}</p>
                <p className="text-sm opacity-90">{card.description}</p>
              </div>
            );
          })}
        </div>
      </section>


      {/* ─── FEATURED PRODUCTS ─── */}
      <section className="max-w-screen-xl mx-auto px-4 pb-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[#CC4E00] text-[11px] font-bold uppercase tracking-widest mb-1">{content.home.productsHeading.subtitle}</p>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{content.home.productsHeading.title}</h2>
          </div>
          <Link href="/gida" className="flex items-center gap-1 text-[#FF6000] hover:text-[#cc4e00] text-sm font-semibold transition-colors">
            Tüm Ürünleri Keşfet <IconTransfer className="w-4 h-4" />
          </Link>
        </div>

        {loading || products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl h-72 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.filter(p => p.category).map((product) => (
              <Link key={product.id} href={`/urun/${product.slug}`}
                className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="relative h-44 bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300 select-none">
                      {productEmojis[product.slug] ?? '📦'}
                    </span>
                  )}
                  {product.quantity === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">Tükendi</span>
                    </div>
                  )}
                  {product.quantity > 0 && (
                    <span className="absolute top-2 right-2 bg-[#FF6000] text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-md">YENİ</span>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-1">{product.category?.name}</p>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-[#FF6000] transition-colors leading-snug">{product.name}</h3>
                  <div className="flex items-center gap-0.5 mt-1.5 mb-2">
                    {[1,2,3,4,5].map((s) => <IconSuccess key={s} className="w-2.5 h-2.5 text-[#FF6000]" />)}
                    <span className="text-[10px] text-gray-700 font-semibold ml-1">5.0</span>
                  </div>
                  {product.price > 0 ? (
                    <p className="text-lg font-bold text-[#FF6000] tracking-tight">₺{product.price.toFixed(2)}</p>
                  ) : (
                    <p className="text-xs text-gray-600 italic font-medium">Fiyat belirleniyor</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── SOCIAL IMPACT ─── */}
      <section className="max-w-screen-xl mx-auto px-4 pb-10">
        <div className="bg-[#0F2040] rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Icon: IconSocialContribution, title: content.home.socialImpact[0].title, desc: content.home.socialImpact[0].description },
            { Icon: IconSuccess,            title: content.home.socialImpact[1].title,  desc: content.home.socialImpact[1].description },
            { Icon: IconFastShipping,       title: content.home.socialImpact[2].title, desc: content.home.socialImpact[2].description },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon className="w-10 h-10 object-contain" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-white/70 text-xs mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
