'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuArrowLeft, LuPackage, LuTruck, LuCheck, LuClock, LuSearch, LuInfo } from 'react-icons/lu';
import { useMusteri } from '@/lib/musteri-istemci';

/**
 * Siparislerim.
 *
 * Sayfa iki durumu birden tasiyor:
 *
 *  - Giris yapmis musteri: hesabina bagli siparislerin listesi.
 *  - Misafir: siparis numarasi + e-posta ile sorgulama formu.
 *
 * Misafir sorgusu bilerek duruyor. Sitede uzun sure hesap yoktu ve verilen
 * butun siparisler misafir siparisi; onlari sorgulamanin tek yolu bu form.
 * Ayrica hesap acmak istemeyen musteri de siparisini takip edebilmeli.
 */

import SiparisDurumu from '@/components/SiparisDurumu';
import { SIPARIS_DURUM_METNI } from '@/lib/kargo';

interface Kalem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; slug: string; imageUrl?: string | null };
}

interface Siparis {
  id?: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  taxTotal?: number | null;
  paymentMethod: string;
  createdAt: string;
  items: Kalem[];
  urunAdedi: number;
  // Kargo takibi
  kargoFirmasi?: string | null;
  kargoTakipNo?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

const durumStili: Record<string, { renk: string; arka: string; Ikon: React.ElementType }> = {
  PENDING: { renk: 'text-yellow-700', arka: 'bg-yellow-50 border-yellow-200', Ikon: LuClock },
  CONFIRMED: { renk: 'text-blue-700', arka: 'bg-blue-50 border-blue-200', Ikon: LuCheck },
  SHIPPED: { renk: 'text-purple-700', arka: 'bg-purple-50 border-purple-200', Ikon: LuTruck },
  DELIVERED: { renk: 'text-green-700', arka: 'bg-green-50 border-green-200', Ikon: LuCheck },
  CANCELLED: { renk: 'text-red-700', arka: 'bg-red-50 border-red-200', Ikon: LuPackage },
};

/**
 * Durum metinleri artik lib/kargo.ts'te, tek yerde.
 *
 * Buradaki tablo "Odeme Bekleniyor" / "Odeme Onaylandi" diyordu. Kargo
 * karsi odemeli: musteri site uzerinden hicbir odeme yapmiyor, bekleyen
 * bir odeme yok. Musteri "odemem mi eksik?" diye dusunuyordu.
 */
const durumMetni = SIPARIS_DURUM_METNI as Record<string, string>;

function SiparisKarti({ siparis }: { siparis: Siparis }) {
  const stil = durumStili[siparis.status];
  const DurumIkonu = stil?.Ikon ?? LuPackage;

  return (
    <div className={`rounded-2xl border-2 bg-white p-6 ${stil?.arka ?? 'border-gray-200'}`}>
      <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Sipariş #{siparis.orderNumber}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(siparis.createdAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <DurumIkonu size={20} className={stil?.renk} />
          <span className={`text-sm font-bold ${stil?.renk}`}>
            {durumMetni[siparis.status] || siparis.status}
          </span>
        </div>
      </div>

      <SiparisDurumu
        durum={siparis.status}
        kargoKodu={siparis.kargoFirmasi}
        takipNo={siparis.kargoTakipNo}
        kargoyaVerilme={siparis.shippedAt}
        teslimEdilme={siparis.deliveredAt}
      />

      <div className="mb-4 space-y-3 border-b border-gray-200 pb-4">
        <p className="text-sm font-semibold text-gray-700">{siparis.urunAdedi} ürün</p>
        {siparis.items.map((k) => (
          <div key={k.id} className="flex items-center gap-3">
            {k.product.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={k.product.imageUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
            )}
            <Link href={`/urun/${k.product.slug}`}
              className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 hover:text-[#BA4700]">
              {k.product.name}
            </Link>
            <span className="flex-shrink-0 text-sm text-gray-500">×{k.quantity}</span>
            <span className="flex-shrink-0 text-sm font-semibold text-gray-900">
              ₺{(k.price * k.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <span className="text-sm text-gray-600">
          {siparis.paymentMethod === 'TRANSFER' ? 'Havale / EFT' : 'Kredi Kartı'}
          {' · Kargo karşı ödemeli'}
        </span>
        <div className="text-right">
          <span className="text-xl font-bold text-[#BA4700]">₺{siparis.totalAmount.toFixed(2)}</span>
          {/* Eski siparislerde kirilim uretilmedigi icin taxTotal bos olabilir;
              o durumda uydurma bir rakam yazmak yerine satir hic gosterilmiyor. */}
          {typeof siparis.taxTotal === 'number' && (
            <p className="text-xs text-gray-500 mt-0.5">KDV dahil (₺{siparis.taxTotal.toFixed(2)})</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Giris yapmis musterinin siparis listesi. */
function SiparisListesi() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const [sonSayfa, setSonSayfa] = useState(true);

  useEffect(() => {
    let iptal = false;
    setYukleniyor(true);

    fetch(`/api/musteri/siparisler?sayfa=${sayfa}`, { cache: 'no-store' })
      .then(async (yanit) => {
        const veri = await yanit.json();
        if (iptal) return;
        if (!yanit.ok) {
          setHata(veri.error || 'Siparişleriniz getirilemedi');
          return;
        }
        setSiparisler(Array.isArray(veri.siparisler) ? veri.siparisler : []);
        setSonSayfa(Boolean(veri.sonSayfa));
      })
      .catch(() => {
        if (!iptal) setHata('Bağlantı kurulamadı, lütfen tekrar deneyin.');
      })
      .finally(() => {
        if (!iptal) setYukleniyor(false);
      });

    return () => {
      iptal = true;
    };
  }, [sayfa]);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6000]" />
      </div>
    );
  }

  if (hata) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
        <LuInfo size={18} className="mt-0.5 flex-shrink-0" />
        <div>{hata}</div>
      </div>
    );
  }

  if (siparisler.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-5">
          <LuPackage size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Henüz siparişiniz yok</h2>
        <p className="text-sm text-gray-600 mb-6">
          Hesabınızı açmadan önce verdiğiniz siparişler burada görünmez; onları aşağıdaki
          sorgulama formuyla takip edebilirsiniz.
        </p>
        <Link href="/"
          className="inline-block bg-[#CC4E00] hover:bg-[#A63F00] text-white px-6 py-3 rounded-lg font-semibold transition">
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {siparisler.map((s) => (
        <SiparisKarti key={s.id ?? s.orderNumber} siparis={s} />
      ))}

      {(sayfa > 1 || !sonSayfa) && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition">
            Önceki
          </button>
          <span className="text-sm text-gray-600">Sayfa {sayfa}</span>
          <button onClick={() => setSayfa((s) => s + 1)} disabled={sonSayfa}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition">
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}

/** Misafir sorgusu: siparis numarasi + e-posta. */
function SiparisSorgu() {
  const [siparisNo, setSiparisNo] = useState('');
  const [email, setEmail] = useState('');
  const [siparis, setSiparis] = useState<Siparis | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const sorgula = async (e: React.FormEvent) => {
    e.preventDefault();
    setYukleniyor(true);
    setHata('');
    setSiparis(null);

    try {
      const res = await fetch('/api/siparis-sorgula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siparisNo, email }),
      });
      const veri = await res.json();
      if (res.ok) setSiparis(veri);
      else setHata(veri.error || 'Sorgu yapılamadı');
    } catch {
      setHata('Bağlantı kurulamadı, lütfen tekrar deneyin');
    }

    setYukleniyor(false);
  };

  return (
    <>
      <form onSubmit={sorgula} className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="siparisNo" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Sipariş Numarası
            </label>
            <input id="siparisNo" value={siparisNo} onChange={(e) => setSiparisNo(e.target.value)} required
              placeholder="SG-2026-001"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-mono text-sm focus:border-[#FF6000] focus:outline-none focus:ring-1 focus:ring-[#FF6000]" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700">E-posta</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="ornek@eposta.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#FF6000] focus:outline-none focus:ring-1 focus:ring-[#FF6000]" />
          </div>
        </div>

        <button type="submit" disabled={yukleniyor}
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#CC4E00] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A63F00] disabled:bg-orange-300">
          <LuSearch size={15} />
          {yukleniyor ? 'Sorgulanıyor...' : 'Sorgula'}
        </button>

        {hata && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{hata}</p>
        )}
      </form>

      {siparis && (
        <div className="mt-6">
          <SiparisKarti siparis={siparis} />
        </div>
      )}
    </>
  );
}

export default function SiparislerimSayfasi() {
  const { musteri, yukleniyor } = useMusteri();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-screen-md px-4 py-6">
          <Link href={musteri ? '/hesabim' : '/'}
            className="mb-4 flex items-center gap-2 font-medium text-[#BA4700] transition hover:text-[#8F3700]">
            <LuArrowLeft size={18} /> {musteri ? 'Hesabım' : 'Geri'}
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <LuPackage size={22} className="text-[#BA4700]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {musteri ? 'Siparişlerim' : 'Sipariş Sorgula'}
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {musteri
              ? 'Hesabınıza bağlı siparişler burada listeleniyor.'
              : 'Sipariş numaranız ve sipariş sırasında kullandığınız e-posta ile durumunu görebilirsiniz.'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-8 space-y-8">
        {yukleniyor ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6000]" />
          </div>
        ) : musteri ? (
          <>
            <SiparisListesi />

            {/* Hesap acilmadan once verilmis siparisler hesaba bagli degil;
                giris yapmis musteri de onlari sorgulayabilmeli. */}
            <details className="rounded-2xl border border-gray-200 bg-white p-6">
              <summary className="cursor-pointer font-semibold text-gray-900">
                Hesabınızdan önce verdiğiniz bir siparişi mi arıyorsunuz?
              </summary>
              <p className="mt-3 mb-5 text-sm text-gray-600">
                Hesap açmadan önce verdiğiniz siparişler bu listede görünmez. Sipariş numarası ve
                e-posta ile sorgulayabilirsiniz.
              </p>
              <SiparisSorgu />
            </details>
          </>
        ) : (
          <>
            <SiparisSorgu />

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center">
              <p className="text-sm text-gray-700 mb-4">
                Hesap açarsanız siparişleriniz otomatik olarak burada listelenir; her seferinde
                numara girmeniz gerekmez.
              </p>
              <Link href="/kayit?devam=/siparislerim"
                className="inline-block bg-[#CC4E00] hover:bg-[#A63F00] text-white px-6 py-2.5 rounded-lg font-semibold transition">
                Hesap Oluştur
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
