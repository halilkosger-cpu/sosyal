'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuInfo } from 'react-icons/lu';
import { musteriDegisti } from '@/lib/musteri-istemci';

function KayitFormu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const devam = searchParams.get('devam') || '/hesabim';

  const [form, setForm] = useState({ ad: '', eposta: '', telefon: '', sifre: '' });
  const [kvkkOnayi, setKvkkOnayi] = useState(false);
  const [iletiIzni, setIletiIzni] = useState(false);
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const alan = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((onceki) => ({ ...onceki, [e.target.name]: e.target.value }));

  const gonder = async (olay: React.FormEvent) => {
    olay.preventDefault();
    setHata('');

    if (!kvkkOnayi) {
      setHata('Devam etmek için KVKK aydınlatma metnini onaylamanız gerekiyor.');
      return;
    }

    setGonderiliyor(true);

    try {
      const yanit = await fetch('/api/musteri/kayit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, kvkkOnayi, iletiIzni }),
      });
      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.error || 'Hesap oluşturulamadı');
        setGonderiliyor(false);
        return;
      }

      musteriDegisti();
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Hesap Oluştur</h1>
          <p className="text-sm text-gray-600 mb-6">
            Siparişleriniz, adresleriniz ve favorileriniz tek yerde.
          </p>

          {hata && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
              <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
              <div>{hata}</div>
            </div>
          )}

          <form onSubmit={gonder} className="space-y-4">
            <div>
              <label htmlFor="ad" className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
              <input id="ad" name="ad" type="text" required autoComplete="name"
                value={form.ad} onChange={alan} className="store-input" placeholder="Adınız Soyadınız" />
            </div>

            <div>
              <label htmlFor="eposta" className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
              <input id="eposta" name="eposta" type="email" required autoComplete="email"
                value={form.eposta} onChange={alan} className="store-input" placeholder="ornek@email.com" />
            </div>

            <div>
              <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-2">
                Telefon <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
              </label>
              <input id="telefon" name="telefon" type="tel" autoComplete="tel"
                value={form.telefon} onChange={alan} className="store-input" placeholder="+90 (5XX) XXX XX XX" />
            </div>

            <div>
              <label htmlFor="sifre" className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
              <input id="sifre" name="sifre" type="password" required minLength={8} autoComplete="new-password"
                value={form.sifre} onChange={alan} className="store-input" placeholder="En az 8 karakter" />
              <p className="text-xs text-gray-500 mt-1.5">En az 8 karakter olmalı.</p>
            </div>

            {/* KVKK onayi ayri ve zorunlu; ticari ileti izni ayri ve istege
                bagli. Ikisini tek kutuda toplamak izni gecersiz kilar. */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={kvkkOnayi} onChange={(e) => setKvkkOnayi(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#FF6000] flex-shrink-0" />
                <span>
                  <Link href="/kvkk" target="_blank" className="text-[#BA4700] hover:text-[#8F3700] font-medium underline">
                    KVKK aydınlatma metnini
                  </Link>{' '}
                  ve{' '}
                  <Link href="/gizlilik-sozlesmesi" target="_blank" className="text-[#BA4700] hover:text-[#8F3700] font-medium underline">
                    gizlilik sözleşmesini
                  </Link>{' '}
                  okudum, onaylıyorum.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={iletiIzni} onChange={(e) => setIletiIzni(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#FF6000] flex-shrink-0" />
                <span>Kampanya ve yeni ürün duyurularını e-posta ile almak istiyorum.</span>
              </label>
            </div>

            <button type="submit" disabled={gonderiliyor}
              className="w-full bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition">
              {gonderiliyor ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            Zaten hesabınız var mı?{' '}
            <Link
              href={`/giris${devam !== '/hesabim' ? `?devam=${encodeURIComponent(devam)}` : ''}`}
              className="text-[#BA4700] hover:text-[#8F3700] font-semibold"
            >
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function KayitSayfasi() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <KayitFormu />
    </Suspense>
  );
}
