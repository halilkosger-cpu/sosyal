'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LuMailX, LuCheck, LuInfo } from 'react-icons/lu';

/**
 * Ticari e-posta listesinden çıkma sayfası.
 *
 * E-postadaki ret bağlantısı doğrudan bir API ucuna değil buraya geliyor.
 * Sebep: e-posta istemcileri ve kurumsal güvenlik tarayıcıları
 * bağlantıları müşteri tıklamadan açıyor. Tek tıkla kapatan bir GET ucu
 * olsaydı, müşteri hiç istemeden listeden çıkmış olabilirdi. Burada bir
 * onay adımı var.
 */

function Icerik() {
  const p = useSearchParams();
  const m = p.get('m') ?? '';
  const s = p.get('s') ?? '';

  const [durum, setDurum] = useState<'hazir' | 'gonderiliyor' | 'tamam' | 'hata'>('hazir');
  const [hata, setHata] = useState('');

  const cik = async () => {
    setDurum('gonderiliyor');
    try {
      const yanit = await fetch('/api/musteri/ileti-izni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ m, s, izin: false }),
      });
      if (!yanit.ok) {
        const veri = await yanit.json().catch(() => ({}));
        setHata(veri.error || 'İşlem tamamlanamadı');
        setDurum('hata');
        return;
      }
      setDurum('tamam');
    } catch {
      setHata('Bağlantı hatası');
      setDurum('hata');
    }
  };

  const baglantiEksik = !m || !s;

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-5">
          {durum === 'tamam' ? (
            <LuCheck size={24} className="text-green-600" />
          ) : (
            <LuMailX size={24} className="text-[#BA4700]" />
          )}
        </div>

        {durum === 'tamam' ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Kaydınız güncellendi</h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Bundan sonra tanıtım ve hatırlatma e-postaları göndermeyeceğiz. Sipariş
              onayı, kargo bilgisi ve şifre sıfırlama gibi işlem e-postaları gönderilmeye
              devam eder; bunlar tanıtım değildir.
            </p>
            <Link
              href="/"
              className="inline-block bg-[#CC4E00] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#A63F00] transition"
            >
              Ana sayfaya dön
            </Link>
          </>
        ) : baglantiEksik ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Bağlantı eksik</h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Bu sayfaya e-postanızdaki bağlantıyla gelmeniz gerekiyor. Hesabınız varsa
              tercihlerinizi hesap sayfanızdan da değiştirebilirsiniz.
            </p>
            <Link href="/hesabim" className="text-sm font-semibold text-[#BA4700] hover:text-[#8F3700]">
              Hesabıma git
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Tanıtım e-postalarını durdur
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Sepet hatırlatması ve kampanya duyurusu gibi tanıtım e-postalarını almayı
              bırakmak üzeresiniz. Sipariş ve kargo bilgilendirmeleri bundan etkilenmez.
            </p>

            {durum === 'hata' && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                <LuInfo size={16} className="mt-0.5 flex-shrink-0" />
                <div>{hata}</div>
              </div>
            )}

            <button
              onClick={cik}
              disabled={durum === 'gonderiliyor'}
              className="w-full bg-[#CC4E00] text-white px-5 py-3 rounded-lg font-semibold text-sm hover:bg-[#A63F00] disabled:bg-orange-300 transition"
            >
              {durum === 'gonderiliyor' ? 'İşleniyor...' : 'Evet, göndermeyin'}
            </button>
            <Link
              href="/"
              className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3"
            >
              Vazgeç
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function IletiTercihiSayfasi() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <Icerik />
    </Suspense>
  );
}
