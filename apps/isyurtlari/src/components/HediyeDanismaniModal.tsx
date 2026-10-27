'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LuSparkles,
  LuX,
  LuGift,
  LuCheck,
  LuArrowRight,
  LuRotateCcw,
  LuShoppingBag,
  LuHeart,
  LuBriefcase,
  LuBuilding,
  LuSmile,
} from 'react-icons/lu';
import { sepeteEkle } from '@/lib/cart';

interface UrunOneri {
  ad: string;
  slug: string;
  fiyat: number;
  kategori: string;
  gorsel: string;
  aciklama: string;
  uyumYuzdesi: number;
}

const ONERILEN_KATALOG: Record<string, UrunOneri[]> = {
  gida: [
    {
      ad: 'Bal & Arı Ürünleri',
      slug: 'bal-ari-urunleri',
      fiyat: 290,
      kategori: 'Doğal Gıda',
      gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426320257-bal-ari-urunleri-4MmrQbfLaPtjHUOTlgx7doMxvAB0sB.jpg',
      aciklama: 'Katkısız yayla süzme balı, doğrudan işyurtları arıcılık atölyesinden.',
      uyumYuzdesi: 98,
    },
    {
      ad: 'Zeytinyağı - 500ml',
      slug: 'zeytinyagi-500ml',
      fiyat: 350,
      kategori: 'Doğal Gıda',
      gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426323077-zeytinyagi-500ml-TX8Qvee7nsNhBqI2DUBM5RaYmwe91d.jpg',
      aciklama: 'Erken hasat soğuk sıkım zeytinyağı, düşük asit oranıyla sofralık lezzet.',
      uyumYuzdesi: 95,
    },
    {
      ad: 'Reçel Çeşitleri Paketi',
      slug: 'recel-cesitleri',
      fiyat: 160,
      kategori: 'Doğal Gıda',
      gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426321822-recel-cesitleri-70KHcaxT5s22UuJ9oD3smjsrI8NE9o.jpg',
      aciklama: 'Geleneksel usulle kaynatılmış vişne, çilek ve incir üçlü lezzet seti.',
      uyumYuzdesi: 92,
    },
  ],
  ahsap: [
    {
      ad: 'Dekoratif Ahşap Kutular',
      slug: 'ahsap-kutular',
      fiyat: 2200,
      kategori: 'El Sanatları & Ahşap',
      gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426318188-kuru-fasulye-tahillar-efuxKijQTaJERnTqBBZvBckXGLw0AI.jpg',
      aciklama: 'Sedef kakma el oyması sandık. Takı, saat ve hatıra saklamak için ideal.',
      uyumYuzdesi: 99,
    },
    {
      ad: 'Takı Çantası & Saklama',
      slug: 'taki-cantasi',
      fiyat: 370,
      kategori: 'Tekstil & Zanaat',
      gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426316977-badem-RlGZD3us6lcFfykxWV3opmLpGvkY4z.jpg',
      aciklama: 'El emeği dikişli, zarif kumaş ve kadife astarlı takı çantası.',
      uyumYuzdesi: 91,
    },
    {
      ad: 'Bez Çanta Setleri (3\'lü)',
      slug: 'bez-canta-setleri',
      fiyat: 900,
      kategori: 'Tekstil Ürünleri',
      gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426318188-kuru-fasulye-tahillar-efuxKijQTaJERnTqBBZvBckXGLw0AI.jpg',
      aciklama: 'Doğal pamuklu kumaştan dayanıklı, çevre dostu çanta seti.',
      uyumYuzdesi: 88,
    },
  ],
  prestij: [
    {
      ad: 'Dekoratif Ahşap Kutular',
      slug: 'ahsap-kutular',
      fiyat: 2200,
      kategori: 'Prestij & Kurumsal',
      gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426318188-kuru-fasulye-tahillar-efuxKijQTaJERnTqBBZvBckXGLw0AI.jpg',
      aciklama: 'Protokol ve yöneticiler için el yapımı sedef kakmalı özel sandık.',
      uyumYuzdesi: 99,
    },
    {
      ad: 'Bal & Arı Ürünleri',
      slug: 'bal-ari-urunleri',
      fiyat: 290,
      kategori: 'Prestij & Kurumsal',
      gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426320257-bal-ari-urunleri-4MmrQbfLaPtjHUOTlgx7doMxvAB0sB.jpg',
      aciklama: 'Doğal polen ve süzme çiçek balı seti.',
      uyumYuzdesi: 93,
    },
    {
      ad: 'Zeytinyağı - 500ml',
      slug: 'zeytinyagi-500ml',
      fiyat: 350,
      kategori: 'Prestij & Kurumsal',
      gorsel: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426323077-zeytinyagi-500ml-TX8Qvee7nsNhBqI2DUBM5RaYmwe91d.jpg',
      aciklama: 'Özel cam şişesinde soğuk sıkım naturel sızma.',
      uyumYuzdesi: 90,
    },
  ],
};

export default function HediyeDanismaniModal() {
  const [acik, setAcik] = useState(false);
  const [adim, setAdim] = useState(1);
  const [kime, setKime] = useState<string>('');
  const [tercih, setTercih] = useState<string>('gida');
  const [, setButce] = useState<string>('');
  const [eklenenSlug, setEklenenSlug] = useState<string | null>(null);

  const sifirla = () => {
    setAdim(1);
    setKime('');
    setTercih('gida');
    setButce('');
  };

  const onerileriGetir = (): UrunOneri[] => {
    if (kime === 'kurumsal') return ONERILEN_KATALOG.prestij;
    if (tercih === 'ahsap') return ONERILEN_KATALOG.ahsap;
    return ONERILEN_KATALOG.gida;
  };

  const urunSepeteEkle = (urun: UrunOneri) => {
    sepeteEkle({
      id: urun.slug,
      name: urun.ad,
      price: urun.fiyat,
      slug: urun.slug,
      quantity: 50, // stok adedi
      imageUrl: urun.gorsel,
    }, 1);
    setEklenenSlug(urun.slug);
    setTimeout(() => setEklenenSlug(null), 2500);
  };

  const pathname = usePathname();
  const GIZLI_SAYFALAR = ['/checkout', '/admin', '/order-confirmation'];
  if (GIZLI_SAYFALAR.some((p) => pathname?.startsWith(p))) return null;

  return (
    <>
      {/* Sabit Tetikleyici Buton: Mobilde sağ kenarda kompakt ikon, masaüstünde tam hap buton */}
      <button
        onClick={() => {
          setAcik(true);
          sifirla();
        }}
        className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-30 flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto p-0 md:px-3.5 md:py-2.5 bg-[#0F2040]/95 hover:bg-[#CC4E00] text-white rounded-full shadow-xl hover:shadow-orange-500/30 transition-all duration-300 group border border-white/20 backdrop-blur-xs"
        title="30 Saniyede Hediye & Ürün Bulucu"
        aria-label="Hediye Danışmanı"
      >
        <div className="relative flex items-center justify-center">
          <span className="relative flex h-2 w-2 mr-0 md:mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          <LuGift className="text-orange-400 group-hover:rotate-12 transition-transform" size={17} />
        </div>
        <span className="text-xs font-bold tracking-wide hidden md:inline">Hediye &amp; Ürün Bulucu</span>
      </button>

      {/* Modal Dialog */}
      {acik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden relative transition-all">
            {/* Üst Başlık */}
            <div className="bg-gradient-to-r from-[#0F2040] to-[#1c3563] text-white p-5 pr-12 relative">
              <button
                onClick={() => setAcik(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Kapat"
              >
                <LuX size={18} />
              </button>

              <div className="flex items-center gap-2 text-orange-400 text-xs font-bold tracking-wider uppercase mb-1">
                <LuSparkles size={14} /> 2026 Akıllı Seçim Motoru
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                30 Saniyede Doğal Ürün & Hediye Danışmanı
              </h2>
              <p className="text-blue-100/80 text-xs mt-0.5">
                Size ve sevdiklerinize en uygun el emeği İşyurtları ürünlerini nokta atışı bulalım.
              </p>

              {/* İlerleme Çubuğu */}
              <div className="flex gap-1.5 mt-4">
                {[1, 2, 3, 4].map((no) => (
                  <div
                    key={no}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      adim >= no ? 'bg-[#CC4E00]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* İçerik Gövdesi */}
            <div className="p-6">
              {/* ADIM 1: KİME */}
              {adim === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-[#CC4E00] text-xs font-bold flex items-center justify-center">1</span>
                    Kimin için arıyorsunuz?
                  </h3>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {[
                      { id: 'sevdiklerim', label: 'Sevdiklerim & Ailem', desc: 'Sıcak, samimi ve doğal hediye', icon: LuHeart },
                      { id: 'kendim', label: 'Kendim İçin', desc: 'Katkısız gıda & günlük bakım', icon: LuSmile },
                      { id: 'kurumsal', label: 'Kurumsal & Yönetici', desc: 'Prestijli protokol & iş hediyesi', icon: LuBriefcase },
                      { id: 'ev', label: 'Yeni Ev & Çeyiz', desc: 'Kalıcı el sanatı & hatıra', icon: LuBuilding },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setKime(sec.id);
                          setAdim(2);
                        }}
                        className="flex flex-col items-start p-4 rounded-2xl border border-gray-200 hover:border-[#CC4E00] hover:bg-orange-50/40 text-left transition-all group"
                      >
                        <sec.icon className="text-[#0F2040] group-hover:text-[#CC4E00] mb-2 transition-colors" size={22} />
                        <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#CC4E00]">
                          {sec.label}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5 leading-snug">{sec.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ADIM 2: HANGİ KATEGORİ */}
              {adim === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-[#CC4E00] text-xs font-bold flex items-center justify-center">2</span>
                    Hangi kategori ilginizi çeker?
                  </h3>
                  <div className="space-y-2.5 pt-1">
                    {[
                      { id: 'gida', title: '🍯 Doğal Gıda & Şifalı Tatlar', desc: 'Köy balı, soğuk sıkım zeytinyağı, ev reçelleri, kuru bakliyat' },
                      { id: 'ahsap', title: '🪵 Sedef Kakma Ahşap & El Sanatları', desc: 'Elde oyulmuş takı sandıkları, masa üstü hatıra objeleri' },
                      { id: 'prestij', title: '👑 Özel İşyurtları Prestij Seçkisi', desc: 'Protokol hediyelikleri ve özel üretim seçkin ürünler' },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setTercih(sec.id);
                          setAdim(3);
                        }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:border-[#CC4E00] hover:bg-orange-50/40 text-left transition-all group"
                      >
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#CC4E00]">
                            {sec.title}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{sec.desc}</p>
                        </div>
                        <LuArrowRight className="text-gray-300 group-hover:text-[#CC4E00] group-hover:translate-x-1 transition-all flex-shrink-0" size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ADIM 3: BÜTÇE */}
              {adim === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-[#CC4E00] text-xs font-bold flex items-center justify-center">3</span>
                    Düşündüğünüz bütçe aralığı nedir?
                  </h3>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {[
                      { id: 'eko', label: '500 TL\'ye Kadar', sub: 'Ekonomik & Zarif' },
                      { id: 'orta', label: '500 - 1.500 TL', sub: 'En Popüler Seçim' },
                      { id: 'luks', label: '1.500 TL ve Üzeri', sub: 'Prestijli & Kalıcı' },
                      { id: 'hepsi', label: 'Fark Etmez', sub: 'En Çok Beğenilenler' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setButce(b.id);
                          setAdim(4);
                        }}
                        className="p-4 rounded-2xl border border-gray-200 hover:border-[#CC4E00] hover:bg-orange-50/40 text-left transition-all group"
                      >
                        <p className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-[#CC4E00]">
                          {b.label}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{b.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ADIM 4: SONUÇLAR */}
              {adim === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                        <LuSparkles className="text-orange-500" size={15} /> Sizin İçin Özel Seçilen 3 Ürün
                      </h3>
                      <p className="text-[11px] text-gray-500">Doğrudan ceza infaz kurumu atölyelerinden.</p>
                    </div>
                    <button
                      onClick={sifirla}
                      className="text-[11px] font-bold text-[#CC4E00] flex items-center gap-1 hover:underline"
                    >
                      <LuRotateCcw size={12} /> Yeniden Seç
                    </button>
                  </div>

                  <div className="space-y-3 pt-1 max-h-[300px] overflow-y-auto pr-1">
                    {onerileriGetir().map((urun) => (
                      <div
                        key={urun.slug}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-orange-200 bg-gray-50/50 hover:bg-white transition-all shadow-sm"
                      >
                        <Link
                          href={`/urun/${urun.slug}`}
                          onClick={() => setAcik(false)}
                          className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0"
                        >
                          <Image
                            src={urun.gorsel}
                            alt={urun.ad}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              %{urun.uyumYuzdesi} Uyum
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium truncate">{urun.kategori}</span>
                          </div>
                          <Link
                            href={`/urun/${urun.slug}`}
                            onClick={() => setAcik(false)}
                            className="text-xs font-bold text-gray-900 hover:text-[#CC4E00] truncate block mt-0.5"
                          >
                            {urun.ad}
                          </Link>
                          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{urun.aciklama}</p>
                          <p className="text-xs font-extrabold text-[#0F2040] mt-1">
                            {urun.fiyat > 0 ? `${urun.fiyat.toLocaleString('tr-TR')} ₺` : 'Fiyat Belirleniyor'}
                          </p>
                        </div>

                        {/* Sepete Ekle */}
                        {urun.fiyat > 0 && (
                          <button
                            onClick={() => urunSepeteEkle(urun)}
                            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0 ${
                              eklenenSlug === urun.slug
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#CC4E00] hover:bg-[#a83f00] text-white'
                            }`}
                          >
                            {eklenenSlug === urun.slug ? (
                              <>
                                <LuCheck size={13} /> Eklendi
                              </>
                            ) : (
                              <>
                                <LuShoppingBag size={13} /> Ekle
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/sepet"
                      onClick={() => setAcik(false)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#0F2040] hover:bg-black text-white text-xs font-bold rounded-2xl transition-all shadow-md"
                    >
                      Sepete Git ve Alışverişi Tamamla &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
