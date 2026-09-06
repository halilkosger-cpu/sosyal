'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuInfo } from 'react-icons/lu';
import { musteriDegisti } from '@/lib/musteri-istemci';

/**
 * Musteri girisi.
 *
 * `?devam=` ile geldiyse giristen sonra oraya donuyor: sepetten giris
 * isteyen musteri, giris yaptiktan sonra ana sayfada degil kaldigi yerde
 * bulmali kendini.
 */
function GirisFormu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const devam = searchParams.get('devam') || '/hesabim';

  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const gonder = async (olay: React.FormEvent) => {
    olay.preventDefault();
    setHata('');
    setGonderiliyor(true);

    try {
      const yanit = await fetch('/api/musteri/giris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eposta, sifre }),
      });
      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.error || 'Giriş yapılamadı');
        setGonderiliyor(false);
        return;
      }

      musteriDegisti();
      // Acik yonlendirme olmasin: yalnizca site ici yollara donuluyor.
      router.push(devam.startsWith('/') ? devam : '/hesabim');
      router.refresh();
    } catch {
      setHata('Bağlantı hatası. Lütfen tekrar deneyin.');
      setGonderiliyor(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Giriş Yap</h1>
          <p className="text-sm text-gray-600 mb-6">
            Siparişlerinizi takip etmek ve sepetinizi cihazlar arasında taşımak için.
          </p>

          {hata && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
              <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
              <div>{hata}</div>
            </div>
          )}

          <form onSubmit={gonder} className="space-y-4">
            <div>
              <label htmlFor="eposta" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                id="eposta"
                type="email"
                autoComplete="email"
                required
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                className="store-input"
                placeholder="ornek@email.com"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label htmlFor="sifre" className="block text-sm font-medium text-gray-700">
                  Şifre
                </label>
                <Link href="/sifre-sifirla" className="text-xs text-[#BA4700] hover:text-[#8F3700] font-medium">
                  Şifremi unuttum
                </Link>
              </div>
              <input
                id="sifre"
                type="password"
                autoComplete="current-password"
                required
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                className="store-input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={gonderiliyor}
              className="w-full bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition"
            >
              {gonderiliyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            Hesabınız yok mu?{' '}
            <Link
              href={`/kayit${devam !== '/hesabim' ? `?devam=${encodeURIComponent(devam)}` : ''}`}
              className="text-[#BA4700] hover:text-[#8F3700] font-semibold"
            >
              Hesap oluşturun
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GirisSayfasi() {
  // useSearchParams bir Suspense sinirinin altinda olmali; aksi halde tum
  // sayfa istemci tarafinda uretilmeye zorlanir.
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <GirisFormu />
    </Suspense>
  );
}
