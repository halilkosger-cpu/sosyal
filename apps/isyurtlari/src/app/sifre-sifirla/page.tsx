'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuInfo, LuCheck } from 'react-icons/lu';
import { musteriDegisti } from '@/lib/musteri-istemci';

/**
 * Sifre sifirlama.
 *
 * Tek sayfa iki adimi da tasiyor: adres cubugunda jeton yoksa baglanti
 * istenir, varsa yeni sifre belirlenir. Ayri iki sayfa olsaydi e-postadaki
 * baglantinin hangi sayfaya gitmesi gerektigi ayrica anlatilmak zorundaydi.
 */
function SifirlamaAkisi() {
  const searchParams = useSearchParams();
  const jeton = searchParams.get('jeton');

  return jeton ? <YeniSifre jeton={jeton} /> : <BaglantiIste />;
}

function Kart({ baslik, aciklama, children }: { baslik: string; aciklama: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{baslik}</h1>
          <p className="text-sm text-gray-600 mb-6">{aciklama}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function Hata({ metin }: { metin: string }) {
  return (
    <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
      <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
      <div>{metin}</div>
    </div>
  );
}

function BaglantiIste() {
  const [eposta, setEposta] = useState('');
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const gonder = async (olay: React.FormEvent) => {
    olay.preventDefault();
    setHata('');
    setGonderiliyor(true);

    try {
      const yanit = await fetch('/api/musteri/sifre-sifirla/istek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eposta }),
      });
      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.error || 'İstek gönderilemedi');
        setGonderiliyor(false);
        return;
      }
      setMesaj(veri.mesaj || 'Bağlantı gönderildi.');
    } catch {
      setHata('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setGonderiliyor(false);
    }
  };

  if (mesaj) {
    return (
      <Kart baslik="Bağlantı gönderildi" aciklama={mesaj}>
        <p className="text-sm text-gray-600 mb-6">
          E-posta birkaç dakika içinde gelmezse gereksiz (spam) klasörünü kontrol edin.
        </p>
        <Link href="/giris" className="block w-full text-center bg-[#CC4E00] hover:bg-[#A63F00] text-white py-3 rounded-lg font-semibold transition">
          Giriş sayfasına dön
        </Link>
      </Kart>
    );
  }

  return (
    <Kart
      baslik="Şifremi Unuttum"
      aciklama="Hesabınızın e-posta adresini girin; şifrenizi sıfırlamanız için bir bağlantı gönderelim."
    >
      {hata && <Hata metin={hata} />}
      <form onSubmit={gonder} className="space-y-4">
        <div>
          <label htmlFor="eposta" className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
          <input id="eposta" type="email" required autoComplete="email" value={eposta}
            onChange={(e) => setEposta(e.target.value)} className="store-input" placeholder="ornek@email.com" />
        </div>
        <button type="submit" disabled={gonderiliyor}
          className="w-full bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition">
          {gonderiliyor ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
        </button>
      </form>
      <p className="text-sm text-gray-600 text-center mt-6">
        <Link href="/giris" className="text-[#BA4700] hover:text-[#8F3700] font-semibold">Giriş sayfasına dön</Link>
      </p>
    </Kart>
  );
}

function YeniSifre({ jeton }: { jeton: string }) {
  const router = useRouter();
  const [sifre, setSifre] = useState('');
  const [tekrar, setTekrar] = useState('');
  const [hata, setHata] = useState('');
  const [tamam, setTamam] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const gonder = async (olay: React.FormEvent) => {
    olay.preventDefault();
    setHata('');

    if (sifre !== tekrar) {
      setHata('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setGonderiliyor(true);
    try {
      const yanit = await fetch('/api/musteri/sifre-sifirla/uygula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jeton, sifre }),
      });
      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.error || 'Şifre güncellenemedi');
        setGonderiliyor(false);
        return;
      }

      musteriDegisti();
      setTamam(true);
      setTimeout(() => {
        router.push('/hesabim');
        router.refresh();
      }, 1500);
    } catch {
      setHata('Bağlantı hatası. Lütfen tekrar deneyin.');
      setGonderiliyor(false);
    }
  };

  if (tamam) {
    return (
      <Kart baslik="Şifreniz güncellendi" aciklama="Hesabınıza yönlendiriliyorsunuz.">
        <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <LuCheck size={18} />
          <span className="text-sm">Diğer cihazlardaki oturumlar güvenlik için kapatıldı.</span>
        </div>
      </Kart>
    );
  }

  return (
    <Kart baslik="Yeni Şifre Belirle" aciklama="Yeni şifreniz en az 8 karakter olmalı.">
      {hata && <Hata metin={hata} />}
      <form onSubmit={gonder} className="space-y-4">
        <div>
          <label htmlFor="sifre" className="block text-sm font-medium text-gray-700 mb-2">Yeni şifre</label>
          <input id="sifre" type="password" required minLength={8} autoComplete="new-password"
            value={sifre} onChange={(e) => setSifre(e.target.value)} className="store-input" placeholder="En az 8 karakter" />
        </div>
        <div>
          <label htmlFor="tekrar" className="block text-sm font-medium text-gray-700 mb-2">Yeni şifre (tekrar)</label>
          <input id="tekrar" type="password" required minLength={8} autoComplete="new-password"
            value={tekrar} onChange={(e) => setTekrar(e.target.value)} className="store-input" placeholder="Şifreyi tekrar girin" />
        </div>
        <button type="submit" disabled={gonderiliyor}
          className="w-full bg-[#CC4E00] hover:bg-[#A63F00] disabled:bg-orange-300 text-white py-3 rounded-lg font-semibold transition">
          {gonderiliyor ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
        </button>
      </form>
    </Kart>
  );
}

export default function SifreSifirlamaSayfasi() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <SifirlamaAkisi />
    </Suspense>
  );
}
