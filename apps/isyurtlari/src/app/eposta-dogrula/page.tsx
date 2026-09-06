'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LuCheck, LuInfo } from 'react-icons/lu';
import { musteriDegisti } from '@/lib/musteri-istemci';

/**
 * E-postadaki dogrulama baglantisinin indigi sayfa.
 *
 * Dogrulama isini sayfa acilinca POST ile yapiyor, baglantinin kendisi GET
 * degil: bazi e-posta istemcileri baglantilari onizleme icin kendiliginden
 * aciyor ve jeton kullanici tiklamadan tukenmis oluyor.
 */
function Dogrulama() {
  const jeton = useSearchParams().get('jeton');
  const [durum, setDurum] = useState<'bekliyor' | 'tamam' | 'hata'>('bekliyor');
  const [hata, setHata] = useState('');
  const calisti = useRef(false);

  useEffect(() => {
    // React'in gelistirme modunda etkileri iki kez calistirmasi jetonu ilk
    // caliştırmada tuketip ikincisinde "gecersiz" gostermesine yol aciyordu.
    if (calisti.current) return;
    calisti.current = true;

    if (!jeton) {
      setDurum('hata');
      setHata('Doğrulama bağlantısı eksik görünüyor.');
      return;
    }

    fetch('/api/musteri/eposta-dogrula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jeton }),
    })
      .then(async (yanit) => {
        const veri = await yanit.json();
        if (!yanit.ok) {
          setDurum('hata');
          setHata(veri.error || 'Doğrulama tamamlanamadı.');
          return;
        }
        musteriDegisti();
        setDurum('tamam');
      })
      .catch(() => {
        setDurum('hata');
        setHata('Bağlantı hatası. Lütfen tekrar deneyin.');
      });
  }, [jeton]);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          {durum === 'bekliyor' && (
            <>
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6000] mx-auto mb-5" />
              <h1 className="text-xl font-bold text-gray-900">E-postanız doğrulanıyor</h1>
            </>
          )}

          {durum === 'tamam' && (
            <>
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-5">
                <LuCheck size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">E-postanız doğrulandı</h1>
              <p className="text-sm text-gray-600 mb-6">Hesabınız kullanıma hazır.</p>
              <Link href="/hesabim"
                className="inline-block bg-[#CC4E00] hover:bg-[#A63F00] text-white px-6 py-3 rounded-lg font-semibold transition">
                Hesabıma git
              </Link>
            </>
          )}

          {durum === 'hata' && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-5">
                <LuInfo size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Doğrulanamadı</h1>
              <p className="text-sm text-gray-600 mb-6">{hata}</p>
              <Link href="/hesabim"
                className="inline-block bg-[#CC4E00] hover:bg-[#A63F00] text-white px-6 py-3 rounded-lg font-semibold transition">
                Hesabıma git
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EpostaDogrulamaSayfasi() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <Dogrulama />
    </Suspense>
  );
}
