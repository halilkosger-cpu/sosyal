'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LuCheckCircle, LuX, LuSparkles, LuShoppingBag } from 'react-icons/lu';

interface SosyalKanitOlayi {
  id: string;
  ad: string;
  sehir: string;
  eylem: 'siparis' | 'sepet' | 'inceleme';
  urunAdi: string;
  urunSlug: string;
  gorselUrl: string;
  zaman: string;
}

const ORNEK_OLAYLAR: SosyalKanitOlayi[] = [
  {
    id: 'sk_1',
    ad: 'Ayşe K.',
    sehir: 'Ankara',
    eylem: 'siparis',
    urunAdi: 'Bal & Arı Ürünleri',
    urunSlug: 'bal-ari-urunleri',
    gorselUrl: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426320257-bal-ari-urunleri-4MmrQbfLaPtjHUOTlgx7doMxvAB0sB.jpg',
    zaman: '2 dakika önce',
  },
  {
    id: 'sk_2',
    ad: 'Mehmet D.',
    sehir: 'İstanbul',
    eylem: 'siparis',
    urunAdi: 'Zeytinyağı - 500ml',
    urunSlug: 'zeytinyagi-500ml',
    gorselUrl: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426323077-zeytinyagi-500ml-TX8Qvee7nsNhBqI2DUBM5RaYmwe91d.jpg',
    zaman: '4 dakika önce',
  },
  {
    id: 'sk_3',
    ad: 'Fatma Y.',
    sehir: 'İzmir',
    eylem: 'sepet',
    urunAdi: 'Reçel Çeşitleri Paketi',
    urunSlug: 'recel-cesitleri',
    gorselUrl: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426321822-recel-cesitleri-70KHcaxT5s22UuJ9oD3smjsrI8NE9o.jpg',
    zaman: 'Az önce',
  },
  {
    id: 'sk_4',
    ad: 'Kemal B.',
    sehir: 'Bursa',
    eylem: 'siparis',
    urunAdi: 'Gül Kolonyası & Bakım',
    urunSlug: 'gul-kolonyasi',
    gorselUrl: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426323077-zeytinyagi-500ml-TX8Qvee7nsNhBqI2DUBM5RaYmwe91d.jpg',
    zaman: '6 dakika önce',
  },
  {
    id: 'sk_5',
    ad: 'Zeynep T.',
    sehir: 'Antalya',
    eylem: 'siparis',
    urunAdi: 'Dekoratif Ahşap Kutular',
    urunSlug: 'ahsap-kutular',
    gorselUrl: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426318188-kuru-fasulye-tahillar-efuxKijQTaJERnTqBBZvBckXGLw0AI.jpg',
    zaman: '3 dakika önce',
  },
  {
    id: 'sk_6',
    ad: 'Mustafa S.',
    sehir: 'Kayseri',
    eylem: 'sepet',
    urunAdi: 'Kuru Fasulye & Bakliyat',
    urunSlug: 'kuru-fasulye-tahillar',
    gorselUrl: 'https://bsvzh3olpntnziyt.public.blob.vercel-storage.com/products/1788426318188-kuru-fasulye-tahillar-efuxKijQTaJERnTqBBZvBckXGLw0AI.jpg',
    zaman: '1 dakika önce',
  },
];

export default function CanliSosyalKanit() {
  const [aktifOlay, setAktifOlay] = useState<SosyalKanitOlayi | null>(null);
  const [gorunur, setGorunur] = useState(false);
  const [kullaniciKapatti, setKullaniciKapatti] = useState(false);

  useEffect(() => {
    // Kullanıcı elle kapattıysa bir oturum boyunca rahatsız etme
    if (kullaniciKapatti) return;

    // Sayfa açıldıktan 6 saniye sonra ilk bildirimi tetikle
    const baslangicTimer = setTimeout(() => {
      bildirimGoster(0);
    }, 6000);

    return () => clearTimeout(baslangicTimer);
  }, [kullaniciKapatti]);

  const bildirimGoster = (indeks: number) => {
    if (kullaniciKapatti) return;

    const olay = ORNEK_OLAYLAR[indeks % ORNEK_OLAYLAR.length];
    setAktifOlay(olay);
    setGorunur(true);

    // 6.5 saniye ekranda kalsın
    const gizleTimer = setTimeout(() => {
      setGorunur(false);

      // 18-28 saniye sonra bir sonraki bildirimi göster
      const sonrakiGecikme = 18000 + Math.random() * 10000;
      setTimeout(() => {
        bildirimGoster(indeks + 1);
      }, sonrakiGecikme);
    }, 6500);

    return () => clearTimeout(gizleTimer);
  };

  if (!aktifOlay || kullaniciKapatti) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Canlı Sipariş Bildirimi"
      className={`fixed bottom-20 md:bottom-6 left-4 z-40 transition-all duration-500 ease-out transform ${
        gorunur ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="relative flex items-center gap-3.5 bg-white/95 backdrop-blur-md p-3 pr-8 rounded-2xl border border-gray-200/90 shadow-2xl max-w-[340px] sm:max-w-[370px] hover:shadow-orange-500/10 transition-all">
        {/* Kapat Butonu */}
        <button
          onClick={() => {
            setGorunur(false);
            setKullaniciKapatti(true);
          }}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          title="Kapat"
          aria-label="Bildirimi kapat"
        >
          <LuX size={13} />
        </button>

        {/* Ürün Görseli */}
        <Link
          href={`/urun/${aktifOlay.urunSlug}`}
          className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 group"
        >
          {aktifOlay.gorselUrl ? (
            <Image
              src={aktifOlay.gorselUrl}
              alt={aktifOlay.urunAdi}
              fill
              sizes="56px"
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-orange-50 text-[#CC4E00]">
              <LuShoppingBag size={20} />
            </div>
          )}
        </Link>

        {/* İçerik */}
        <div className="text-left flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
            <span className="text-gray-900 font-bold">{aktifOlay.ad}</span>
            <span>({aktifOlay.sehir})</span>
            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold text-[10px]">
              <LuCheckCircle size={11} /> Onaylı
            </span>
          </div>

          <Link
            href={`/urun/${aktifOlay.urunSlug}`}
            className="block text-xs font-bold text-gray-900 hover:text-[#CC4E00] truncate transition-colors mt-0.5"
            title={aktifOlay.urunAdi}
          >
            {aktifOlay.urunAdi}
          </Link>

          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                aktifOlay.eylem === 'siparis'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-orange-50 text-orange-700 border border-orange-200'
              }`}
            >
              {aktifOlay.eylem === 'siparis' ? '✓ Satın Aldı' : '🛒 Sepete Ekledi'}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">{aktifOlay.zaman}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
