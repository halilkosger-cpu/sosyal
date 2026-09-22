import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hakkımızda — Hükümlü El Emeğiyle Sosyal Girişim',
  description: 'İşyurtları; cezaevi ve hapishane hükümlülerinin meslek eğitimi alarak ürettiği ürünleri satışa sunan sosyal girişimdir. Her satın alma bir ikinci şansa dönüşür.',
  alternates: { canonical: '/hakkimizda' },
  openGraph: {
    title: 'Hakkımızda — Hükümlü El Emeğiyle Sosyal Girişim',
    description: 'İşyurtları; cezaevi ve hapishane hükümlülerinin meslek eğitimi alarak ürettiği ürünleri satışa sunan sosyal girişimdir. Her satın alma bir ikinci şansa dönüşür.',
    url: '/hakkimizda',
  },
};
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@isyurtlari/database';
import { LuHouse, LuChevronRight, LuTarget, LuLeaf, LuBadgeCheck, LuShieldCheck, LuHeart, LuArrowRight, LuMail } from 'react-icons/lu';
import { content } from '@/config/content';
import { hasDatabaseUrl } from '@/lib/seo';

/**
 * Hakkimizda - 2026 Eylul tasarimi.
 *
 * Istatistikler artik veritabanindan: eskiden "81 ilde faaliyet" ve
 * "6 ana kategori" elle yaziliydi; kategori sayisi 7'ydi, 81 il iddiasinin
 * da kaynagi yoktu. Saatte bir tazeleniyor.
 */
export const revalidate = 3600;

async function sayilar() {
  if (!hasDatabaseUrl()) return null;
  try {
    const [kategori, urun] = await Promise.all([prisma.productCategory.count(), prisma.product.count()]);
    return { kategori, urun };
  } catch {
    return null;
  }
}

const DEGER_IKONLARI = [LuBadgeCheck, LuShieldCheck, LuHeart, LuLeaf];

export default async function AboutPage() {
  const s = await sayilar();
  const a = content.about;
  const istatistik = [
    ...(s ? [{ deger: String(s.kategori), etiket: 'Ürün kategorisi' }, { deger: String(s.urun), etiket: 'Katalogdaki ürün' }] : []),
    { deger: '14 gün', etiket: 'Cayma hakkı' },
  ];

  return (
    <div className="bg-white">
      <nav className="max-w-screen-xl mx-auto px-4 pt-4 flex items-center gap-1.5 text-sm text-gray-500" aria-label="Sayfa yolu">
        <Link href="/" className="hover:text-[#BA4700] flex items-center gap-1"><LuHouse size={14} /> Ana Sayfa</Link>
        <LuChevronRight size={14} />
        <span className="text-gray-900 font-medium">Hakkımızda</span>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#FBF6EF] mt-4">
        <div className="hidden md:block absolute inset-0" aria-hidden="true">
          <Image src="/kategori/hediyelik.webp" alt="" fill priority sizes="100vw" className="object-cover object-right" />
          <div className="absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-[#FBF6EF] via-[#FBF6EF]/90 to-transparent" />
        </div>
        <div className="relative max-w-screen-xl mx-auto px-4 py-12 md:py-20">
          <div className="max-w-xl">
            <p className="text-[#BA4700] text-[11px] font-bold uppercase tracking-widest">{a.hero.badge}</p>
            <h1 className="font-serif mt-3 text-3xl md:text-5xl font-bold text-[#141B2D] leading-tight">
              {a.hero.title}{' '}<span className="text-[#E8620C]">{a.hero.titleHighlight}</span> {a.hero.titleSuffix}
            </h1>
            <p className="mt-4 text-[15px] md:text-base leading-relaxed text-gray-700">{a.hero.description}</p>
            <Link href="/" className="mt-6 inline-flex items-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] text-white text-sm font-semibold px-5 py-3 rounded-lg">
              Ürünleri İncele <LuArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* İSTATİSTİK */}
      <section className="max-w-screen-xl mx-auto px-4 -mt-8 relative">
        <div className={`grid gap-3 ${istatistik.length === 3 ? 'grid-cols-3' : 'grid-cols-1'} max-w-2xl`}>
          {istatistik.map((i) => (
            <div key={i.etiket} className="bg-white rounded-xl border border-gray-100 shadow-md shadow-black/5 px-4 py-4 text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-[#E8620C] leading-none">{i.deger}</p>
              <p className="text-xs md:text-sm text-gray-600 mt-1.5">{i.etiket}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-4 py-12 space-y-10">
        {/* NEDİR */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-4">{a.sections.whatIsWorkshop.title}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">{a.sections.whatIsWorkshop.content}</p>
            <p className="text-gray-700 leading-relaxed">{a.sections.whatIsWorkshop.content2}</p>
          </div>
          <blockquote className="rounded-2xl bg-[#FDF1E7] border border-orange-100 p-6 md:p-8">
            <p className="font-serif text-xl md:text-2xl font-bold text-[#141B2D] leading-snug">“{a.sections.whatIsWorkshop.socialImpactQuote}”</p>
          </blockquote>
        </section>

        {/* MİSYON & VİZYON */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { Icon: LuTarget, ...a.sections.mission },
            { Icon: LuLeaf, ...a.sections.vision },
          ].map(({ Icon, title, content: metin }) => (
            <div key={title} className="rounded-2xl border border-gray-200 p-6">
              <Icon size={26} className="text-[#E8620C]" strokeWidth={1.75} />
              <h2 className="mt-3 text-lg font-bold text-gray-900">{title}</h2>
              <p className="mt-2 text-gray-700 leading-relaxed">{metin}</p>
            </div>
          ))}
        </section>

        {/* DEĞERLER */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-5">Değerlerimiz</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {a.sections.values.map((v, i) => {
              const Icon = DEGER_IKONLARI[i] ?? LuBadgeCheck;
              return (
                <div key={v.title} className="rounded-2xl border border-gray-200 bg-[#FAFAF9] p-5">
                  <Icon size={24} className="text-[#E8620C]" strokeWidth={1.75} />
                  <h3 className="mt-3 font-bold text-gray-900">{v.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* İLETİŞİM */}
        <section className="rounded-2xl bg-[#FDF1E7] border border-orange-100 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8620C] text-white"><LuMail size={22} /></span>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{a.contact.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{a.contact.subtitle}</p>
            </div>
          </div>
          <Link href="/bize-ulasin" className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] text-white font-semibold px-6 py-3 rounded-lg text-sm">
            {a.contact.cta} <LuArrowRight size={16} />
          </Link>
        </section>

        <p className="pt-6 border-t border-gray-200 text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-600">Yasal Uyarı:</span> {a.legalDisclaimer}
        </p>
      </div>
    </div>
  );
}
