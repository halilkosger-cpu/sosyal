'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LuStar } from 'react-icons/lu';
import { YORUM_ONCESI_METNI, YORUM_SONRASI_TESEKKUR } from '@/lib/yorum-mesajlari';

/**
 * Misafir yorum sayfası: imzalı, süreli bağlantıyla (bkz. /api/yorum-baglantisi)
 * hesap açmadan yorum yazılır. Bağlantı bir sipariş kalemine bağlıdır; ürün
 * ve "doğrulanmış alışveriş" bilgisi oradan gelir.
 */

interface Urun {
  name: string;
  slug: string;
  imageUrl?: string | null;
}

type Durum = 'yukleniyor' | 'form' | 'yorumlandi' | 'gecersiz' | 'gonderildi';

export default function MisafirYorumSayfasi() {
  const { token } = useParams<{ token: string }>();
  const [durum, setDurum] = useState<Durum>('yukleniyor');
  const [urun, setUrun] = useState<Urun | null>(null);
  const [puan, setPuan] = useState(5);
  const [baslik, setBaslik] = useState('');
  const [metin, setMetin] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    fetch(`/api/yorum/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) return setDurum('gecersiz');
        const veri = await res.json();
        setUrun(veri.urun);
        setDurum(veri.yorumlandi ? 'yorumlandi' : 'form');
      })
      .catch(() => setDurum('gecersiz'));
  }, [token]);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata('');
    if (metin.trim().length < 10) {
      setHata('Yorum en az 10 karakter olmalı.');
      return;
    }
    setGonderiliyor(true);
    try {
      const res = await fetch(`/api/yorum/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: puan, title: baslik || null, text: metin }),
      });
      const veri = await res.json();
      if (res.ok) setDurum('gonderildi');
      else if (res.status === 409) setDurum('yorumlandi');
      else if (res.status === 410) setDurum('gecersiz');
      else setHata(veri.error || 'Yorum gönderilemedi');
    } catch {
      setHata('Bağlantı hatası. Lütfen tekrar deneyin.');
    }
    setGonderiliyor(false);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      {durum === 'yukleniyor' && <p className="text-center text-gray-500">Yükleniyor...</p>}

      {durum === 'gecersiz' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900">Bu bağlantı geçersiz ya da süresi dolmuş</h1>
          <p className="mt-2 text-sm text-gray-600">
            Siparişlerim sayfasından sipariş numaranız ve e-postanızla ürününüzü yeniden değerlendirebilirsiniz.
          </p>
          <Link href="/siparislerim" className="mt-5 inline-block rounded-lg bg-[#CC4E00] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A63F00]">
            Siparişlerim
          </Link>
        </div>
      )}

      {durum === 'yorumlandi' && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <h1 className="text-xl font-bold text-green-800">Bu ürün için yorumunuz alındı</h1>
          <p className="mt-2 text-sm text-green-800">Zaman ayırdığınız için çok teşekkür ederiz.</p>
        </div>
      )}

      {durum === 'gonderildi' && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-sm leading-relaxed text-green-900">{YORUM_SONRASI_TESEKKUR}</p>
          <Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#BA4700] hover:underline">
            Alışverişe devam et
          </Link>
        </div>
      )}

      {durum === 'form' && urun && (
        <form onSubmit={gonder} className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h1 className="text-xl font-bold text-gray-900">Ürününüzü değerlendirin</h1>
          <div className="mt-4 flex items-center gap-3">
            {urun.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urun.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
            )}
            <p className="font-semibold text-gray-900">{urun.name}</p>
          </div>
          <p className="mt-4 text-sm text-gray-600">{YORUM_ONCESI_METNI}</p>

          <div className="mt-5 flex gap-1" role="radiogroup" aria-label="Puan">
            {[1, 2, 3, 4, 5].map((y) => (
              <button key={y} type="button" onClick={() => setPuan(y)} aria-label={`${y} yıldız`}>
                <LuStar size={30} className={y <= puan ? 'fill-[#E8620C] text-[#E8620C]' : 'text-gray-300'} />
              </button>
            ))}
          </div>

          <label htmlFor="yorum-baslik" className="mt-5 block text-sm font-semibold text-gray-700">Başlık (isteğe bağlı)</label>
          <input
            id="yorum-baslik"
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            maxLength={100}
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#CC4E00] focus:outline-none"
          />

          <label htmlFor="yorum-metin" className="mt-4 block text-sm font-semibold text-gray-700">Yorumunuz</label>
          <textarea
            id="yorum-metin"
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            rows={5}
            maxLength={2000}
            required
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#CC4E00] focus:outline-none"
          />

          {hata && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{hata}</p>}

          <button
            type="submit"
            disabled={gonderiliyor}
            className="mt-5 w-full rounded-lg bg-[#CC4E00] py-3 text-sm font-bold text-white hover:bg-[#A63F00] disabled:opacity-50"
          >
            {gonderiliyor ? 'Gönderiliyor...' : 'Yorumu gönder'}
          </button>
        </form>
      )}
    </div>
  );
}
