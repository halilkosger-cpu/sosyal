'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LuArrowLeft, LuPackage, LuTruck, LuCheck, LuClock, LuSearch } from 'react-icons/lu';

/**
 * Misafir siparis sorgulama.
 *
 * Onceden bu sayfa localStorage'daki "userId" ile /api/user/orders'i
 * cagiriyordu. O deger istemcide uretilen sahte bir kimlikti
 * ("guest-user-<zaman>"), gercek bir kullaniciya karsilik gelmiyordu; sayfa
 * bu yuzden hicbir zaman siparis gosteremiyordu. Cagirdigi uc ise kimlik
 * dogrulamasi yapmiyordu.
 *
 * Sitede musteri hesabi yok. Bu yuzden sayfa artik siparis numarasi ve
 * sipariste kullanilan e-posta ile sorgulama yapiyor - ikisi birden dogruysa
 * yalnizca o siparis gosteriliyor.
 */

interface Kalem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; slug: string; imageUrl?: string | null };
}

interface Siparis {
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: Kalem[];
  urunAdedi: number;
}

const durumStili: Record<string, { renk: string; arka: string; Ikon: React.ElementType }> = {
  PENDING: { renk: 'text-yellow-700', arka: 'bg-yellow-50 border-yellow-200', Ikon: LuClock },
  CONFIRMED: { renk: 'text-blue-700', arka: 'bg-blue-50 border-blue-200', Ikon: LuCheck },
  SHIPPED: { renk: 'text-purple-700', arka: 'bg-purple-50 border-purple-200', Ikon: LuTruck },
  DELIVERED: { renk: 'text-green-700', arka: 'bg-green-50 border-green-200', Ikon: LuCheck },
  CANCELLED: { renk: 'text-red-700', arka: 'bg-red-50 border-red-200', Ikon: LuPackage },
};

const durumMetni: Record<string, string> = {
  PENDING: 'Ödeme Bekleniyor',
  CONFIRMED: 'Ödeme Onaylandı',
  SHIPPED: 'Gönderildi',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
};

export default function SiparisSorgulaPage() {
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

  const stil = siparis ? durumStili[siparis.status] : null;
  const DurumIkonu = stil?.Ikon ?? LuPackage;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-screen-md px-4 py-6">
          <Link
            href="/"
            className="mb-4 flex items-center gap-2 font-medium text-[#BA4700] transition hover:text-[#8F3700]"
          >
            <LuArrowLeft size={18} /> Geri
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <LuPackage size={22} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Sipariş Sorgula</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Sipariş numaranız ve sipariş sırasında kullandığınız e-posta ile durumunu
            görebilirsiniz.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-8">
        <form onSubmit={sorgula} className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="siparisNo" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Sipariş Numarası
              </label>
              <input
                id="siparisNo"
                value={siparisNo}
                onChange={(e) => setSiparisNo(e.target.value)}
                required
                placeholder="SG-2026-001"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-mono text-sm focus:border-[#FF6000] focus:outline-none focus:ring-1 focus:ring-[#FF6000]"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ornek@eposta.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#FF6000] focus:outline-none focus:ring-1 focus:ring-[#FF6000]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={yukleniyor}
            className="mt-4 flex items-center gap-2 rounded-xl bg-[#CC4E00] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A63F00] disabled:bg-orange-300"
          >
            <LuSearch size={15} />
            {yukleniyor ? 'Sorgulanıyor...' : 'Sorgula'}
          </button>

          {hata && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {hata}
            </p>
          )}
        </form>

        {siparis && (
          <div className={`mt-6 rounded-2xl border-2 bg-white p-6 ${stil?.arka}`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sipariş #{siparis.orderNumber}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(siparis.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <DurumIkonu size={20} className={stil?.renk} />
                <span className={`text-sm font-bold ${stil?.renk}`}>
                  {durumMetni[siparis.status] || siparis.status}
                </span>
              </div>
            </div>

            <div className="mb-4 space-y-3 border-b border-gray-200 pb-4">
              <p className="text-sm font-semibold text-gray-700">{siparis.urunAdedi} ürün</p>
              {siparis.items.map((k) => (
                <div key={k.id} className="flex items-center gap-3">
                  {k.product.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={k.product.imageUrl}
                      alt=""
                      className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <Link
                    href={`/urun/${k.product.slug}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 hover:text-[#BA4700]"
                  >
                    {k.product.name}
                  </Link>
                  <span className="flex-shrink-0 text-sm text-gray-500">×{k.quantity}</span>
                  <span className="flex-shrink-0 text-sm font-semibold text-gray-900">
                    ₺{(k.price * k.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {siparis.paymentMethod === 'TRANSFER' ? 'Havale / EFT' : 'Kredi Kartı'}
                {' · Kargo karşı ödemeli'}
              </span>
              <span className="text-xl font-bold text-[#BA4700]">
                ₺{siparis.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
