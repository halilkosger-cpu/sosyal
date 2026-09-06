'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LuArrowLeft, LuSearch } from 'react-icons/lu';
import UrunKarti, { type KartUrunu } from '@/components/UrunKarti';

/**
 * Arama sonuçları.
 *
 * Sıralama ve sayfa numarası adres çubuğunda tutuluyor. Önceden bunlar
 * bileşen durumundaydı: filtrelenmiş bir sonuç sayfası paylaşılamıyor,
 * geri tuşu çalışmıyor ve arama motoru bu sayfaları hiç görmüyordu.
 */

interface Yanit {
  urunler: KartUrunu[];
  toplam: number;
  sayfa: number;
  sayfaSayisi: number;
}

const SIRALAMALAR = [
  { deger: 'varsayilan', metin: 'En alakalı' },
  { deger: 'fiyat-artan', metin: 'Fiyat: Düşükten Yükseğe' },
  { deger: 'fiyat-azalan', metin: 'Fiyat: Yüksekten Düşüğe' },
  { deger: 'isim', metin: 'İsim: A-Z' },
  { deger: 'yeni', metin: 'En yeniler' },
];

function AramaSonuclari() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const sorgu = params.get('q') || '';
  const sirala = params.get('sirala') || 'varsayilan';
  const sayfa = Math.max(1, Number(params.get('sayfa')) || 1);

  const [veri, setVeri] = useState<Yanit | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  /** Adres çubuğundaki tek bir parametreyi değiştirir, sayfayı başa alır. */
  const parametreDegistir = useCallback(
    (ad: string, deger: string | null, sayfayiKoru = false) => {
      const yeni = new URLSearchParams(params.toString());
      if (deger === null || deger === '') yeni.delete(ad);
      else yeni.set(ad, deger);
      if (!sayfayiKoru) yeni.delete('sayfa');
      router.push(`${pathname}?${yeni.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  useEffect(() => {
    if (!sorgu) {
      setVeri(null);
      setYukleniyor(false);
      return;
    }

    let iptal = false;
    setYukleniyor(true);

    const arananlar = new URLSearchParams({ ara: sorgu, sirala, sayfa: String(sayfa) });

    fetch(`/api/urunler?${arananlar}`, { cache: 'no-store' })
      .then((y) => (y.ok ? y.json() : null))
      .then((v) => {
        if (iptal) return;
        setVeri(v);
      })
      .catch(() => {
        if (!iptal) setVeri(null);
      })
      .finally(() => {
        if (!iptal) setYukleniyor(false);
      });

    return () => {
      iptal = true;
    };
  }, [sorgu, sirala, sayfa]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 text-[#BA4700] hover:text-[#8F3700] font-medium mb-4 transition">
            <LuArrowLeft size={18} /> Geri
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Arama Sonuçları</h1>
          {sorgu && !yukleniyor && (
            <p className="text-gray-600 text-sm mt-2">
              &quot;<strong>{sorgu}</strong>&quot; için <strong>{veri?.toplam ?? 0}</strong> sonuç bulundu
            </p>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {!sorgu ? (
          <div className="text-center py-12">
            <LuSearch size={32} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Arama yapmak için üstteki arama çubuğunu kullanın</p>
          </div>
        ) : yukleniyor ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : !veri || veri.urunler.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-2">
              &quot;<strong>{sorgu}</strong>&quot; ile eşleşen ürün bulunamadı
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Daha kısa bir kelime deneyin ya da kategorilere göz atın.
            </p>
            <Link href="/" className="text-[#BA4700] hover:text-[#8F3700] font-semibold">
              Ana sayfaya dön
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end mb-5">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Sırala:
                <select
                  value={sirala}
                  onChange={(e) => parametreDegistir('sirala', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-[#FF6000] focus:outline-none focus:ring-1 focus:ring-[#FF6000]"
                >
                  {SIRALAMALAR.map((s) => (
                    <option key={s.deger} value={s.deger}>{s.metin}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {veri.urunler.map((urun) => (
                <UrunKarti key={urun.id} urun={urun} kategoriGoster favoriButonu sepetButonu />
              ))}
            </div>

            {veri.sayfaSayisi > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => parametreDegistir('sayfa', String(sayfa - 1), true)}
                  disabled={sayfa <= 1}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Önceki
                </button>
                <span className="text-sm text-gray-600">
                  Sayfa {veri.sayfa} / {veri.sayfaSayisi}
                </span>
                <button
                  onClick={() => parametreDegistir('sayfa', String(sayfa + 1), true)}
                  disabled={sayfa >= veri.sayfaSayisi}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AramaSayfasi() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AramaSonuclari />
    </Suspense>
  );
}
