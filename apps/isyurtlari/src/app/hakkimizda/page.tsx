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
import { LuHouse, LuShieldCheck, LuTarget, LuHeart, LuBadgeCheck, LuUsers, LuLeaf, LuBuilding2, LuArrowRight } from 'react-icons/lu';
import { content } from '@/config/content';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7]">

      {/* ─── BREADCRUMB ─── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#CC4E00] flex items-center gap-1 transition-colors">
              <LuHouse size={14} /> Ana Sayfa
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Hakkımızda</span>
          </div>
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section className="bg-[#0F2040] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CC4E00]/8 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="relative max-w-screen-xl mx-auto px-4 py-16 md:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-sky-300 text-xs font-semibold px-4 py-2 rounded-full mb-6 tracking-wide">
              <LuBadgeCheck size={14} /> {content.about.hero.badge}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight leading-tight">
              {/* Bosluk sart: <br /> gorsel satir atlatiyor ama metin
                  cikariminda bosluk uretmiyor. Bu yuzden sayfanin <h1>'i
                  "ürünleriylegerçek" seklinde bitisik okunuyordu - hem arama
                  motoru hem ekran okuyucu icin. */}
              {content.about.hero.title}{' '}<br />
              <span className="text-[#CC4E00]">{content.about.hero.titleHighlight}</span> {content.about.hero.titleSuffix}
            </h1>
            <p className="text-sky-200 text-lg leading-relaxed max-w-xl">
              {content.about.hero.description}
            </p>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {content.about.stats.map(({ value, label }) => (
              <div key={label} className="py-8 px-6 text-center">
                <p className="text-3xl font-bold text-[#CC4E00]">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-4 py-10 space-y-6">

        {/* ─── İŞYURTLARI NEDİR ─── */}
        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <LuBuilding2 size={20} color="#FF6000" strokeWidth={1.8} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{content.about.sections.whatIsWorkshop.title}</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                {content.about.sections.whatIsWorkshop.content}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {content.about.sections.whatIsWorkshop.content2}
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#111827] to-[#1e3a78] p-8 md:p-10 flex flex-col justify-center">
              <p className="text-sky-300 text-xs font-bold uppercase tracking-widest mb-3">Sosyal Etki</p>
              <p className="text-white text-lg font-semibold leading-relaxed mb-6">
                "{content.about.sections.whatIsWorkshop.socialImpactQuote}"
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#CC4E00] hover:bg-[#A63F00] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm w-fit"
              >
                Ürünleri İncele <LuArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── MİSYON & VİZYON ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <LuTarget size={20} color="#3B82F6" strokeWidth={1.8} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{content.about.sections.mission.title}</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {content.about.sections.mission.content}
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <LuLeaf size={20} color="#10B981" strokeWidth={1.8} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{content.about.sections.vision.title}</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {content.about.sections.vision.content}
            </p>
          </section>
        </div>

        {/* ─── DEĞERLER ─── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <LuHeart size={20} color="#8B5CF6" strokeWidth={1.8} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Değerlerimiz</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { Icon: LuBadgeCheck, color: '#10B981', bg: 'bg-emerald-50', title: content.about.sections.values[0].title, desc: content.about.sections.values[0].description },
              { Icon: LuShieldCheck, color: '#3B82F6', bg: 'bg-blue-50',   title: content.about.sections.values[1].title, desc: content.about.sections.values[1].description },
              { Icon: LuHeart,       color: '#EF4444', bg: 'bg-red-50',    title: content.about.sections.values[2].title, desc: content.about.sections.values[2].description },
              { Icon: LuLeaf,        color: '#F59E0B', bg: 'bg-amber-50',  title: content.about.sections.values[3].title, desc: content.about.sections.values[3].description },
            ].map(({ Icon, color, bg, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={21} color={color} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── İLETİŞİM CTA ─── */}
        <section className="bg-gradient-to-r from-[#111827] to-[#1e3a78] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LuUsers size={18} color="#7DD3FC" strokeWidth={1.8} />
              <p className="text-sky-300 text-sm font-semibold">Bizimle iletişime geçin</p>
            </div>
            <h3 className="text-white text-2xl font-bold tracking-tight">{content.about.contact.title}</h3>
            <p className="text-blue-300 text-sm mt-1">{content.about.contact.subtitle}</p>
          </div>
          <Link
            href="/bize-ulasin"
            className="flex-shrink-0 bg-[#CC4E00] hover:bg-[#A63F00] text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:scale-[1.03] flex items-center gap-2 text-sm"
          >
            {content.about.contact.cta} <LuArrowRight size={16} />
          </Link>
        </section>

        {/* ─── LEGAL DISCLAIMER ─── */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-600">Yasal Uyarı:</span> {content.about.legalDisclaimer}
          </p>
        </div>

      </div>

      <div className="h-8" />
    </div>
  );
}
